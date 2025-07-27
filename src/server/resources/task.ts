import { Resource } from './base.js';
import { api } from '../../api/endpoints/index.js';
import { Task, ListParams } from '../../api/types/index.js';
import { config } from '../../config/index.js';

/**
 * Task resource handler for the MCP server
 * Provides comprehensive task management capabilities including listing, creating, updating, and deleting tasks.
 * Tasks are automatically filtered to show 'in_progress' status by default unless otherwise specified.
 */
export class TaskResource implements Resource {
  public readonly uri = 'wynd://tasks';
  public readonly name = 'tasks';
  public readonly description = 'Comprehensive task management resource for creating, reading, updating, and deleting project tasks. Supports filtering by status, priority, assignee, and project. Default filter shows in-progress tasks only.';
  public isPublic = false;

  async list(params?: ListParams): Promise<Task[]> {
    try {
      if (!params) {
        params = {
          project_id: config.project.defaultProjectId,
          status: 'in_progress', // Default filter to in_progress tasks
        };
      } else {
        params.project_id = config.project.defaultProjectId;
        // If no status is specified, default to in_progress
        if (!params.status) {
          params.status = 'in_progress';
        }
      }
      const response = await api.tasks.list(params);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async read(uri: string): Promise<Task | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) throw new Error(`Invalid task URI: ${uri}`);
      return await api.tasks.get(id);
    } catch (error) {
      console.error(`Error fetching task with URI ${uri}:`, error);
      return null;
    }
  }

  async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      if (!data.title) throw new Error('Task title is required');
      if (!data.project_id) throw new Error('Project ID is required');
      // Only send fields the backend expects
      const taskData = {
        title: data.title,
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        project_id: data.project_id,
        assignee_id: data.assignee_id,
        created_by: data.created_by,
        due_date: data.due_date,
        completed_at: data.completed_at || null,
      };
      return await api.tasks.create(taskData);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async update(uri: string, data: Partial<Task>): Promise<Task | null> {
    try {
      const id = uri.split('/').pop();
      if (!id) throw new Error(`Invalid task URI: ${uri}`);
      // Only send fields the backend expects
      const allowedUpdates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>> = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date,
        assignee_id: data.assignee_id,
        completed_at: data.completed_at,
      };
      return await api.tasks.update(id, allowedUpdates);
    } catch (error) {
      console.error(`Error updating task with URI ${uri}:`, error);
      return null;
    }
  }

  async delete(uri: string): Promise<void> {
    try {
      const id = uri.split('/').pop();
      if (!id) throw new Error(`Invalid task URI: ${uri}`);
      await api.tasks.delete(id);
    } catch (error) {
      console.error(`Error deleting task with URI ${uri}:`, error);
      throw error;
    }
  }
} 