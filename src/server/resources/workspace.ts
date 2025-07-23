import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { Workspace, ListParams } from '../../api/types/index.js';
import { config } from '../../config/index.js';

/**
 * Workspace resource handler for the MCP server
 */
export class WorkspaceResource implements Resource {
  // Resource interface implementation
  public readonly uri = 'wynd://workspaces';
  public readonly name = 'workspaces';
  public readonly description = 'Workspace management resource';
  
  // Workspaces are private by default (require authentication)
  public isPublic = false;
  async list(params?: ListParams): Promise<Workspace[]> {
    try {
      const response = await api.workspaces.list(params);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }
  }

  async read(uri: string): Promise<Workspace | null> {
    try {
      // Extract workspace ID from URI (e.g., 'wynd://workspaces/123' -> '123')
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid workspace URI: ${uri}`);
      }
      return await api.workspaces.get(id);
    } catch (error) {
      console.error(`Error fetching workspace with URI ${uri}:`, error);
      return null;
    }
  }

  async create(data: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> {
    try {
      // Required fields validation
      if (!data.name) {
        throw new Error('Workspace name is required');
      }
      
      // Default values
      const workspaceData = {
        name: data.name,
        description: data.description || null,
        owner_id: data.owner_id || 'system', // Default to 'system' if not provided
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        settings: data.settings || {
          theme: 'light',
          timezone: 'UTC',
          locale: 'en-US',
          features: {}
        }
      };
      
      // Call the API to create the workspace
      return await api.workspaces.create(workspaceData);
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<Workspace>): Promise<Workspace | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid workspace URI: ${uri}`);
      }
      
      // Get the existing workspace
      const existing = await this.read(uri);
      if (!existing) {
        throw new Error(`Workspace with URI ${uri} not found`);
      }
      
      // Only allow certain fields to be updated
      const allowedUpdates: Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at'>> = {
        name: data.name,
        description: data.description,
        settings: data.settings,
        slug: data.slug,
      };
      
      // Call the API to update the workspace
      return await api.workspaces.update(id, allowedUpdates);
    } catch (error) {
      console.error(`Error updating workspace with URI ${uri}:`, error);
      throw error;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid workspace URI: ${uri}`);
      }
      
      // Call the API to delete the workspace
      await api.workspaces.delete(id);
    } catch (error) {
      console.error(`Error deleting workspace with URI ${uri}:`, error);
      throw error;
    }
  }

  // Additional workspace-specific methods
  async getMembers(workspaceId: string) {
    return api.workspaces.getMembers(workspaceId);
  }

  async getStats(workspaceId: string) {
    return api.workspaces.getStats(workspaceId);
  }
}
