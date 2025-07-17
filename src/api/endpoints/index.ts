import { wyndApi } from '../client.js';
import type {
  Workspace,
  Project,
  Task,
  Document,
  ErrorLog,
  Prompt,
  ListResponse,
  ListParams,
  ErrorResponse,
} from '../types/index.js';

/**
 * Workspace API endpoints
 */
export const workspaces = {
  list: (params?: ListParams): Promise<ListResponse<Workspace>> => 
    wyndApi.get('/api/workspaces', { params }),
    
  get: (id: string): Promise<Workspace> => 
    wyndApi.get(`/api/workspaces/${id}`),
    
  create: (data: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> =>
    wyndApi.post('/api/workspaces', data),
    
  update: (id: string, data: Partial<Omit<Workspace, 'id' | 'created_at' | 'updated_at'>>): Promise<Workspace> =>
    wyndApi.put(`/api/workspaces/${id}`, data),
    
  delete: (id: string): Promise<void> =>
    wyndApi.delete(`/api/workspaces/${id}`),
    
  getMembers: (workspaceId: string): Promise<any> => 
    wyndApi.get(`/api/workspaces/${workspaceId}/members`),
    
  getStats: (workspaceId: string): Promise<any> => 
    wyndApi.get(`/api/workspaces/${workspaceId}/stats`),
};

/**
 * Projects API endpoints
 */
export const projects = {
  list: (params?: ListParams): Promise<ListResponse<Project>> => 
    wyndApi.get('/api/projects', { params }),
    
  get: (id: string): Promise<Project> => 
    wyndApi.get(`/api/projects/${id}`),
    
  create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => 
    wyndApi.post('/api/projects', data),
    
  update: (id: string, data: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>): Promise<Project> => 
    wyndApi.put(`/api/projects/${id}`, data),
    
  delete: (id: string): Promise<void> => 
    wyndApi.delete(`/api/projects/${id}`),
    
  getStats: (projectId: string): Promise<any> => 
    wyndApi.get(`/api/projects/${projectId}/stats`),
};

/**
 * Tasks API endpoints
 */
export const tasks = {
  list: (params?: ListParams): Promise<ListResponse<Task>> => 
    wyndApi.get('/api/tasks', { params }),
    
  get: (id: string): Promise<Task> => 
    wyndApi.get(`/api/tasks/${id}`),
    
  create: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => 
    wyndApi.post('/api/tasks', data),
    
  update: (id: string, data: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => 
    wyndApi.put(`/api/tasks/${id}`, data),
    
  delete: (id: string): Promise<void> => 
    wyndApi.delete(`/api/tasks/${id}`),
};

/**
 * Documents API endpoints
 */
export const documents = {
  list: (params?: ListParams): Promise<ListResponse<Document>> => 
    wyndApi.get('/api/documents', { params }),
    
  get: (id: string): Promise<Document> => 
    wyndApi.get(`/api/documents/${id}`),
    
  create: (data: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Document> => 
    wyndApi.post('/api/documents', data),
    
  update: (id: string, data: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>): Promise<Document> => 
    wyndApi.put(`/api/documents/${id}`, data),
    
  delete: (id: string): Promise<void> => 
    wyndApi.delete(`/api/documents/${id}`),
};

/**
 * Error tracking API endpoints
 */
export const errors = {
  list: (params?: ListParams): Promise<ListResponse<ErrorLog>> => 
    wyndApi.get('/api/errors', { params }),
    
  get: (id: string): Promise<ErrorLog> => 
    wyndApi.get(`/api/errors/${id}`),
    
  track: (data: Omit<ErrorLog, 'id' | 'created_at' | 'updated_at' | 'status' | 'resolved_at' | 'resolved_by'>): Promise<ErrorLog> => 
    wyndApi.post('/api/errors', { ...data, status: 'open' }),
    
  updateStatus: (id: string, status: ErrorLog['status']): Promise<ErrorLog> => 
    wyndApi.put(`/api/errors/${id}/status`, { status }),
    
  delete: (id: string): Promise<void> => 
    wyndApi.delete(`/api/errors/${id}`),
};

/**
 * Prompts API endpoints
 */
export const prompts = {
  list: (params?: ListParams): Promise<ListResponse<Prompt>> => 
    wyndApi.get('/api/prompts', { params }),
    
  get: (id: string): Promise<Prompt> => 
    wyndApi.get(`/api/prompts/${id}`),
    
  create: (data: Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'version'>): Promise<Prompt> => 
    wyndApi.post('/api/prompts', data),
    
  update: (id: string, data: Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'version'>>): Promise<Prompt> => 
    wyndApi.put(`/api/prompts/${id}`, data),
    
  delete: (id: string): Promise<void> => 
    wyndApi.delete(`/api/prompts/${id}`),
    
  trackUsage: (data: {
    prompt_id: string;
    project_id?: string;
    execution_time_ms?: number;
    success: boolean;
    error_message?: string;
    input_variables?: Record<string, any>;
    output_result?: Record<string, any>;
  }): Promise<any> => wyndApi.post('/api/prompt-usage', data),
};

// Export all endpoints as a single object
export const api = {
  workspaces,
  projects,
  tasks,
  documents,
  errors,
  prompts,
};

export type { ErrorResponse };
