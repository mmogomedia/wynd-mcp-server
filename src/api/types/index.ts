/**
 * Common base interface for all entities
 */
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Workspace related types
 */
export interface WorkspaceSettings {
  theme?: string;
  timezone?: string;
  locale?: string;
  features?: Record<string, boolean>;
}

export interface Workspace extends BaseEntity {
  name: string;
  description: string | null;
  owner_id: string;
  slug: string;
  settings: WorkspaceSettings;
  project_count?: number;
}

/**
 * Project related types
 */
export interface Project extends BaseEntity {
  title: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  owner_id: string;
  workspace_id: string | null;
}

/**
 * Task related types
 */
export interface Task extends BaseEntity {
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
}

/**
 * Document related types
 */
export interface Document extends BaseEntity {
  project_id: string;
  title: string;
  content: string;
  type: 'readme' | 'api' | 'guide' | 'spec' | 'other' | 'markdown';
  description?: string;
  created_by?: string;
  updated_by?: string;
  metadata?: Record<string, any>;
  size?: number;
  content_type?: string;
}

/**
 * Error tracking types
 */
export interface ErrorLog extends BaseEntity {
  project_id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolved_at?: string | null;
  resolved_by?: string | null;
}

/**
 * Prompt related types
 */
export interface Prompt extends BaseEntity {
  workspace_id: string;
  title: string;
  description: string | null;
  content: string;
  category_id: string | null;
  tags: string[];
  variables: Record<string, any>;
  version: number;
  parent_prompt_id: string | null;
  is_public: boolean;
  created_by: string;
}

/**
 * API Response types
 */
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ErrorResponse {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Request/Response types for API endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface ListParams extends PaginationParams, FilterParams {}

/**
 * Utility types
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
