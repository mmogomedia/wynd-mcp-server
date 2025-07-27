import { Resource } from './base.js';
import { config } from '../../config/index.js';
import { api } from '../../api/endpoints/index.js';
import logger from '../../utils/logger.js';

/**
 * Context resource handler for the MCP server
 * Provides essential context information including default project ID, workspace info, and server configuration.
 * This resource helps clients understand the current context and configure their requests appropriately.
 */
export class ContextResource implements Resource {
  public readonly uri = 'wynd://context';
  public readonly name = 'context';
  public readonly description = 'Server context and configuration resource providing default project ID, workspace information, and server settings. Essential for clients to understand the current working context and configure API calls appropriately.';
  public isPublic = true; // Make context publicly accessible

  async list(): Promise<any[]> {
    try {
      const contextInfo = await this.getContextInfo();
      return [contextInfo];
    } catch (error) {
      logger.error('Error fetching context info:', error);
      return [];
    }
  }

  async read(uri: string): Promise<any | null> {
    try {
      if (uri === 'wynd://context' || uri.endsWith('/context')) {
        return await this.getContextInfo();
      }
      
      // Handle specific context queries
      const contextType = uri.split('/').pop();
      switch (contextType) {
        case 'project':
          return await this.getProjectContext();
        case 'workspace':
          return await this.getWorkspaceContext();
        case 'server':
          return await this.getServerContext();
        default:
          return await this.getContextInfo();
      }
    } catch (error) {
      logger.error(`Error fetching context with URI ${uri}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive context information
   */
  private async getContextInfo(): Promise<any> {
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

    return {
      server: {
        name: 'wynd',
        version: '1.4.0',
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
        title: workspaceInfo?.name || 'Unknown Workspace',
        description: workspaceInfo?.description || null
      },
      resources: [
        'wynd://context',
        'wynd://projects', 
        'wynd://documents',
        'wynd://errors',
        'wynd://tasks',
        'wynd://prompts'
      ],
      capabilities: {
        tasks: {
          defaultFilter: 'in_progress',
          supportedStatuses: ['todo', 'in_progress', 'done', 'cancelled'],
          supportedPriorities: ['low', 'medium', 'high', 'urgent']
        },
        projects: {
          readOnly: true,
          operations: ['list', 'read', 'stats']
        },
        documents: {
          operations: ['list', 'read', 'create', 'update', 'delete'],
          supportedFormats: ['markdown', 'text', 'html']
        },
        errors: {
          public: true,
          operations: ['list', 'read', 'create', 'update', 'delete']
        },
        prompts: {
          operations: ['list', 'read', 'create', 'update', 'delete'],
          features: ['categorization', 'tagging', 'versioning', 'variables']
        }
      },
      usage: {
        quickStart: {
          listTasks: 'Read wynd://tasks (defaults to in_progress)',
          createTask: 'Create task with project_id: ' + defaultProjectId,
          getProject: 'Read wynd://projects/' + defaultProjectId,
          listDocuments: 'Read wynd://documents (auto-filtered to project)'
        },
        examples: {
          taskWithStatus: 'wynd://tasks?status=todo',
          projectStats: 'wynd://projects/' + defaultProjectId + '/stats',
          documentsByType: 'wynd://documents?type=documentation'
        }
      }
    };
  }

  /**
   * Get project-specific context
   */
  private async getProjectContext(): Promise<any> {
    const defaultProjectId = config.project.defaultProjectId;
    
    if (!defaultProjectId) {
      return {
        error: 'No default project configured',
        defaultProjectId: null
      };
    }

    try {
      const projectInfo = await api.projects.get(defaultProjectId);
      return {
        defaultProjectId,
        project: projectInfo,
        usage: {
          createTask: `Use project_id: "${defaultProjectId}" when creating tasks`,
          listTasks: 'Tasks are automatically filtered to this project',
          createDocument: `Use project_id: "${defaultProjectId}" when creating documents`
        }
      };
    } catch (error) {
      return {
        error: 'Could not fetch project information',
        defaultProjectId,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get workspace context
   */
  private async getWorkspaceContext(): Promise<any> {
    const defaultProjectId = config.project.defaultProjectId;
    
    try {
      if (!defaultProjectId) {
        return { error: 'No default project configured' };
      }

      const projectInfo = await api.projects.get(defaultProjectId);
      if (!projectInfo.workspace_id) {
        return { error: 'Project has no workspace association' };
      }

      const workspaceInfo = await api.workspaces.get(projectInfo.workspace_id);
      return {
        workspace: workspaceInfo,
        projectCount: await this.getWorkspaceProjectCount(projectInfo.workspace_id)
      };
    } catch (error) {
      return {
        error: 'Could not fetch workspace information',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get server configuration context
   */
  private async getServerContext(): Promise<any> {
    return {
      server: {
        name: 'wynd',
        version: '1.4.0',
        transport: 'stdio',
        environment: config.env || 'development'
      },
      api: {
        baseUrl: config.api.url,
        timeout: config.api.timeout,
        authenticated: !!config.api.token
      },
      configuration: {
        defaultProjectId: config.project.defaultProjectId,
        logLevel: config.server.logLevel
      }
    };
  }

  /**
   * Helper to get project count in workspace
   */
  private async getWorkspaceProjectCount(workspaceId: string): Promise<number> {
    try {
      const projects = await api.projects.list({ workspace_id: workspaceId });
      return projects.data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  // Context resource is read-only
  async create(): Promise<any> {
    throw new Error('Context resource is read-only');
  }

  async update(): Promise<any> {
    throw new Error('Context resource is read-only');
  }

  async delete(): Promise<void> {
    throw new Error('Context resource is read-only');
  }
}