import { api } from '../../api/endpoints/index.js';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * MCP Tools for WYND Project Management
 * Tools are callable functions that perform actions, unlike resources which provide data access
 */

/**
 * List tasks with optional filtering
 */
export const listTasks = {
  name: 'list_tasks',
  description: 'List tasks from the current project. By default shows only in_progress tasks for focused workflow. You can override the status filter to see all tasks or specific statuses.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Filter tasks by status. Options: todo, in_progress, done, cancelled. Defaults to in_progress for focused workflow.',
        enum: ['todo', 'in_progress', 'done', 'cancelled', 'all']
      },
      priority: {
        type: 'string',
        description: 'Filter tasks by priority level',
        enum: ['low', 'medium', 'high', 'urgent']
      },
      assignee_id: {
        type: 'string',
        description: 'Filter tasks by assignee user ID'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of tasks to return (default: 50)',
        minimum: 1,
        maximum: 100
      },
      phase_id: {
        type: 'string',
        description: 'Filter tasks by phase ID'
      }
    }
  },
  handler: async (args: any) => {
    try {
      const params: any = {
        project_id: config.project.defaultProjectId,
        priority: args.priority,
        assignee_id: args.assignee_id,
        phase_id: args.phase_id,
        limit: args.limit || 50
      };

      // Handle status filtering properly
      if (args.status && args.status !== 'all') {
        params.status = args.status;
      } else if (!args.status) {
        // Default to in_progress when no status is specified
        params.status = 'in_progress';
      }
      // If args.status === 'all', don't set status parameter to get all tasks

      const response = await api.tasks.list(params);
      const tasks = response.data || [];

      // Determine the actual status filter applied
      let appliedStatus;
      if (args.status === 'all') {
        appliedStatus = 'all';
      } else if (params.status) {
        appliedStatus = params.status;
      } else {
        appliedStatus = 'in_progress (default)';
      }

      return {
        success: true,
        tasks,
        count: tasks.length,
        filter_applied: {
          status: appliedStatus,
          priority: params.priority || 'all',
          phase_id: params.phase_id || 'all',
          project_id: config.project.defaultProjectId
        },
        message: `Found ${tasks.length} tasks${appliedStatus === 'all' ? '' : ` with status '${params.status || 'in_progress'}'`}`
      };
    } catch (error) {
      logger.error('Error listing tasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        tasks: []
      };
    }
  }
};

/**
 * Create a new task
 */
