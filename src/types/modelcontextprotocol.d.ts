// Type declarations for @modelcontextprotocol/sdk

declare module '@modelcontextprotocol/sdk' {
  export * from '@modelcontextprotocol/sdk/dist/esm/server/index.js';
  export * from '@modelcontextprotocol/sdk/dist/esm/server/stdio.js';
}

declare module '@modelcontextprotocol/sdk/dist/esm/server/index.js' {
  export * from '@modelcontextprotocol/sdk';
  export class Server {
    constructor(options: { 
      name: string; 
      version: string; 
      description: string;
    });
    
    connect(transport: any): Promise<void>;
    resource(uri: string, resource: any): void;
    use(middleware: (req: any, res: any, next: () => void) => void): void;
  }

  // Export other types that might be needed
  export interface Transport {
    // Add transport methods as needed
  }
}

declare module '@modelcontextprotocol/sdk/dist/esm/server/stdio.js' {
  import { Transport } from '@modelcontextprotocol/sdk/dist/esm/server/index.js';
  
  export class StdioServerTransport implements Transport {
    constructor();
  }
}

// Global type for the MCP SDK
declare namespace ModelContextProtocol {
  interface IServer {
    new (options: { 
      name: string; 
      version: string; 
      description: string 
    }): any;
    
    connect(transport: any): Promise<void>;
    resource(uri: string, resource: any): void;
  }

  interface IStdioServerTransport {
    new (): any;
  }
}

export {};
