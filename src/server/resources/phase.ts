import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { Phase, ListParams } from '../../api/types/index.js';
import { config } from '../../config/index.js';

/**
 * Phase resource handler for the MCP server
 * Provides comprehensive phase management capabilities including listing, creating, updating, and deleting phases.
 * 
 * Phases are optional but highly recommended for better project organization. They help organize tasks into 
 * logical groups or time periods within a project, enabling better workflow management, milestone tracking, 
 * and project structure. While tasks can exist without phases, using phases significantly improves project 
 * visibility and organization.
 */
export class PhaseResource implements Resource {
  public readonly uri = 'wynd://phases';
  public readonly name = 'phases';
  public readonly description = 'Comprehensive phase management resource for creating, reading, updating, and deleting project phases. Phases are optional but highly recommended for organizing tasks into logical groups or time periods, improving project structure and workflow management. Supports filtering by status and ordering.';
  public isPublic = false;

  async list(params?: ListParams): Promise<Phase[]> {
    try {
      if (!params) {
        params = {
          project_id: config.project.defaultProjectId,
        };
      } else {
        params.project_id = config.project.defaultProjectId;
      }
      const response = await api.phases.list(params);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching phases:', error);
      return [];
    }
  }

  async read(uri: string): Promise<Phase | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) throw new Error(`Invalid phase URI: ${uri}`);
      return await api.phases.get(id);
    } catch (error) {
      console.error(`Error fetching phase with URI ${uri}:`, error);
      return null;
    }
  }

  async create(data: Omit<Phase, 'id' | 'created_at' | 'updated_at'>): Promise<Phase> {
    try {
      if (!data.title) throw new Error('Phase title is required');
      if (!data.project_id) throw new Error('Project ID is required');
      
      const phaseData = {
        title: data.title,
        description: data.description || null,
        status: data.status || 'planning',
        order: data.order || 1,
        project_id: data.project_id,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        color: data.color || undefined,
      };
      return await api.phases.create(phaseData);
    } catch (error) {
      console.error('Error creating phase:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<Phase>): Promise<Phase | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) throw new Error(`Invalid phase URI: ${uri}`);
      
      const allowedUpdates: Partial<Omit<Phase, 'id' | 'created_at' | 'updated_at'>> = {
        title: data.title,
        description: data.description,
        status: data.status,
        order: data.order,
        start_date: data.start_date,
        end_date: data.end_date,
        color: data.color,
      };
      return await api.phases.update(id, allowedUpdates);
    } catch (error) {
      console.error(`Error updating phase with URI ${uri}:`, error);
      return null;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      const id = uri.split('/').pop();
      if (!id) throw new Error(`Invalid phase URI: ${uri}`);
      await api.phases.delete(id);
    } catch (error) {
      console.error(`Error deleting phase with URI ${uri}:`, error);
      throw error;
    }
  }
}