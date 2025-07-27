import { ContextResource } from './resources/context.js';
import { ProjectResource } from './resources/project.js';
import { PhaseResource } from './resources/phase.js';
import { DocumentResource } from './resources/document.js';
import { ErrorResource } from './resources/error.js';
import { TaskResource } from './resources/task.js';
import { PromptResource } from './resources/prompt.js';
import { tools } from './tools/index.js';
import { HttpServerTransport } from './transport/http.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// Types for the MCP SDK
type ServerConstructor = new (options: { 
  name: string; 
  version: string; 
}) => any;

type StdioTransportConstructor = new () => any;

// Cache for loaded SDK components
let Server: ServerConstructor | null = null;
let StdioServerTransport: StdioTransportConstructor | null = null;

// Type guard to check if a value is a valid Server constructor
function isServerConstructor(value: any): value is ServerConstructor {
  return typeof value === 'function' && 
         value.prototype && 
         'connect' in value.prototype;
}

// Type guard to check if a value is a valid Transport constructor
function isTransportConstructor(value: any): value is StdioTransportConstructor {
  return typeof value === 'function';
}

/**
 * Loads the MCP SDK components using ESM imports
 * @returns Promise that resolves to an object containing the Server and StdioServerTransport classes
 */
async function loadSdk(): Promise<{ 
  Server: ServerConstructor; 
  StdioServerTransport: StdioTransportConstructor 
}> {
  // Return cached instances if available
  if (Server && StdioServerTransport) {
    return { 
      Server, 
      StdioServerTransport 
    };
  }

  try {
    logger.info('Attempting to load MCP SDK...');
    
    // @ts-ignore
    const sdk = await import('@modelcontextprotocol/sdk/server/index.js');
    // @ts-ignore
    const stdioSdk = await import('@modelcontextprotocol/sdk/server/stdio.js');
    
    // Extract the Server class with proper type checking
    const ServerClass = sdk.Server;
    
    if (!isServerConstructor(ServerClass)) {
      throw new Error('Invalid Server class in @modelcontextprotocol/sdk');
    }
    
    // Extract the StdioServerTransport class with proper type checking
    const TransportClass = stdioSdk.StdioServerTransport;
    
    if (!isTransportConstructor(TransportClass)) {
      throw new Error('Invalid StdioServerTransport in @modelcontextprotocol/sdk');
    }
    
    // Cache the loaded classes
    Server = ServerClass;
    StdioServerTransport = TransportClass;
    
    logger.info('Successfully loaded MCP SDK');
    
    return { 
      Server, 
      StdioServerTransport 
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to load MCP SDK:', error);
    throw new Error(`Failed to initialize MCP SDK: ${errorMessage}`);
  }
}

// Define the Server type from the SDK
type ServerType = {
  new (options: { name: string; version: string }): any;
  prototype: any;
};

/**
 * Main server class that sets up the MCP server with all resources and tools
 */
class WyndMcpServer {
  private server: any;
  private serverClass: ServerType | null = null;
  private stdioTransportClass: any = null;
  
  constructor() {
    // Server initialization will be done in the start method
    this.server = null;
  }
  
  /**
   * Initialize the server with the loaded SDK
   */
  private async initializeServer() {
    if (!this.serverClass) {
      try {
        const { Server: ServerClass, StdioServerTransport: TransportClass } = await loadSdk();
        this.serverClass = ServerClass;
        this.stdioTransportClass = TransportClass;
        
        if (!this.serverClass) {
          throw new Error('Failed to initialize MCP Server: Server class not found');
        }
        
        // Initialize the MCP server
        this.server = new this.serverClass({
          name: 'wynd',
          version: '1.5.1',
        });
        
        // Register capabilities after creation
        if (typeof this.server.registerCapabilities === 'function') {
          this.server.registerCapabilities({
            tools: {},
            resources: {},
            prompts: {},
            logging: {}
          });
        }
        
        // Initialize resources
        this.initializeResources();
      } catch (error) {
        logger.error('Failed to initialize server:', error);
        throw error;
      }
    }
  }
  
  /**
   * Initialize all tools using MCP SDK request handlers
   */
  private async initializeTools(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not initialized');
    }
    
    try {
      // Import MCP SDK schemas
      const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');
      
      // Register tools/list handler
      this.server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
      });

      // Register tools/call handler
      this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
        const { name, arguments: args } = request.params;
        
        const tool = tools.find(t => t.name === name);
        if (!tool) {
          throw new Error(`Tool '${name}' not found`);
        }
        
        try {
          const result = await tool.handler(args || {});
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          logger.error(`Error executing tool '${name}':`, error);
          throw error;
        }
      });
      
      logger.info('Registered tools:', {
        count: tools.length,
        tools: tools.map(t => t.name)
      });
    } catch (error) {
      logger.error('Failed to initialize tools:', error);
      // Don't throw error - continue without tools for now
      logger.warn('Continuing without tools functionality');
    }
  }

  /**
   * Initialize all resources
   */
  private initializeResources(): void {
    if (!this.server) {
      throw new Error('Server not initialized');
    }
    
    try {
      // Register all resources with the server, including context for project ID visibility
      const contextResource = new ContextResource();
      const projectResource = new ProjectResource();
      const phaseResource = new PhaseResource();
      const documentResource = new DocumentResource();
      const errorResource = new ErrorResource();
      const taskResource = new TaskResource();
      const promptResource = new PromptResource();
      
      // Check if the server has a resource method
      if (typeof this.server.resource === 'function') {
        this.server.resource(contextResource.uri, contextResource);
        this.server.resource(projectResource.uri, projectResource);
        this.server.resource(phaseResource.uri, phaseResource);
        this.server.resource(documentResource.uri, documentResource);
        this.server.resource(errorResource.uri, errorResource);
        this.server.resource(taskResource.uri, taskResource);
        this.server.resource(promptResource.uri, promptResource);
      } else {
        // Fallback to direct property assignment if resource method doesn't exist
        this.server.context = contextResource;
        this.server.projects = projectResource;
        this.server.phases = phaseResource;
        this.server.documents = documentResource;
        this.server.errors = errorResource;
        this.server.tasks = taskResource;
        this.server.prompts = promptResource;
      }
      
      logger.info('Registered resources:', {
        context: contextResource.uri,
        projects: projectResource.uri,
        phases: phaseResource.uri,
        documents: documentResource.uri,
        errors: errorResource.uri,
        tasks: taskResource.uri,
        prompts: promptResource.uri
      });
    } catch (error) {
      logger.error('Failed to initialize resources:', error);
      throw error;
    }
  }
  
  /**
   * Start the MCP server
   * @param transport The transport to use (http or stdio)
   * @returns A promise that resolves when the server is started
   */
  public async start(transport: 'http' | 'stdio' = 'http'): Promise<void> {
    try {
      logger.info(`Starting WYND MCP Server (${transport} transport)...`);
      
      // Ensure the server is initialized (async)
      await this.initializeServer();
      
      if (!this.server) {
        throw new Error('Server not initialized');
      }
      
      if (transport === 'http') {
        const httpTransport = new HttpServerTransport({
          port: config.server.port,
          host: 'localhost',
        });
        
        // Connect to the transport
        await this.server.connect(httpTransport);
        logger.info(`Server running at http://localhost:${config.server.port}`);
      } else {
        if (!this.stdioTransportClass) {
          throw new Error('StdioServerTransport not available');
        }
        
        const stdioTransport = new this.stdioTransportClass();
        await this.server.connect(stdioTransport);
        logger.info('Server running in stdio mode');
      }
      
      // Initialize tools after connection is established
      await this.initializeTools();
      
      return this.server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }
  
  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    try {
      if (!this.server) {
        logger.warn('Server not running');
        return;
      }
      
      logger.info('Stopping WYND MCP Server...');
      
      // Check if the server has a stop method
      if (typeof this.server.stop === 'function') {
        await this.server.stop();
      }
      
      // Reset server instance
      this.server = null;
      this.serverClass = null;
      this.stdioTransportClass = null;
      
      logger.info('Server stopped successfully');
    } catch (error) {
      logger.error('Error stopping server:', error);
      throw error;
    }
  }
  
  /**
   * Get the current status of the server
   */
  public getStatus(): { status: string; uptime: number; resources: number } {
    return {
      status: 'running',
      uptime: process.uptime(),
      resources: this.getResourceUris().length
    };
  }
  
  /**
   * Get all registered resource URIs
   */
  private getResourceUris(): string[] {
    return [
      'wynd://context',
      'wynd://projects',
      'wynd://phases',
      'wynd://documents',
      'wynd://errors',
      'wynd://tasks',
      'wynd://prompts'
    ];
  }
  
  /**
   * Log server information
   */
  private logServerInfo(): void {
    const serverInfo = this.getServerInfo();
    logger.info('WYND MCP Server Information:', {
      name: serverInfo.name,
      version: serverInfo.version,
      resources: this.getResourceUris(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    });
  }
  
  /**
   * Get server information
   */
  private getServerInfo(): { name: string; version: string; description: string } {
    return {
      name: 'wynd',
      version: '1.0.0',
      description: 'WYND Project Management MCP Server'
    };
  }
  
  /**
   * Register middleware for request/response handling
   * @param middleware Middleware function to register
   */
  public registerMiddleware(middleware: (req: any, res: any, next: () => void) => void): void {
    // Implementation depends on the underlying server framework
    // This is a placeholder for the actual implementation
    logger.debug('Registering middleware');
  }
  
  /**
   * Set up process event handlers
   */
  private setupProcessHandlers(): void {
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT. Shutting down gracefully...');
      await this.stop();
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM. Shutting down gracefully...');
      await this.stop();
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.stop().catch(err => {
        logger.error('Error during shutdown after uncaught exception:', err);
        process.exit(1);
      });
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }
}

// Export a singleton instance
export const wyndMcpServer = new WyndMcpServer();

/**
 * Start the WYND MCP server
 * @param options Server options including port, host, and transport type
 * @returns The server instance
 */
export const startServer = (options: {
  port: number;
  host?: string;
  transport: 'http' | 'stdio';
}) => {
  try {
    // Start the server with the specified transport type (synchronous)
    const server = wyndMcpServer.start(options.transport);
    
    // Handle process termination
    const handleShutdown = () => {
      logger.info('Shutting down server...');
      wyndMcpServer.stop()
        .then(() => {
          process.exit(0);
        })
        .catch((error: Error) => {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        });
    };
    
    // Handle process signals
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};
