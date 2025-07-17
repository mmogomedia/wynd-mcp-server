// Main module declaration
declare module '@modelcontextprotocol/sdk' {
  export * from '@modelcontextprotocol/sdk/dist/cjs/server';
  export * from '@modelcontextprotocol/sdk/dist/cjs/server/stdio';
}

// CJS server module
declare module '@modelcontextprotocol/sdk/dist/cjs/server' {
  export * from './index';
}

declare module '@modelcontextprotocol/sdk/dist/cjs/server/stdio' {
  export class StdioServerTransport {
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    onMessage(handler: (message: any) => Promise<any>): void;
    send(message: any): void;
  }
}

// CJS server module implementation
declare module '@modelcontextprotocol/sdk/dist/cjs/server' {
  /**
   * Represents a resource that can be registered with the MCP server
   */
  export interface Resource {
    /** The URI that identifies this resource */
    uri: string;
    
    /** A human-readable name for the resource */
    name: string;
    
    /** A description of what this resource provides */
    description?: string;
    
    /** Whether this resource is publicly accessible */
    isPublic?: boolean;
    
    /**
     * List resources
     * @param params Query parameters for filtering/sorting
     */
    list?(params?: any): Promise<any> | any;
    
    /**
     * Read a specific resource
     * @param id The ID of the resource to read
     */
    read?(id: string): Promise<any> | any;
    
    /**
     * Create a new resource
     * @param data The data for the new resource
     */
    create?(data: any): Promise<any> | any;
    
    /**
     * Update an existing resource
     * @param id The ID of the resource to update
     * @param data The updated data
     */
    update?(id: string, data: any): Promise<any> | any;
    
    /**
     * Delete a resource
     * @param id The ID of the resource to delete
     */
    delete?(id: string): Promise<void> | void;
  }

  /**
   * Options for configuring the MCP server
   */
  export interface ServerOptions {
    /** The name of the server */
    name?: string;
    
    /** The version of the server */
    version?: string;
    
    /** A description of the server */
    description?: string;
    
    /** Whether to enable debug logging */
    debug?: boolean;
  }

  /**
   * Represents a transport layer for the MCP server
   */
  export interface Transport {
    /** Start the transport */
    start(): Promise<void>;
    
    /** Stop the transport */
    stop(): Promise<void>;
    
    /** Register a message handler */
    onMessage(handler: (message: any) => Promise<any>): void;
    
    /** Send a message */
    send(message: any): void;
  }

  /**
   * The MCP server class
   */
  export class Server {
    constructor(options?: ServerOptions);
    
    /** Start the server */
    start(): Promise<void>;
    
    /** Stop the server */
    stop(): Promise<void>;
    
    /**
     * Register a resource with the server
     * @param uri The URI to register the resource at
     * @param resource The resource to register
     */
    resource(uri: string, resource: Resource): void;
    
    /**
     * Connect a transport to the server
     * @param transport The transport to connect
     */
    connect(transport: Transport): Promise<void>;
    
    /**
     * Disconnect a transport from the server
     * @param transport The transport to disconnect
     */
    disconnect(transport: Transport): Promise<void>;
  }

  /**
   * Standard I/O transport for MCP server
   */
  export class StdioServerTransport implements Transport {
    constructor();
    
    start(): Promise<void>;
    stop(): Promise<void>;
    onMessage(handler: (message: any) => Promise<any>): void;
    send(message: any): void;
  }
  
  /**
   * Message types for MCP protocol
   */
  export interface Message {
    /** Message type */
    type: string;
    
    /** Message ID */
    id?: string | number;
    
    /** Message payload */
    data?: any;
    
    /** Error information if the message represents an error */
    error?: {
      code: string | number;
      message: string;
      details?: any;
    };
    
    /** Stream information for streaming responses */
    stream?: {
      id: string;
      type: 'data' | 'end' | 'error';
      data?: any;
      error?: any;
    };
  }
}