export const createTask = {
  name: 'create_task',
  description: 'Create a new task in the current project. The task will be automatically associated with the default project.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Task title (required)'
      },
      description: {
        type: 'string',
        description: 'Detailed task description'
      },
      status: {
        type: 'string',
        description: 'Task status (default: todo)',
        enum: ['todo', 'in_progress', 'done', 'cancelled'],
        default: 'todo'
      },
      priority: {
        type: 'string',
        description: 'Task priority level (default: medium)',
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      assignee_id: {
        type: 'string',
        description: 'User ID to assign the task to'
      },
      due_date: {
        type: 'string',
        description: 'Due date in ISO format (YYYY-MM-DD)'
      },
      phase_id: {
        type: 'string',
        description: 'Phase ID to associate the task with (optional but recommended for better organization)'
      }
    },
    required: ['title']
  },
  handler: async (args: any) => {
    try {
      if (!args.title) {
        return {
          success: false,
          error: 'Task title is required'
        };
      }

      const taskData = {
        title: args.title,
        description: args.description || null,
        status: args.status || 'todo',
        priority: args.priority || 'medium',
        project_id: config.project.defaultProjectId,
        phase_id: args.phase_id || null,
        assignee_id: args.assignee_id || null,
        due_date: args.due_date || null,
        completed_at: null,
        created_by: 'mcp-client'
      };

      const task = await api.tasks.create(taskData);

      return {
        success: true,
        task,
        message: `Task '${task.title}' created successfully with ID: ${task.id}`
      };
    } catch (error) {
      logger.error('Error creating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * Update an existing task
 */
export const updateTask = {
  name: 'update_task',
  description: 'Update an existing task. You can modify title, description, status, priority, assignee, and due date.',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: {
        type: 'string',
        description: 'ID of the task to update (required)'
      },
      title: {
        type: 'string',
        description: 'New task title'
      },
      description: {
        type: 'string',
        description: 'New task description'
      },
      status: {
        type: 'string',
        description: 'New task status',
        enum: ['todo', 'in_progress', 'done', 'cancelled']
      },
      priority: {
        type: 'string',
        description: 'New task priority',
        enum: ['low', 'medium', 'high', 'urgent']
      },
      assignee_id: {
        type: 'string',
        description: 'New assignee user ID'
      },
      due_date: {
        type: 'string',
        description: 'New due date in ISO format (YYYY-MM-DD)'
      },
      phase_id: {
        type: 'string',
        description: 'New phase ID to associate the task with'
      }
    },
    required: ['task_id']
  },
  handler: async (args: any) => {
    try {
      if (!args.task_id) {
        return {
          success: false,
          error: 'Task ID is required'
        };
      }

      const updateData: any = {};
      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.status !== undefined) updateData.status = args.status;
      if (args.priority !== undefined) updateData.priority = args.priority;
      if (args.assignee_id !== undefined) updateData.assignee_id = args.assignee_id;
      if (args.due_date !== undefined) updateData.due_date = args.due_date;
      if (args.phase_id !== undefined) updateData.phase_id = args.phase_id;

      const task = await api.tasks.update(args.task_id, updateData);

      return {
        success: true,
        task,
        message: `Task '${task.title}' updated successfully`
      };
    } catch (error) {
      logger.error('Error updating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * Get project information
 */
export const getProject = {
  name: 'get_project',
  description: 'Get detailed information about the current default project, including statistics and metadata.',
  inputSchema: {
    type: 'object',
    properties: {
      include_stats: {
        type: 'boolean',
        description: 'Include project statistics (task counts, completion rates, etc.)',
        default: false
      }
    }
  },
  handler: async (args: any) => {
    try {
      const projectId = config.project.defaultProjectId;
      if (!projectId) {
        return {
          success: false,
          error: 'No default project configured'
        };
      }

      const project = await api.projects.get(projectId);
      let stats = null;

      if (args.include_stats) {
        try {
          stats = await api.projects.getStats(projectId);
        } catch (error) {
          logger.warn('Could not fetch project stats:', error);
        }
      }

      return {
        success: true,
        project,
        stats,
        message: `Retrieved project: ${project.title}`
      };
    } catch (error) {
      logger.error('Error getting project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * List documents
 */
export const listDocuments = {
  name: 'list_documents',
  description: 'List documents from the current project. Supports filtering by document type and search queries.',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Filter documents by type (e.g., documentation, specification, readme)'
      },
      search: {
        type: 'string',
        description: 'Search documents by title or content'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of documents to return (default: 20)',
        minimum: 1,
        maximum: 100
      }
    }
  },
  handler: async (args: any) => {
    try {
      const params: any = {
        project_id: config.project.defaultProjectId,
        type: args.type,
        search: args.search,
        limit: args.limit || 20
      };

      const response = await api.documents.list(params);
      const documents = response.data || [];

      return {
        success: true,
        documents,
        count: documents.length,
        filter_applied: {
          type: params.type || 'all',
          search: params.search || 'none',
          project_id: config.project.defaultProjectId
        },
        message: `Found ${documents.length} documents`
      };
    } catch (error) {
      logger.error('Error listing documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        documents: []
      };
    }
  }
};

/**
 * Create a new document
 */
export const createDocument = {
  name: 'create_document',
  description: 'Create a new document in the current project. Supports markdown content and various document types.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Document title (required)'
      },
      content: {
        type: 'string',
        description: 'Document content (supports markdown)'
      },
      type: {
        type: 'string',
        description: 'Document type (readme, api, guide, spec, other, roadmap)',
        enum: ['readme', 'api', 'guide', 'spec', 'other', 'roadmap'],
        default: 'other'
      },
      description: {
        type: 'string',
        description: 'Brief description of the document'
      }
    },
    required: ['title']
  },
  handler: async (args: any) => {
    try {
      if (!args.title) {
        return {
          success: false,
          error: 'Document title is required'
        };
      }

      const documentData = {
        title: args.title,
        content: args.content || '',
        type: args.type || 'other',
        description: args.description || null,
        project_id: config.project.defaultProjectId
      };

      const document = await api.documents.create(documentData);

      return {
        success: true,
        document,
        message: `Document '${document.title}' created successfully with ID: ${document.id}`
      };
    } catch (error) {
      logger.error('Error creating document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * List phases with optional filtering
 */
export const listPhases = {
  name: 'list_phases',
  description: 'List phases from the current project. Phases are optional but highly recommended for organizing tasks into logical groups or time periods, improving project structure and workflow management.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Filter phases by status',
        enum: ['planning', 'active', 'completed', 'on_hold']
      },
      limit: {
        type: 'number',
        description: 'Maximum number of phases to return (default: 50)',
        minimum: 1,
        maximum: 100
      }
    }
  },
  handler: async (args: any) => {
    try {
      const params: any = {
        project_id: config.project.defaultProjectId,
        status: args.status,
        limit: args.limit || 50
      };

      const response = await api.phases.list(params);
      const phases = response.data || [];

      return {
        success: true,
        phases,
        count: phases.length,
        filter_applied: {
          status: params.status || 'all',
          project_id: config.project.defaultProjectId
        },
        message: `Found ${phases.length} phases${params.status ? ` with status '${params.status}'` : ''}`
      };
    } catch (error) {
      logger.error('Error listing phases:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        phases: []
      };
    }
  }
};

/**
 * Create a new phase
 */
export const createPhase = {
  name: 'create_phase',
  description: 'Create a new phase in the current project. Phases are optional but highly recommended for organizing work into logical groups or time periods, enabling better project structure and milestone tracking.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Phase title (required)'
      },
      description: {
        type: 'string',
        description: 'Detailed phase description'
      },
      status: {
        type: 'string',
        description: 'Phase status (default: planning)',
        enum: ['planning', 'active', 'completed', 'on_hold'],
        default: 'planning'
      },
      order: {
        type: 'number',
        description: 'Phase order/sequence number (default: 1)',
        minimum: 1
      },
      start_date: {
        type: 'string',
        description: 'Phase start date in ISO format (YYYY-MM-DD)'
      },
      end_date: {
        type: 'string',
        description: 'Phase end date in ISO format (YYYY-MM-DD)'
      },
      color: {
        type: 'string',
        description: 'Phase color (hex code, e.g., #FF5733)'
      }
    },
    required: ['title']
  },
  handler: async (args: any) => {
    try {
      if (!args.title) {
        return {
          success: false,
          error: 'Phase title is required'
        };
      }

      const phaseData = {
        title: args.title,
        description: args.description || null,
        status: args.status || 'planning',
        order: args.order || 1,
        project_id: config.project.defaultProjectId,
        start_date: args.start_date || null,
        end_date: args.end_date || null,
        color: args.color || null
      };

      const phase = await api.phases.create(phaseData);

      return {
        success: true,
        phase,
        message: `Phase '${phase.title}' created successfully with ID: ${phase.id}`
      };
    } catch (error) {
      logger.error('Error creating phase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * Update an existing phase
 */
export const updatePhase = {
  name: 'update_phase',
  description: 'Update an existing phase. Phases are optional but highly recommended for better project organization. You can modify title, description, status, order, dates, and color to adapt your project structure as it evolves.',
  inputSchema: {
    type: 'object',
    properties: {
      phase_id: {
        type: 'string',
        description: 'ID of the phase to update (required)'
      },
      title: {
        type: 'string',
        description: 'New phase title'
      },
      description: {
        type: 'string',
        description: 'New phase description'
      },
      status: {
        type: 'string',
        description: 'New phase status',
        enum: ['planning', 'active', 'completed', 'on_hold']
      },
      order: {
        type: 'number',
        description: 'New phase order/sequence number',
        minimum: 1
      },
      start_date: {
        type: 'string',
        description: 'New phase start date in ISO format (YYYY-MM-DD)'
      },
      end_date: {
        type: 'string',
        description: 'New phase end date in ISO format (YYYY-MM-DD)'
      },
      color: {
        type: 'string',
        description: 'New phase color (hex code, e.g., #FF5733)'
      }
    },
    required: ['phase_id']
  },
  handler: async (args: any) => {
    try {
      if (!args.phase_id) {
        return {
          success: false,
          error: 'Phase ID is required'
        };
      }

      const updateData: any = {};
      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.status !== undefined) updateData.status = args.status;
      if (args.order !== undefined) updateData.order = args.order;
      if (args.start_date !== undefined) updateData.start_date = args.start_date;
      if (args.end_date !== undefined) updateData.end_date = args.end_date;
      if (args.color !== undefined) updateData.color = args.color;

      const phase = await api.phases.update(args.phase_id, updateData);

      return {
        success: true,
        phase,
        message: `Phase '${phase.title}' updated successfully`
      };
    } catch (error) {
      logger.error('Error updating phase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * Get server context and project information
 */
export const getContext = {
  name: 'get_context',
  description: 'Get comprehensive server context including default project ID, capabilities, and usage examples. This is typically the first call clients should make.',
  inputSchema: {
    type: 'object',
    properties: {
      include_examples: {
        type: 'boolean',
        description: 'Include usage examples and quick start guide',
        default: true
      }
    }
  },
  handler: async (args: any) => {
    try {
      const defaultProjectId = config.project.defaultProjectId;
      
      let projectInfo = null;
      let workspaceInfo = null;
      
      try {
        if (defaultProjectId) {
          projectInfo = await api.projects.get(defaultProjectId);
          if (projectInfo && projectInfo.workspace_id) {
            try {
              workspaceInfo = await api.workspaces.get(projectInfo.workspace_id);
            } catch (error) {
              logger.warn('Could not fetch workspace info:', error);
            }
          }
        }
      } catch (error) {
        logger.warn('Could not fetch project info:', error);
      }

      const context: any = {
        server: {
          name: 'wynd',
          version: '1.5.1',
          description: 'WYND Project Management MCP Server',
          transport: 'stdio',
          environment: config.env || 'development'
        },
        project: {
          defaultProjectId: defaultProjectId,
          title: projectInfo?.title || 'Unknown Project',
          description: projectInfo?.description || null,
          status: projectInfo?.status || 'unknown',
          workspaceId: projectInfo?.workspace_id || null
        },
        workspace: {
          id: workspaceInfo?.id || null,
          name: workspaceInfo?.name || 'Unknown Workspace',
          description: workspaceInfo?.description || null
        },
        capabilities: {
          tasks: {
            defaultFilter: 'in_progress',
            supportedStatuses: ['todo', 'in_progress', 'done', 'cancelled'],
            supportedPriorities: ['low', 'medium', 'high', 'urgent'],
            operations: ['list', 'create', 'update', 'delete'],
            supportsPhases: true
          },
          phases: {
            optional: true,
            recommended: true,
            description: 'Optional but highly recommended for better project organization and workflow management',
            supportedStatuses: ['planning', 'active', 'completed', 'on_hold'],
            operations: ['list', 'create', 'update', 'delete'],
            features: ['ordering', 'date_ranges', 'color_coding', 'task_organization']
          },
          projects: {
            readOnly: true,
            operations: ['get', 'stats']
          },
          documents: {
            operations: ['list', 'create', 'update', 'delete'],
            supportedFormats: ['markdown', 'text', 'html']
          }
        }
      };

      if (args.include_examples !== false) {
        context.usage = {
          quickStart: {
            getContext: 'Call get_context to understand server capabilities',
            listTasks: 'Call list_tasks (defaults to in_progress)',
            createTask: `Call create_task with project_id: ${defaultProjectId}`,
            getProject: 'Call get_project for project information',
            listDocuments: 'Call list_documents for project documentation'
          },
          examples: {
            listInProgressTasks: 'list_tasks (default behavior)',
            listAllTasks: 'list_tasks with status: "all"',
            createHighPriorityTask: 'create_task with priority: "high"',
            getProjectWithStats: 'get_project with include_stats: true',
            listPhases: 'list_phases (all phases)',
            createPhase: 'create_phase with title: "Phase 1"',
            listTasksByPhase: 'list_tasks with phase_id: "phase-uuid"'
          }
        };
      }

      return {
        success: true,
        context,
        message: 'Server context retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting context:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

/**
 * Export all available tools
 */
export const tools = [
  listTasks,
  createTask,
  updateTask,
  listPhases,
  createPhase,
  updatePhase,
  getProject,
  listDocuments,
  createDocument,
  getContext
];

export default tools;