#!/usr/bin/env node

/**
 * WYND Project Management MCP Server
 * 
 * This MCP server provides tools and resources for interacting with the WYND
 * Project Management Software, enabling AI assistants to manage workspaces,
 * projects, tasks, and user profiles programmatically.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios, { AxiosInstance } from 'axios';

// Environment configuration
const WYND_API_URL = process.env.WYND_API_URL || 'https://wynd.mmogomedia.com';
const WYND_API_TOKEN = process.env.WYND_API_TOKEN;

if (!WYND_API_TOKEN) {
  throw new Error('WYND_API_TOKEN environment variable is required');
}

// TypeScript types matching WYND database schema
interface User {
  id: string;
  email: string;
  name: string;
  role: 'developer' | 'aiagent';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  owner_id: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  owner_id: string;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Agent {
  id: string;
  project_id: string;
  name: string;
  type: 'mcp' | 'custom' | 'builtin';
  config: any;
  status: 'active' | 'inactive' | 'error';
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string | null;
  agent_id: string | null;
  action: string;
  details: any;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string | null;
  joined_at: string;
}

interface OnboardingProgress {
  id: string;
  user_id: string;
  completed_steps: any;
  current_step: string;
  workspace_created: boolean;
  first_project_created: boolean;
  team_invited: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Prompt Library Interfaces
interface Prompt {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  content: string;
  category_id: string | null;
  tags: string[];
  variables: any;
  version: number;
  parent_prompt_id: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PromptCategory {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

interface PromptUsage {
  id: string;
  prompt_id: string;
  user_id: string;
  project_id: string | null;
  execution_time: number | null;
  success: boolean;
  error_message: string | null;
  input_variables: any;
  output_result: any;
  created_at: string;
}

interface PromptShare {
  id: string;
  prompt_id: string;
  shared_with_user_id: string | null;
  shared_with_workspace_id: string | null;
  permission: 'read' | 'write' | 'admin';
  shared_by: string;
  created_at: string;
}

interface PromptCollection {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PromptCollectionItem {
  id: string;
  collection_id: string;
  prompt_id: string;
  order_index: number;
  added_by: string;
  added_at: string;
}

// Create axios instance for WYND API
const wyndApi: AxiosInstance = axios.create({
  baseURL: WYND_API_URL,
  headers: {
    'Authorization': `Bearer ${WYND_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Create MCP server
const server = new Server(
  {
    name: "wynd-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * RESOURCES
 * Static and dynamic resources for accessing WYND data
 */

// Handler for listing available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "wynd://current-user/profile",
        mimeType: "application/json",
        name: "Current User Profile",
        description: "Profile information for the authenticated user"
      },
      {
        uri: "wynd://workspaces/list",
        mimeType: "application/json",
        name: "User Workspaces",
        description: "List of workspaces accessible to the authenticated user"
      },
      {
        uri: "wynd://projects/list",
        mimeType: "application/json",
        name: "User Projects",
        description: "List of projects accessible to the authenticated user"
      },
      {
        uri: "wynd://onboarding/status",
        mimeType: "application/json",
        name: "Onboarding Status",
        description: "Current onboarding progress for the authenticated user"
      }
    ]
  };
});

