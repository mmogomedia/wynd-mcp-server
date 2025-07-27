import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { ErrorLog, ListParams } from '../../api/types/index.js';

/**
 * Error tracking resource handler for the MCP server
 * Provides comprehensive error logging and tracking capabilities for application debugging and monitoring.
 * This resource is public and accessible to everyone for transparency and collaborative debugging.
 */
export class ErrorResource implements Resource {
  // Resource interface implementation
  public readonly uri = 'wynd://errors';
  public readonly name = 'errors';
  public readonly description = 'Comprehensive error tracking and logging resource for application debugging, monitoring, and issue resolution. Supports error categorization, stack trace analysis, and solution tracking. Public access for collaborative debugging.';
  
  // Make all errors public by default
  public isPublic = true;
  async list(params?: ListParams): Promise<ErrorLog[]> {
    try {
      const response = await api.errors.list(params);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching errors:', error);
      return [];
    }
  }

  async read(uri: string): Promise<ErrorLog | null> {
    try {
      // Extract error ID from URI (e.g., 'wynd://errors/123' -> '123')
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid error URI: ${uri}`);
      }
      return await api.errors.get(id);
    } catch (error) {
      console.error(`Error fetching error with URI ${uri}:`, error);
      return null;
    }
  }

  async create(data: Omit<ErrorLog, 'id' | 'created_at' | 'updated_at' | 'status' | 'resolved_at' | 'resolved_by'>): Promise<ErrorLog> {
    try {
      // Required fields validation
      if (!data.error_type) {
        throw new Error('Error type is required');
      }
      if (!data.error_message) {
        throw new Error('Error message is required');
      }
      
      // Create error data with required fields and default values
      const errorData = {
        error_type: data.error_type,
        error_message: data.error_message,
        stack_trace: data.stack_trace,
        metadata: data.metadata,
        project_id: data.project_id,
        status: 'open' as const, // Default status
        resolved_at: null,
        resolved_by: null
      };
      
      // Call the API to track the error
      return await api.errors.track(errorData);
    } catch (error) {
      console.error('Error creating error log:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<ErrorLog>): Promise<ErrorLog | null> {
    try {
      // Extract error ID from URI
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid error URI: ${uri}`);
      }

      // Only allow updating specific fields
      if (data.status) {
        // Use the updateStatus endpoint if status is being updated
        return await api.errors.updateStatus(id, data.status);
      }
      
      // For other updates, get the existing error and merge with updates
      const existing = await this.read(uri);
      if (!existing) {
        throw new Error(`Error with URI ${uri} not found`);
      }
      
      // Only allow certain fields to be updated
      if (!data.error_type) {
        throw new Error('Error type is required for update');
      }
      
      if (!data.error_message) {
        throw new Error('Error message is required for update');
      }
      
      const allowedUpdates = {
        error_type: String(data.error_type), // Ensure error_type is a string
        error_message: String(data.error_message), // Ensure error_message is a string
        stack_trace: data.stack_trace,
        metadata: data.metadata,
        project_id: data.project_id,
      };
      
      // In a real implementation, we would call an update endpoint here
      // For now, return the merged data
      return {
        ...existing,
        ...allowedUpdates,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error updating error with URI ${uri}:`, error);
      throw error;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      // Extract error ID from URI
      const id = uri.split('/').pop();
      if (!id) {
        throw new Error(`Invalid error URI: ${uri}`);
      }
      
      // Call the API to delete the error
      await api.errors.delete(id);
    } catch (error) {
      console.error(`Error deleting error with URI ${uri}:`, error);
      throw error;
    }
  }

  // Additional error-specific methods
  async updateStatus(errorId: string, status: ErrorLog['status']): Promise<ErrorLog> {
    return api.errors.updateStatus(errorId, status);
  }

  async getByProject(projectId: string, params?: ListParams): Promise<ErrorLog[]> {
    const response = await api.errors.list({ ...params, project_id: projectId });
    return response.data;
  }

  async getOpenErrors(projectId?: string): Promise<ErrorLog[]> {
    const params: any = { status: 'open' };
    if (projectId) {
      params.project_id = projectId;
    }
    const response = await api.errors.list(params);
    return response.data;
  }

  async trackError(data: {
    error_type: string;
    error_message: string;
    stack_trace?: string;
    metadata?: Record<string, any>;
    project_id?: string;
  }): Promise<ErrorLog> {
    return this.create(data);
  }
}
