import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { Project, ListParams } from '../../api/types/index.js';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * Project resource handler for the MCP server
 * Provides read-only access to project information including project details, statistics, and related data.
 * Projects cannot be created, updated, or deleted through this MCP server for security reasons.
 */
export class ProjectResource implements Resource {
  // Resource interface implementation
  public readonly uri = 'wynd://projects';
  public readonly name = 'projects';
  public readonly description = 'Read-only project management resource for accessing project information, statistics, and metadata. Supports listing all projects and retrieving detailed project information including tasks, documents, and project stats.';
  
  // Make projects private by default (only accessible with valid token)
  public isPublic = false;
  /**
   * Get the default project ID from configuration
   */
  private getDefaultProjectId(): string | null {
    return config.project.defaultProjectId || null;
  }

  /**
   * Validate if a project exists and is accessible
   */
  private async validateProjectExists(projectId: string): Promise<boolean> {
    try {
      await api.projects.get(projectId);
      return true;
    } catch (error) {
      logger.warn(`Project with ID ${projectId} not found or not accessible`);
      return false;
    }
  }

  async list(params?: ListParams): Promise<Project[]> {
    try {
      const response = await api.projects.list(params);
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching projects:', error);
      return [];
    }
  }

  async read(uri: string): Promise<Project | null> {
    try {
      // If URI is 'default', try to use the default project ID
      if (uri === 'default' || uri.endsWith('/default')) {
        const defaultProjectId = this.getDefaultProjectId();
        if (!defaultProjectId) {
          throw new Error('No default project is configured');
        }
        return await this.read(`wynd://projects/${defaultProjectId}`);
      }

      // Extract project ID from URI (e.g., 'wynd://projects/123' -> '123')
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid project URI: ${uri}`);
      }
      return await api.projects.get(id);
    } catch (error) {
      logger.error(`Error fetching project with URI ${uri}:`, error);
      return null;
    }
  }

  // Projects are read-only - create, update, and delete operations are not supported
  async create(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    throw new Error('Project creation is not supported - projects are read-only');
  }

  async update(uri: string, data: Partial<Project>): Promise<Project | null> {
    throw new Error('Project updates are not supported - projects are read-only');
  }

  async delete(uri: string): Promise<void> {
    throw new Error('Project deletion is not supported - projects are read-only');
  }

  // Additional project-specific methods
  async getTasks(projectId: string, params?: ListParams) {
    return api.tasks.list({ ...params, project_id: projectId });
  }

  async getStats(projectId: string) {
    return api.projects.getStats(projectId);
  }

  async getDocuments(projectId: string, params?: ListParams) {
    return api.documents.list({ ...params, project_id: projectId });
  }
}
