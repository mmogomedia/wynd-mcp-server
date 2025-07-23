import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { Project, ListParams } from '../../api/types/index.js';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * Project resource handler for the MCP server
 */
export class ProjectResource implements Resource {
  // Resource interface implementation
  public readonly uri = 'wynd://projects';
  public readonly name = 'projects';
  public readonly description = 'Project management resource';
  
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

  async create(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    try {
      // Required fields validation
      if (!data.title) {
        throw new Error('Project title is required');
      }
      
      // If no workspace_id is provided and we have a default project, use its workspace
      if (!data.workspace_id) {
        const defaultProjectId = this.getDefaultProjectId();
        if (defaultProjectId) {
          const defaultProject = await this.read(`wynd://projects/${defaultProjectId}`);
          if (defaultProject) {
            data.workspace_id = defaultProject.workspace_id;
            logger.debug(`Using workspace from default project: ${data.workspace_id}`);
          }
        }
      }
      
      // Default values with required fields
      const projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
        title: data.title,
        description: data.description || null, // Match the Project interface which expects string | null
        status: data.status || 'active',
        workspace_id: data.workspace_id || null, // Match the Project interface which expects string | null
        owner_id: data.owner_id || 'system', // Default owner
      };
      
      // Call the API to create the project
      return await api.projects.create(projectData);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<Project>): Promise<Project | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid project URI: ${uri}`);
      }
      
      // Get the existing project
      const existing = await this.read(uri);
      if (!existing) {
        throw new Error(`Project with URI ${uri} not found`);
      }
      
      // Only allow certain fields to be updated
      const allowedUpdates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>> = {
        title: data.title,
        description: data.description,
        status: data.status,
        workspace_id: data.workspace_id,
      };
      
      // Call the API to update the project
      return await api.projects.update(id, allowedUpdates);
    } catch (error) {
      logger.error(`Error updating project with URI ${uri}:`, error);
      return null;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid project URI: ${uri}`);
      }
      
      // Call the API to delete the project
      await api.projects.delete(id);
    } catch (error) {
      console.error(`Error deleting project with URI ${uri}:`, error);
      throw error;
    }
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