// Handler for reading resource contents
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const path = url.pathname;

  try {
    switch (path) {
      case "/current-user/profile": {
        const response = await wyndApi.get('/api/auth/user');
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "/workspaces/list": {
        const response = await wyndApi.get('/api/workspaces');
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "/projects/list": {
        const response = await wyndApi.get('/api/projects');
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "/onboarding/status": {
        const response = await wyndApi.get('/api/onboarding/status');
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      default: {
        // Handle dynamic resources like wynd://workspace/{id}/details
        const pathParts = path.split('/');
        
        if (pathParts[1] === 'workspace' && pathParts[3] === 'details') {
          const workspaceId = pathParts[2];
          const response = await wyndApi.get(`/api/workspaces/${workspaceId}`);
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        }

        if (pathParts[1] === 'workspace' && pathParts[3] === 'projects') {
          const workspaceId = pathParts[2];
          const response = await wyndApi.get(`/api/projects?workspace_id=${workspaceId}`);
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        }

        if (pathParts[1] === 'workspace' && pathParts[3] === 'members') {
          const workspaceId = pathParts[2];
          const response = await wyndApi.get(`/api/workspaces/${workspaceId}/members`);
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        }

        if (pathParts[1] === 'project' && pathParts[3] === 'details') {
          const projectId = pathParts[2];
          const response = await wyndApi.get(`/api/projects/${projectId}`);
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        }

        if (pathParts[1] === 'project' && pathParts[3] === 'tasks') {
          const projectId = pathParts[2];
          const response = await wyndApi.get(`/api/projects/${projectId}/tasks`);
          return {
            contents: [{
              uri: request.params.uri,
              mimeType: "application/json",
              text: JSON.stringify(response.data, null, 2)
            }]
          };
        }

        throw new Error(`Resource not found: ${path}`);
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`WYND API error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
});

/**
 * TOOLS
 * Interactive tools for managing WYND data
 */

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Workspace Management Tools
      {
        name: "create_workspace",
        description: "Create a new workspace",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the workspace"
            },
            description: {
              type: "string",
              description: "Description of the workspace"
            },
            slug: {
              type: "string",
              description: "URL-friendly slug for the workspace"
            }
          },
          required: ["name", "slug"]
        }
      },
      {
        name: "list_workspaces",
        description: "Get all workspaces for the authenticated user",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: "get_workspace",
        description: "Get detailed information about a specific workspace",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace to retrieve"
            }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "update_workspace",
        description: "Update workspace settings and metadata",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace to update"
            },
            name: {
              type: "string",
              description: "New name for the workspace"
            },
            description: {
              type: "string",
              description: "New description for the workspace"
            }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "invite_to_workspace",
        description: "Send workspace invitation to team members",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace"
            },
            email: {
              type: "string",
              description: "Email address to invite"
            },
            role: {
              type: "string",
              enum: ["admin", "member"],
              description: "Role for the invited user"
            }
          },
          required: ["workspace_id", "email", "role"]
        }
      },

      // Project Management Tools
      {
        name: "create_project",
        description: "Create a new project within a workspace",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the project"
            },
            description: {
              type: "string",
              description: "Description of the project"
            },
            workspace_id: {
              type: "string",
              description: "ID of the workspace to create the project in"
            },
            status: {
              type: "string",
              enum: ["active", "archived", "completed"],
              description: "Initial status of the project"
            }
          },
          required: ["title", "workspace_id"]
        }
      },
      {
        name: "list_projects",
        description: "Get projects (filtered by workspace, status, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "Filter by workspace ID"
            },
            status: {
              type: "string",
              enum: ["active", "archived", "completed"],
              description: "Filter by project status"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_project",
        description: "Get detailed information about a specific project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to retrieve"
            }
          },
          required: ["project_id"]
        }
      },
      {
        name: "update_project",
        description: "Update project details and status",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to update"
            },
            title: {
              type: "string",
              description: "New title for the project"
            },
            description: {
              type: "string",
              description: "New description for the project"
            },
            status: {
              type: "string",
              enum: ["active", "archived", "completed"],
              description: "New status for the project"
            }
          },
          required: ["project_id"]
        }
      },
      {
        name: "delete_project",
        description: "Archive or delete a project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to delete"
            }
          },
          required: ["project_id"]
        }
      },

      // User & Authentication Tools
      {
        name: "get_user_profile",
        description: "Get current user profile information",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: "update_user_profile",
        description: "Update user profile details",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "New name for the user"
            },
            avatar_url: {
              type: "string",
              description: "New avatar URL for the user"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "list_workspace_members",
        description: "Get workspace team members",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace"
            }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "get_onboarding_status",
        description: "Check user's onboarding progress",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },

      // Analytics & Reporting Tools
      {
        name: "get_workspace_stats",
        description: "Get workspace analytics (project count, member count, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace"
            }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "get_project_stats",
        description: "Get project-specific metrics",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project"
            }
          },
          required: ["project_id"]
        }
      },
      {
        name: "generate_activity_report",
        description: "Generate activity summaries",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace (optional)"
            },
            project_id: {
              type: "string",
              description: "ID of the project (optional)"
            },
            days: {
              type: "number",
              description: "Number of days to include in the report",
              minimum: 1,
              maximum: 90
            }
          },
          additionalProperties: false
        }
      },

      // Task Management Tools
      {
        name: "create_task",
        description: "Create a new task within a project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to create the task in"
            },
            title: {
              type: "string",
              description: "Title of the task"
            },
            description: {
              type: "string",
              description: "Description of the task"
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Priority level of the task"
            },
            due_date: {
              type: "string",
              description: "Due date for the task (ISO 8601 format)"
            },
            assigned_to: {
              type: "string",
              description: "User ID to assign the task to"
            }
          },
          required: ["project_id", "title"]
        }
      },
      {
        name: "list_tasks",
        description: "Get tasks (filtered by project, status, assignee, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Filter by project ID"
            },
            status: {
              type: "string",
              enum: ["todo", "in_progress", "done", "blocked"],
              description: "Filter by task status"
            },
            assigned_to: {
              type: "string",
              description: "Filter by assignee user ID"
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Filter by priority level"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_task",
        description: "Get detailed information about a specific task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to retrieve"
            }
          },
          required: ["task_id"]
        }
      },
      {
        name: "update_task",
        description: "Update task details and status",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to update"
            },
            title: {
              type: "string",
              description: "New title for the task"
            },
            description: {
              type: "string",
              description: "New description for the task"
            },
            status: {
              type: "string",
              enum: ["todo", "in_progress", "done", "blocked"],
              description: "New status for the task"
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "New priority for the task"
            },
            due_date: {
              type: "string",
              description: "New due date for the task (ISO 8601 format)"
            },
            assigned_to: {
              type: "string",
              description: "New assignee user ID"
            }
          },
          required: ["task_id"]
        }
      },
      {
        name: "delete_task",
        description: "Delete a task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to delete"
            }
          },
          required: ["task_id"]
        }
      },
      {
        name: "assign_task",
        description: "Assign a task to a user",
        inputSchema: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to assign"
            },
            assigned_to: {
              type: "string",
              description: "User ID to assign the task to"
            }
          },
          required: ["task_id", "assigned_to"]
        }
      },
      {
        name: "create_subtask",
        description: "Create a subtask under a parent task",
        inputSchema: {
          type: "object",
          properties: {
            parent_task_id: {
              type: "string",
              description: "ID of the parent task"
            },
            title: {
              type: "string",
              description: "Title of the subtask"
            },
            description: {
              type: "string",
              description: "Description of the subtask"
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Priority level of the subtask"
            },
            due_date: {
              type: "string",
              description: "Due date for the subtask (ISO 8601 format)"
            },
            assigned_to: {
              type: "string",
              description: "User ID to assign the subtask to"
            }
          },
          required: ["parent_task_id", "title"]
        }
      },
      {
        name: "list_subtasks",
        description: "Get subtasks for a parent task",
        inputSchema: {
          type: "object",
          properties: {
            parent_task_id: {
              type: "string",
              description: "ID of the parent task"
            }
          },
          required: ["parent_task_id"]
        }
      },

      // Documentation Management Tools
      {
        name: "create_document",
        description: "Create a new document within a project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to create the document in"
            },
            title: {
              type: "string",
              description: "Title of the document"
            },
            content: {
              type: "string",
              description: "Content of the document (markdown supported)"
            },
            type: {
              type: "string",
              enum: ["readme", "api", "guide", "spec", "other"],
              description: "Type of document"
            }
          },
          required: ["project_id", "title", "content"]
        }
      },
      {
        name: "list_documents",
        description: "Get documents (filtered by project, type, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Filter by project ID"
            },
            type: {
              type: "string",
              enum: ["readme", "api", "guide", "spec", "other"],
              description: "Filter by document type"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_document",
        description: "Get detailed information about a specific document",
        inputSchema: {
          type: "object",
          properties: {
            document_id: {
              type: "string",
              description: "ID of the document to retrieve"
            }
          },
          required: ["document_id"]
        }
      },
      {
        name: "update_document",
        description: "Update document content and metadata",
        inputSchema: {
          type: "object",
          properties: {
            document_id: {
              type: "string",
              description: "ID of the document to update"
            },
            title: {
              type: "string",
              description: "New title for the document"
            },
            content: {
              type: "string",
              description: "New content for the document"
            },
            type: {
              type: "string",
              enum: ["readme", "api", "guide", "spec", "other"],
              description: "New type for the document"
            }
          },
          required: ["document_id"]
        }
      },
      {
        name: "delete_document",
        description: "Delete a document",
        inputSchema: {
          type: "object",
          properties: {
            document_id: {
              type: "string",
              description: "ID of the document to delete"
            }
          },
          required: ["document_id"]
        }
      },

      // Error Tracking and Activity Logging Tools
      {
        name: "log_activity",
        description: "Log an activity or event",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project (optional for global activities)"
            },
            action: {
              type: "string",
              description: "Action or event type"
            },
            details: {
              type: "string",
              description: "Detailed description of the activity"
            },
            metadata: {
              type: "object",
              description: "Additional metadata for the activity"
            }
          },
          required: ["action"]
        }
      },
      {
        name: "get_activity_logs",
        description: "Get activity logs (filtered by project, action, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Filter by project ID"
            },
            action: {
              type: "string",
              description: "Filter by action type"
            },
            limit: {
              type: "number",
              description: "Maximum number of logs to return",
              minimum: 1,
              maximum: 100
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "track_error",
        description: "Track an error or exception",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project (optional for global errors)"
            },
            error_type: {
              type: "string",
              description: "Type or category of the error"
            },
            error_message: {
              type: "string",
              description: "Error message or description"
            },
            stack_trace: {
              type: "string",
              description: "Stack trace or additional error details"
            },
            metadata: {
              type: "object",
              description: "Additional error metadata"
            }
          },
          required: ["error_type", "error_message"]
        }
      },
      {
        name: "list_errors",
        description: "Get tracked errors (filtered by project, type, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Filter by project ID"
            },
            error_type: {
              type: "string",
              description: "Filter by error type"
            },
            limit: {
              type: "number",
              description: "Maximum number of errors to return",
              minimum: 1,
              maximum: 100
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "create_agent",
        description: "Create a new AI agent or automation",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the agent"
            },
            type: {
              type: "string",
              enum: ["ai_assistant", "automation", "monitor", "other"],
              description: "Type of agent"
            },
            config: {
              type: "object",
              description: "Configuration settings for the agent"
            },
            project_id: {
              type: "string",
              description: "ID of the project (optional for global agents)"
            }
          },
          required: ["name", "type"]
        }
      },
      {
        name: "list_agents",
        description: "Get agents (filtered by project, type, status, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Filter by project ID"
            },
            type: {
              type: "string",
              enum: ["ai_assistant", "automation", "monitor", "other"],
              description: "Filter by agent type"
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "error"],
              description: "Filter by agent status"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "update_agent_status",
        description: "Update the status of an agent",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: {
              type: "string",
              description: "ID of the agent to update"
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "error"],
              description: "New status for the agent"
            }
          },
          required: ["agent_id", "status"]
        }
      },

      // Prompt Management Tools
      {
        name: "create_prompt",
        description: "Create a new prompt in the library",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace to create the prompt in"
            },
            title: {
              type: "string",
              description: "Title of the prompt"
            },
            description: {
              type: "string",
              description: "Description of the prompt"
            },
            content: {
              type: "string",
              description: "Content/template of the prompt"
            },
            category_id: {
              type: "string",
              description: "ID of the category to assign the prompt to"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for the prompt"
            },
            variables: {
              type: "object",
              description: "Template variables for the prompt"
            },
            parent_prompt_id: {
              type: "string",
              description: "ID of parent prompt for versioning"
            },
            is_public: {
              type: "boolean",
              description: "Whether the prompt is publicly accessible"
            }
          },
          required: ["workspace_id", "title", "content"]
        }
      },
      {
        name: "list_prompts",
        description: "Get prompts (filtered by workspace, category, tags, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "Filter by workspace ID"
            },
            category_id: {
              type: "string",
              description: "Filter by category ID"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Filter by tags"
            },
            is_public: {
              type: "boolean",
              description: "Filter by public/private status"
            },
            search: {
              type: "string",
              description: "Search in title and content"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "get_prompt",
        description: "Get detailed information about a specific prompt",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "ID of the prompt to retrieve"
            }
          },
          required: ["prompt_id"]
        }
      },
      {
        name: "update_prompt",
        description: "Update prompt content and metadata",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "ID of the prompt to update"
            },
            title: {
              type: "string",
              description: "New title for the prompt"
            },
            description: {
              type: "string",
              description: "New description for the prompt"
            },
            content: {
              type: "string",
              description: "New content for the prompt"
            },
            category_id: {
              type: "string",
              description: "New category ID for the prompt"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "New tags for the prompt"
            },
            variables: {
              type: "object",
              description: "New template variables for the prompt"
            },
            is_public: {
              type: "boolean",
              description: "New public/private status"
            }
          },
          required: ["prompt_id"]
        }
      },
      {
        name: "delete_prompt",
        description: "Delete a prompt from the library",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "ID of the prompt to delete"
            }
          },
          required: ["prompt_id"]
        }
      },
      {
        name: "create_prompt_category",
        description: "Create a new prompt category",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace to create the category in"
            },
            name: {
              type: "string",
              description: "Name of the category"
            },
            description: {
              type: "string",
              description: "Description of the category"
            },
            color: {
              type: "string",
              description: "Color code for the category"
            }
          },
          required: ["workspace_id", "name"]
        }
      },
      {
        name: "list_prompt_categories",
        description: "Get prompt categories for a workspace",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace"
            }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "track_prompt_usage",
        description: "Track usage of a prompt",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "ID of the prompt used"
            },
            project_id: {
              type: "string",
              description: "ID of the project (optional)"
            },
            execution_time: {
              type: "number",
              description: "Execution time in milliseconds"
            },
            success: {
              type: "boolean",
              description: "Whether the execution was successful"
            },
            error_message: {
              type: "string",
              description: "Error message if execution failed"
            },
            input_variables: {
              type: "object",
              description: "Input variables used"
            },
            output_result: {
              type: "object",
              description: "Output result from execution"
            }
          },
          required: ["prompt_id", "success"]
        }
      },
      {
        name: "get_prompt_usage",
        description: "Get usage analytics for prompts",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "Filter by specific prompt ID"
            },
            workspace_id: {
              type: "string",
              description: "Filter by workspace ID"
            },
            project_id: {
              type: "string",
              description: "Filter by project ID"
            },
            days: {
              type: "number",
              description: "Number of days to include in analytics",
              minimum: 1,
              maximum: 90
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "share_prompt",
        description: "Share a prompt with users or workspaces",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "ID of the prompt to share"
            },
            shared_with_user_id: {
              type: "string",
              description: "ID of user to share with"
            },
            shared_with_workspace_id: {
              type: "string",
              description: "ID of workspace to share with"
            },
            permission: {
              type: "string",
              enum: ["read", "write", "admin"],
              description: "Permission level for the share"
            }
          },
          required: ["prompt_id", "permission"]
        }
      },
      {
        name: "list_prompt_shares",
        description: "Get sharing information for prompts",
        inputSchema: {
          type: "object",
          properties: {
            prompt_id: {
              type: "string",
              description: "Filter by specific prompt ID"
            }
          },
          additionalProperties: false
        }
      },
      {
        name: "create_prompt_collection",
        description: "Create a new prompt collection",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace to create the collection in"
            },
            name: {
              type: "string",
              description: "Name of the collection"
            },
            description: {
              type: "string",
              description: "Description of the collection"
            }
          },
          required: ["workspace_id", "name"]
        }
      },
      {
        name: "list_prompt_collections",
        description: "Get prompt collections for a workspace",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: {
              type: "string",
              description: "ID of the workspace"
            }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "add_prompt_to_collection",
        description: "Add a prompt to a collection",
        inputSchema: {
          type: "object",
          properties: {
            collection_id: {
              type: "string",
              description: "ID of the collection"
            },
            prompt_id: {
              type: "string",
              description: "ID of the prompt to add"
            },
            order_index: {
              type: "number",
              description: "Order index in the collection"
            }
          },
          required: ["collection_id", "prompt_id"]
        }
      },
      {
        name: "remove_prompt_from_collection",
        description: "Remove a prompt from a collection",
        inputSchema: {
          type: "object",
          properties: {
            collection_id: {
              type: "string",
              description: "ID of the collection"
            },
            prompt_id: {
              type: "string",
              description: "ID of the prompt to remove"
            }
          },
          required: ["collection_id", "prompt_id"]
        }
      },
      {
        name: "list_collection_prompts",
        description: "Get prompts in a collection",
        inputSchema: {
          type: "object",
          properties: {
            collection_id: {
              type: "string",
              description: "ID of the collection"
            }
          },
          required: ["collection_id"]
        }
      }
    ]
  };
});

// Handler for tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      // Workspace Management Tools
      case "create_workspace": {
        const { name, description, slug } = request.params.arguments as {
          name: string;
          description?: string;
          slug: string;
        };

        const response = await wyndApi.post('/api/workspaces', {
          name,
          description,
          slug
        });

        return {
          content: [{
            type: "text",
            text: `Created workspace "${name}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_workspaces": {
        const response = await wyndApi.get('/api/workspaces');
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_workspace": {
        const { workspace_id } = request.params.arguments as { workspace_id: string };
        const response = await wyndApi.get(`/api/workspaces/${workspace_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_workspace": {
        const { workspace_id, name, description } = request.params.arguments as {
          workspace_id: string;
          name?: string;
          description?: string;
        };

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;

        const response = await wyndApi.put(`/api/workspaces/${workspace_id}`, updateData);
        return {
          content: [{
            type: "text",
            text: `Updated workspace ${workspace_id}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "invite_to_workspace": {
        const { workspace_id, email, role } = request.params.arguments as {
          workspace_id: string;
          email: string;
          role: string;
        };

        const response = await wyndApi.post(`/api/workspaces/${workspace_id}/invite`, {
          email,
          role
        });

        return {
          content: [{
            type: "text",
            text: `Sent invitation to ${email} for workspace ${workspace_id} with role ${role}`
          }]
        };
      }

      // Project Management Tools
      case "create_project": {
        const { title, description, workspace_id, status } = request.params.arguments as {
          title: string;
          description?: string;
          workspace_id: string;
          status?: string;
        };

        const response = await wyndApi.post('/api/projects', {
          title,
          description,
          workspace_id,
          status: status || 'active'
        });

        return {
          content: [{
            type: "text",
            text: `Created project "${title}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_projects": {
        const { workspace_id, status } = request.params.arguments as {
          workspace_id?: string;
          status?: string;
        };

        let url = '/api/projects';
        const params = new URLSearchParams();
        if (workspace_id) params.append('workspace_id', workspace_id);
        if (status) params.append('status', status);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_project": {
        const { project_id } = request.params.arguments as { project_id: string };
        const response = await wyndApi.get(`/api/projects/${project_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_project": {
        const { project_id, title, description, status } = request.params.arguments as {
          project_id: string;
          title?: string;
          description?: string;
          status?: string;
        };

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (status) updateData.status = status;

        const response = await wyndApi.put(`/api/projects/${project_id}`, updateData);
        return {
          content: [{
            type: "text",
            text: `Updated project ${project_id}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "delete_project": {
        const { project_id } = request.params.arguments as { project_id: string };
        await wyndApi.delete(`/api/projects/${project_id}`);
        return {
          content: [{
            type: "text",
            text: `Deleted project ${project_id}`
          }]
        };
      }

      // User & Authentication Tools
      case "get_user_profile": {
        const response = await wyndApi.get('/api/auth/user');
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_user_profile": {
        const { name, avatar_url } = request.params.arguments as {
          name?: string;
          avatar_url?: string;
        };

        const updateData: any = {};
        if (name) updateData.name = name;
        if (avatar_url) updateData.avatar_url = avatar_url;

        const response = await wyndApi.put('/api/auth/user', updateData);
        return {
          content: [{
            type: "text",
            text: `Updated user profile: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "list_workspace_members": {
        const { workspace_id } = request.params.arguments as { workspace_id: string };
        const response = await wyndApi.get(`/api/workspaces/${workspace_id}/members`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_onboarding_status": {
        const response = await wyndApi.get('/api/onboarding/status');
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      // Analytics & Reporting Tools
      case "get_workspace_stats": {
        const { workspace_id } = request.params.arguments as { workspace_id: string };
        const response = await wyndApi.get(`/api/workspaces/${workspace_id}/stats`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_project_stats": {
        const { project_id } = request.params.arguments as { project_id: string };
        const response = await wyndApi.get(`/api/projects/${project_id}/stats`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "generate_activity_report": {
        const { workspace_id, project_id, days = 7 } = request.params.arguments as {
          workspace_id?: string;
          project_id?: string;
          days?: number;
        };

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let report: any = {
          period: `Last ${days} days`,
          generated_at: new Date().toISOString()
        };

        if (workspace_id) {
          const [workspace, projects] = await Promise.all([
            wyndApi.get(`/api/workspaces/${workspace_id}`),
            wyndApi.get(`/api/projects?workspace_id=${workspace_id}`)
          ]);

          const projectsArray = Array.isArray(projects.data) ? projects.data : [];
          const recentProjects = projectsArray.filter((p: Project) =>
            new Date(p.updated_at) > cutoffDate
          );

          report.workspace = workspace.data.name;
          report.recent_project_activity = recentProjects.length;
          report.recent_projects = recentProjects.map((p: Project) => ({
            title: p.title,
            status: p.status,
            updated_at: p.updated_at
          }));
        }

        if (project_id) {
          const project = await wyndApi.get(`/api/projects/${project_id}`);
          report.project = project.data.title;
          report.project_updated = new Date(project.data.updated_at) > cutoffDate;
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(report, null, 2)
          }]
        };
      }

      // Task Management Tools
      case "create_task": {
        const { project_id, title, description, priority, due_date, assigned_to } = request.params.arguments as {
          project_id: string;
          title: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string;
          assigned_to?: string;
        };

        const response = await wyndApi.post(`/api/projects/${project_id}/tasks`, {
          title,
          description,
          priority: priority || 'medium',
          due_date,
          assigned_to
        });

        return {
          content: [{
            type: "text",
            text: `Created task "${title}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_tasks": {
        const { project_id, status, assigned_to, priority } = request.params.arguments as {
          project_id?: string;
          status?: 'todo' | 'in_progress' | 'done' | 'blocked';
          assigned_to?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
        };

        let url = '/api/tasks';
        const params = new URLSearchParams();
        
        if (project_id) params.append('project_id', project_id);
        if (status) params.append('status', status);
        if (assigned_to) params.append('assigned_to', assigned_to);
        if (priority) params.append('priority', priority);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_task": {
        const { task_id } = request.params.arguments as { task_id: string };
        const response = await wyndApi.get(`/api/tasks/${task_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_task": {
        const { task_id, title, description, status, priority, due_date, assigned_to } = request.params.arguments as {
          task_id: string;
          title?: string;
          description?: string;
          status?: 'todo' | 'in_progress' | 'done' | 'blocked';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string;
          assigned_to?: string;
        };

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (due_date !== undefined) updateData.due_date = due_date;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

        const response = await wyndApi.put(`/api/tasks/${task_id}`, updateData);
        return {
          content: [{
            type: "text",
            text: `Updated task ${task_id}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "delete_task": {
        const { task_id } = request.params.arguments as { task_id: string };
        await wyndApi.delete(`/api/tasks/${task_id}`);
        return {
          content: [{
            type: "text",
            text: `Deleted task ${task_id}`
          }]
        };
      }

      case "assign_task": {
        const { task_id, assigned_to } = request.params.arguments as {
          task_id: string;
          assigned_to: string;
        };

        const response = await wyndApi.put(`/api/tasks/${task_id}`, { assigned_to });
        return {
          content: [{
            type: "text",
            text: `Assigned task ${task_id} to user ${assigned_to}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "create_subtask": {
        const { parent_task_id, title, description, priority, due_date, assigned_to } = request.params.arguments as {
          parent_task_id: string;
          title: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          due_date?: string;
          assigned_to?: string;
        };

        const response = await wyndApi.post(`/api/tasks/${parent_task_id}/subtasks`, {
          title,
          description,
          priority: priority || 'medium',
          due_date,
          assigned_to
        });

        return {
          content: [{
            type: "text",
            text: `Created subtask "${title}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_subtasks": {
        const { parent_task_id } = request.params.arguments as { parent_task_id: string };
        const response = await wyndApi.get(`/api/tasks/${parent_task_id}/subtasks`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      // Documentation Management Tools
      case "create_document": {
        const { project_id, title, content, type } = request.params.arguments as {
          project_id: string;
          title: string;
          content: string;
          type?: 'readme' | 'api' | 'guide' | 'spec' | 'other';
        };

        const response = await wyndApi.post(`/api/projects/${project_id}/documents`, {
          title,
          content,
          type: type || 'other'
        });

        return {
          content: [{
            type: "text",
            text: `Created document "${title}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_documents": {
        const { project_id, type } = request.params.arguments as {
          project_id?: string;
          type?: 'readme' | 'api' | 'guide' | 'spec' | 'other';
        };

        let url = '/api/documents';
        const params = new URLSearchParams();
        
        if (project_id) params.append('project_id', project_id);
        if (type) params.append('type', type);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_document": {
        const { document_id } = request.params.arguments as { document_id: string };
        const response = await wyndApi.get(`/api/documents/${document_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_document": {
        const { document_id, title, content, type } = request.params.arguments as {
          document_id: string;
          title?: string;
          content?: string;
          type?: 'readme' | 'api' | 'guide' | 'spec' | 'other';
        };

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (type !== undefined) updateData.type = type;

        const response = await wyndApi.put(`/api/documents/${document_id}`, updateData);
        return {
          content: [{
            type: "text",
            text: `Updated document ${document_id}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "delete_document": {
        const { document_id } = request.params.arguments as { document_id: string };
        await wyndApi.delete(`/api/documents/${document_id}`);
        return {
          content: [{
            type: "text",
            text: `Deleted document ${document_id}`
          }]
        };
      }

      // Error Tracking and Activity Logging Tools
      case "log_activity": {
        const { project_id, action, details, metadata } = request.params.arguments as {
          project_id?: string;
          action: string;
          details?: string;
          metadata?: Record<string, any>;
        };

        const response = await wyndApi.post('/api/activity-logs', {
          project_id,
          action,
          details,
          metadata
        });

        return {
          content: [{
            type: "text",
            text: `Logged activity "${action}" with ID: ${response.data.id}`
          }]
        };
      }

      case "get_activity_logs": {
        const { project_id, action, limit } = request.params.arguments as {
          project_id?: string;
          action?: string;
          limit?: number;
        };

        let url = '/api/activity-logs';
        const params = new URLSearchParams();
        
        if (project_id) params.append('project_id', project_id);
        if (action) params.append('action', action);
        if (limit) params.append('limit', limit.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "track_error": {
        const { project_id, error_type, error_message, stack_trace, metadata } = request.params.arguments as {
          project_id?: string;
          error_type: string;
          error_message: string;
          stack_trace?: string;
          metadata?: Record<string, any>;
        };

        const response = await wyndApi.post('/api/errors', {
          project_id,
          error_type,
          error_message,
          stack_trace,
          metadata
        });

        return {
          content: [{
            type: "text",
            text: `Tracked error "${error_type}" with ID: ${response.data.error_id}`
          }]
        };
      }

      case "list_errors": {
        const { project_id, error_type, limit } = request.params.arguments as {
          project_id?: string;
          error_type?: string;
          limit?: number;
        };

        let url = '/api/errors';
        const params = new URLSearchParams();
        
        if (project_id) params.append('project_id', project_id);
        if (error_type) params.append('error_type', error_type);
        if (limit) params.append('limit', limit.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "create_agent": {
        const { name, type, config, project_id } = request.params.arguments as {
          name: string;
          type: 'ai_assistant' | 'automation' | 'monitor' | 'other';
          config?: Record<string, any>;
          project_id?: string;
        };

        const response = await wyndApi.post('/api/agents', {
          name,
          type,
          config,
          project_id
        });

        return {
          content: [{
            type: "text",
            text: `Created agent "${name}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_agents": {
        const { project_id, type, status } = request.params.arguments as {
          project_id?: string;
          type?: 'ai_assistant' | 'automation' | 'monitor' | 'other';
          status?: 'active' | 'inactive' | 'error';
        };

        let url = '/api/agents';
        const params = new URLSearchParams();
        
        if (project_id) params.append('project_id', project_id);
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_agent_status": {
        const { agent_id, status } = request.params.arguments as {
          agent_id: string;
          status: 'active' | 'inactive' | 'error';
        };

        const response = await wyndApi.put(`/api/agents/${agent_id}`, { status });
        return {
          content: [{
            type: "text",
            text: `Updated agent ${agent_id} status to ${status}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      // Prompt Management Tools
      case "create_prompt": {
        const { workspace_id, title, description, content, category_id, tags, variables, parent_prompt_id, is_public } = request.params.arguments as {
          workspace_id: string;
          title: string;
          description?: string;
          content: string;
          category_id?: string;
          tags?: string[];
          variables?: Record<string, any>;
          parent_prompt_id?: string;
          is_public?: boolean;
        };

        const response = await wyndApi.post('/api/prompts', {
          workspace_id,
          title,
          description,
          content,
          category_id,
          tags: tags || [],
          variables: variables || {},
          parent_prompt_id,
          is_public: is_public || false
        });

        return {
          content: [{
            type: "text",
            text: `Created prompt "${title}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_prompts": {
        const { workspace_id, category_id, tags, is_public, search } = request.params.arguments as {
          workspace_id?: string;
          category_id?: string;
          tags?: string[];
          is_public?: boolean;
          search?: string;
        };

        let url = '/api/prompts';
        const params = new URLSearchParams();
        
        if (workspace_id) params.append('workspace_id', workspace_id);
        if (category_id) params.append('category_id', category_id);
        if (tags && tags.length > 0) params.append('tags', tags.join(','));
        if (is_public !== undefined) params.append('is_public', is_public.toString());
        if (search) params.append('search', search);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_prompt": {
        const { prompt_id } = request.params.arguments as { prompt_id: string };
        const response = await wyndApi.get(`/api/prompts/${prompt_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "update_prompt": {
        const { prompt_id, title, description, content, category_id, tags, variables, is_public } = request.params.arguments as {
          prompt_id: string;
          title?: string;
          description?: string;
          content?: string;
          category_id?: string;
          tags?: string[];
          variables?: Record<string, any>;
          is_public?: boolean;
        };

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (content !== undefined) updateData.content = content;
        if (category_id !== undefined) updateData.category_id = category_id;
        if (tags !== undefined) updateData.tags = tags;
        if (variables !== undefined) updateData.variables = variables;
        if (is_public !== undefined) updateData.is_public = is_public;

        const response = await wyndApi.put(`/api/prompts/${prompt_id}`, updateData);
        return {
          content: [{
            type: "text",
            text: `Updated prompt ${prompt_id}: ${JSON.stringify(response.data, null, 2)}`
          }]
        };
      }

      case "delete_prompt": {
        const { prompt_id } = request.params.arguments as { prompt_id: string };
        await wyndApi.delete(`/api/prompts/${prompt_id}`);
        return {
          content: [{
            type: "text",
            text: `Deleted prompt ${prompt_id}`
          }]
        };
      }

      case "create_prompt_category": {
        const { workspace_id, name, description, color } = request.params.arguments as {
          workspace_id: string;
          name: string;
          description?: string;
          color?: string;
        };

        const response = await wyndApi.post('/api/prompt-categories', {
          workspace_id,
          name,
          description,
          color
        });

        return {
          content: [{
            type: "text",
            text: `Created prompt category "${name}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_prompt_categories": {
        const { workspace_id } = request.params.arguments as { workspace_id: string };
        const response = await wyndApi.get(`/api/prompt-categories?workspace_id=${workspace_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "track_prompt_usage": {
        const { prompt_id, project_id, execution_time, success, error_message, input_variables, output_result } = request.params.arguments as {
          prompt_id: string;
          project_id?: string;
          execution_time?: number;
          success: boolean;
          error_message?: string;
          input_variables?: Record<string, any>;
          output_result?: Record<string, any>;
        };

        // Get workspace_id from the prompt first
        const promptResponse = await wyndApi.get(`/api/prompts/${prompt_id}`);
        const workspace_id = promptResponse.data.workspace_id;

        const response = await wyndApi.post('/api/prompt-usage', {
          prompt_id,
          workspace_id,
          project_id,
          execution_time_ms: execution_time,
          success,
          error_message,
          input_variables: input_variables || {},
          output_result: output_result || {}
        });

        return {
          content: [{
            type: "text",
            text: `Tracked usage for prompt ${prompt_id} with ID: ${response.data.id}`
          }]
        };
      }

      case "get_prompt_usage": {
        const { prompt_id, workspace_id, project_id, days } = request.params.arguments as {
          prompt_id?: string;
          workspace_id?: string;
          project_id?: string;
          days?: number;
        };

        let url = '/api/prompt-usage';
        const params = new URLSearchParams();
        
        if (prompt_id) params.append('prompt_id', prompt_id);
        if (workspace_id) params.append('workspace_id', workspace_id);
        if (project_id) params.append('project_id', project_id);
        if (days) params.append('days', days.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "share_prompt": {
        const { prompt_id, shared_with_user_id, shared_with_workspace_id, permission } = request.params.arguments as {
          prompt_id: string;
          shared_with_user_id?: string;
          shared_with_workspace_id?: string;
          permission: 'read' | 'write' | 'admin';
        };

        const response = await wyndApi.post('/api/prompt-shares', {
          prompt_id,
          shared_with_user_id,
          shared_with_workspace_id,
          permission
        });

        return {
          content: [{
            type: "text",
            text: `Shared prompt ${prompt_id} with ${permission} permission`
          }]
        };
      }

      case "list_prompt_shares": {
        const { prompt_id } = request.params.arguments as { prompt_id?: string };
        
        let url = '/api/prompt-shares';
        if (prompt_id) {
          url += `?prompt_id=${prompt_id}`;
        }

        const response = await wyndApi.get(url);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "create_prompt_collection": {
        const { workspace_id, name, description } = request.params.arguments as {
          workspace_id: string;
          name: string;
          description?: string;
        };

        const response = await wyndApi.post('/api/prompt-collections', {
          workspace_id,
          name,
          description
        });

        return {
          content: [{
            type: "text",
            text: `Created prompt collection "${name}" with ID: ${response.data.id}`
          }]
        };
      }

      case "list_prompt_collections": {
        const { workspace_id } = request.params.arguments as { workspace_id: string };
        const response = await wyndApi.get(`/api/prompt-collections?workspace_id=${workspace_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "add_prompt_to_collection": {
        const { collection_id, prompt_id, order_index } = request.params.arguments as {
          collection_id: string;
          prompt_id: string;
          order_index?: number;
        };

        const response = await wyndApi.post(`/api/prompt-collections/${collection_id}/items`, {
          prompt_id,
          order_index: order_index || 0
        });

        return {
          content: [{
            type: "text",
            text: `Added prompt ${prompt_id} to collection ${collection_id}`
          }]
        };
      }

      case "remove_prompt_from_collection": {
        const { collection_id, prompt_id } = request.params.arguments as {
          collection_id: string;
          prompt_id: string;
        };

        await wyndApi.delete(`/api/prompt-collections/${collection_id}/items?prompt_id=${prompt_id}`);
        return {
          content: [{
            type: "text",
            text: `Removed prompt ${prompt_id} from collection ${collection_id}`
          }]
        };
      }

      case "list_collection_prompts": {
        const { collection_id } = request.params.arguments as { collection_id: string };
        const response = await wyndApi.get(`/api/prompt-collections/${collection_id}/items`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        content: [{
          type: "text",
          text: `WYND API error: ${error.response?.data?.message || error.message}`
        }],
        isError: true
      };
    }
    throw error;
  }
});

/**
 * Start the server using stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("WYND MCP Server error:", error);
  process.exit(1);
});
