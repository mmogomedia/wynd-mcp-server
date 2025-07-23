/**
 * Base Resource interface for MCP server resources
 */
export interface Resource {
  uri: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
}

/**
 * Base Resource class implementation
 */
export class BaseResource implements Resource {
  public uri: string;
  public name?: string;
  public description?: string;
  public isPublic?: boolean;

  constructor(uri: string, name?: string, description?: string, isPublic = false) {
    this.uri = uri;
    this.name = name;
    this.description = description;
    this.isPublic = isPublic;
  }
}