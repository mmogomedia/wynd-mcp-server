import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { Prompt, ListParams } from '../../api/types/index.js';

/**
 * Prompt resource handler for the MCP server
 */
export class PromptResource implements Resource {
  // Resource interface implementation
  public readonly uri = 'wynd://prompts';
  public readonly name = 'prompts';
  public readonly description = 'Prompt library management resource';
  
  // Prompts are private by default (require authentication)
  public isPublic = false;

  async list(params?: ListParams): Promise<Prompt[]> {
    try {
      const response = await api.prompts.list(params);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }
  }

  async read(uri: string): Promise<Prompt | null> {
    try {
      // Extract prompt ID from URI (e.g., 'wynd://prompts/123' -> '123')
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid prompt URI: ${uri}`);
      }
      return await api.prompts.get(id);
    } catch (error) {
      console.error(`Error fetching prompt with URI ${uri}:`, error);
      return null;
    }
  }

  async create(data: Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'version'>): Promise<Prompt> {
    try {
      // Required fields validation
      if (!data.title) {
        throw new Error('Prompt title is required');
      }
      if (!data.content) {
        throw new Error('Prompt content is required');
      }
      if (!data.workspace_id) {
        throw new Error('Workspace ID is required for prompt creation');
      }
      
      // Prepare prompt data
      const promptData = {
        title: data.title,
        content: data.content,
        description: data.description || null,
        workspace_id: data.workspace_id,
        category_id: data.category_id || null,
        tags: data.tags || [],
        variables: data.variables || {},
        is_public: data.is_public || false,
        parent_prompt_id: data.parent_prompt_id || null,
      };
      
      // Call the API to create the prompt
      return await api.prompts.create(promptData);
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<Prompt>): Promise<Prompt | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid prompt URI: ${uri}`);
      }
      
      // Get the existing prompt
      const existing = await this.read(uri);
      if (!existing) {
        throw new Error(`Prompt with URI ${uri} not found`);
      }
      
      // Only allow certain fields to be updated
      const allowedUpdates: Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'version'>> = {
        title: data.title,
        content: data.content,
        description: data.description,
        category_id: data.category_id,
        tags: data.tags,
        variables: data.variables,
        is_public: data.is_public,
        parent_prompt_id: data.parent_prompt_id,
      };
      
      // Call the API to update the prompt
      return await api.prompts.update(id, allowedUpdates);
    } catch (error) {
      console.error(`Error updating prompt with URI ${uri}:`, error);
      throw error;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid prompt URI: ${uri}`);
      }
      
      await api.prompts.delete(id);
    } catch (error) {
      console.error(`Error deleting prompt with URI ${uri}:`, error);
      throw error;
    }
  }

  async search(query: string, workspaceId?: string): Promise<Prompt[]> {
    try {
      const params: ListParams = {
        search: query,
        ...(workspaceId && { workspace_id: workspaceId }),
      };
      return await this.list(params);
    } catch (error) {
      console.error('Error searching prompts:', error);
      return [];
    }
  }

  async getByCategory(categoryId: string, workspaceId?: string): Promise<Prompt[]> {
    try {
      const params: ListParams = {
        category_id: categoryId,
        ...(workspaceId && { workspace_id: workspaceId }),
      };
      return await this.list(params);
    } catch (error) {
      console.error('Error fetching prompts by category:', error);
      return [];
    }
  }

  async getByTags(tags: string[], workspaceId?: string): Promise<Prompt[]> {
    try {
      const params: ListParams = {
        tags: tags.join(','),
        ...(workspaceId && { workspace_id: workspaceId }),
      };
      return await this.list(params);
    } catch (error) {
      console.error('Error fetching prompts by tags:', error);
      return [];
    }
  }

  async trackUsage(data: {
    prompt_id: string;
    project_id?: string;
    execution_time_ms?: number;
    success: boolean;
    error_message?: string;
    input_variables?: Record<string, any>;
    output_result?: Record<string, any>;
  }): Promise<void> {
    try {
      await api.prompts.trackUsage(data);
    } catch (error) {
      console.error('Error tracking prompt usage:', error);
      throw error;
    }
  }
} 