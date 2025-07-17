import { Transport, Message } from '@modelcontextprotocol/sdk';
import { createServer, Server as HttpServer, IncomingMessage, ServerResponse, Server as NetServer } from 'http';
import { parse } from 'url';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * HTTP transport for the MCP server that supports streaming responses
 */
export interface HttpTransportOptions {
  /** Port to listen on */
  port?: number;
  
  /** Host to bind to */
  host?: string;
  
  /** Whether to enable CORS */
  cors?: boolean | {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
  };
  
  /** Request size limit */
  bodyLimit?: string | number;
  
  /** Enable/disable request logging */
  disableRequestLogging?: boolean;
}

/**
 * HTTP transport for the MCP server that supports streaming responses
 */
export class HttpServerTransport implements Transport {
  private server: HttpServer & {
    closeAllConnections?: () => void;
  };
  private messageHandler: ((message: Message) => Promise<Message>) | null = null;
  private connections: Set<ServerResponse> = new Set();
  private isRunning: boolean = false;

  constructor(private options: HttpTransportOptions = {}) {
    this.server = createServer(this.requestHandler.bind(this));
  }

  /**
   * Handle incoming HTTP requests
   */
  private async requestHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Track this connection
    this.connections.add(res);
    
    // Handle connection close
    req.on('close', () => {
      this.connections.delete(res);
    });
    
    // Log request if enabled
    if (!this.options.disableRequestLogging) {
      const startTime = Date.now();
      const { method, url } = req;
      
      // Log the complete request when response finishes
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`${method} ${url} ${res.statusCode} - ${duration}ms`);
      });
    }
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Only handle POST requests for MCP messages
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    try {
      // Parse the request body
      const body = await this.parseRequestBody(req);
      const message = JSON.parse(body) as Message;

      // Process the message if we have a handler
      if (this.messageHandler) {
        const response = await this.messageHandler(message);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/json');
        
        // For streaming responses, use Transfer-Encoding: chunked
        if (response.stream) {
          res.setHeader('Transfer-Encoding', 'chunked');
          
          // Send the initial response
          res.write(JSON.stringify(response) + '\n');
          
          // Handle the stream
          if (response.stream) {
            const stream = response.stream as unknown as NodeJS.ReadableStream;
            
            stream.on('data', (chunk: any) => {
              res.write(chunk);
            });
            
            stream.on('end', () => {
              res.end();
            });
            
            stream.on('error', (error: Error) => {
              logger.error('Stream error:', error);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Stream error' }));
              } else {
                res.end();
              }
            });
          }
        } else {
          // For non-streaming responses, send as JSON
          res.end(JSON.stringify(response));
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No message handler registered' }));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error handling request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Internal Server Error', 
        details: errorMessage 
      }));
    }
  }

  /**
   * Parse the request body as a string
   */
  private parseRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', reject);
    });
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('HTTP transport is already running');
    }
    return new Promise((resolve, reject) => {
      const port = this.options.port || config.server.port || 3000;
      const host = this.options.host || '0.0.0.0';
      
      const errorHandler = (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(error);
        }
      };
      
      this.server.on('error', errorHandler);
      
      this.server.listen(port, host, () => {
        this.isRunning = true;
        logger.info(`MCP HTTP server listening on http://${host}:${port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      // Close all active connections
      const closeConnections = () => {
        for (const connection of this.connections) {
          connection.end();
        }
        this.connections.clear();
      };
      
      // Force close server after timeout
      const forceShutdownTimer = setTimeout(() => {
        logger.warn('Forcing server shutdown after timeout');
        
        // Only call closeAllConnections if it exists (Node.js 18+)
        if (typeof this.server.closeAllConnections === 'function') {
          this.server.closeAllConnections();
        }
        
        this.server.close(() => {
          this.isRunning = false;
          resolve();
        });
      }, 5000);
      
      // Close server gracefully
      this.server.close((error) => {
        clearTimeout(forceShutdownTimer);
        this.isRunning = false;
        
        if (error) {
          closeConnections();
          reject(error);
        } else {
          closeConnections();
          resolve();
        }
      });
    });
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: Message) => Promise<Message>): void {
    this.messageHandler = handler;
  }

  /**
   * Send a message (not used in HTTP transport)
   */
  send(message: Message): void {
    // Not used in HTTP transport
    throw new Error('Send not supported in HTTP transport');
  }
}
