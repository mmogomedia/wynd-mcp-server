# WYND MCP Server

A Model Context Protocol (MCP) server that provides tools and resources for interacting with the WYND Project Management Software. This server enables AI assistants to manage workspaces, projects, tasks, user profiles, and prompt libraries programmatically.

## Features

- **Workspace Management**: Create, update, and manage workspaces
- **Project Management**: Full CRUD operations for projects
- **Task Management**: Create, assign, and track tasks with subtask support
- **User Management**: Profile management and team collaboration
- **Document Management**: Create and manage project documentation
- **Prompt Library**: Manage AI prompts with categories, collections, and sharing
- **Activity Tracking**: Log activities and track errors
- **Analytics**: Generate reports and workspace statistics
- **Agent Management**: Create and manage AI agents and automations

## Installation

### Via NPM (Recommended)

```bash
npm install -g @mmogomedia/wynd-mcp-server
```

### Via NPX (No Installation Required)

```bash
npx @mmogomedia/wynd-mcp-server
```

### From Source

```bash
git clone https://github.com/mmogomedia/wynd-mcp-server.git
cd mcp-server
npm install
npm run build
npm start
```

## Configuration

The server requires the following environment variables:

- `WYND_API_TOKEN` (required): Your WYND API authentication token
- `WYND_API_URL` (optional): WYND API base URL (defaults to `https://wynd.mmogomedia.com`)

### Getting Your API Token

1. Log in to your WYND account at [https://wynd.mmogomedia.com](https://wynd.mmogomedia.com)
2. Navigate to Settings > API Tokens
3. Generate a new token with appropriate permissions
4. Copy the token for use in your environment

## Usage

### With Claude Desktop

Add the following to your Claude Desktop MCP settings file:

```json
{
  "mcpServers": {
    "wynd": {
      "command": "npx",
      "args": ["@mmogomedia/wynd-mcp-server"],
      "env": {
        "WYND_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### With Other MCP Clients

The server can be used with any MCP-compatible client by running:

```bash
WYND_API_TOKEN=your-token-here npx @mmogomedia/wynd-mcp-server
```

## Available Tools

### Workspace Management
- `create_workspace` - Create a new workspace
- `list_workspaces` - Get all workspaces for the authenticated user
- `get_workspace` - Get detailed information about a specific workspace
- `update_workspace` - Update workspace settings and metadata
- `invite_to_workspace` - Send workspace invitation to team members

### Project Management
- `create_project` - Create a new project within a workspace
- `list_projects` - Get projects (filtered by workspace, status, etc.)
- `get_project` - Get detailed information about a specific project
- `update_project` - Update project details and status
- `delete_project` - Archive or delete a project

### Task Management
- `create_task` - Create a new task within a project
- `list_tasks` - Get tasks (filtered by project, status, assignee, etc.)
- `get_task` - Get detailed information about a specific task
- `update_task` - Update task details and status
- `delete_task` - Delete a task
- `assign_task` - Assign a task to a user
- `create_subtask` - Create a subtask under a parent task
- `list_subtasks` - Get subtasks for a parent task

### User & Authentication
- `get_user_profile` - Get current user profile information
- `update_user_profile` - Update user profile details
- `list_workspace_members` - Get workspace team members
- `get_onboarding_status` - Check user's onboarding progress

### Document Management
- `create_document` - Create a new document within a project
- `list_documents` - Get documents (filtered by project, type, etc.)
- `get_document` - Get detailed information about a specific document
- `update_document` - Update document content and metadata
- `delete_document` - Delete a document

### Prompt Library Management
- `create_prompt` - Create a new prompt in the library
- `list_prompts` - Get prompts (filtered by workspace, category, tags, etc.)
- `get_prompt` - Get detailed information about a specific prompt
- `update_prompt` - Update prompt content and metadata
- `delete_prompt` - Delete a prompt from the library
- `create_prompt_category` - Create a new prompt category
- `list_prompt_categories` - Get prompt categories for a workspace
- `track_prompt_usage` - Track usage of a prompt
- `get_prompt_usage` - Get usage analytics for prompts
- `share_prompt` - Share a prompt with users or workspaces
- `list_prompt_shares` - Get sharing information for prompts
- `create_prompt_collection` - Create a new prompt collection
- `list_prompt_collections` - Get prompt collections for a workspace
- `add_prompt_to_collection` - Add a prompt to a collection
- `remove_prompt_from_collection` - Remove a prompt from a collection
- `list_collection_prompts` - Get prompts in a collection

### Analytics & Reporting
- `get_workspace_stats` - Get workspace analytics
- `get_project_stats` - Get project-specific metrics
- `generate_activity_report` - Generate activity summaries

### Activity & Error Tracking
- `log_activity` - Log an activity or event
- `get_activity_logs` - Get activity logs
- `track_error` - Track an error or exception
- `list_errors` - Get tracked errors

### Agent Management
- `create_agent` - Create a new AI agent or automation
- `list_agents` - Get agents (filtered by project, type, status, etc.)
- `update_agent_status` - Update the status of an agent

## Available Resources

The server provides the following resources for accessing WYND data:

- `wynd://current-user/profile` - Current user profile information
- `wynd://workspaces/list` - List of accessible workspaces
- `wynd://projects/list` - List of accessible projects
- `wynd://onboarding/status` - Current onboarding progress

### Dynamic Resources

- `wynd://workspace/{id}/details` - Specific workspace details
- `wynd://workspace/{id}/projects` - Projects in a workspace
- `wynd://workspace/{id}/members` - Workspace members
- `wynd://project/{id}/details` - Specific project details
- `wynd://project/{id}/tasks` - Tasks in a project

## Examples

### Creating a New Project

```javascript
// Using the create_project tool
{
  "title": "My New Project",
  "description": "A project for managing tasks",
  "workspace_id": "workspace-123",
  "status": "active"
}
```

### Listing Tasks for a Project

```javascript
// Using the list_tasks tool
{
  "project_id": "project-456",
  "status": "in_progress"
}
```

### Creating a Prompt

```javascript
// Using the create_prompt tool
{
  "workspace_id": "workspace-123",
  "title": "Code Review Prompt",
  "content": "Please review this code for: {{criteria}}",
  "category_id": "category-789",
  "tags": ["code-review", "development"],
  "variables": {
    "criteria": {
      "type": "string",
      "description": "Review criteria"
    }
  }
}
```

## Development

### Prerequisites

- Node.js 18 or higher
- TypeScript 5.0 or higher

### Setup

```bash
git clone https://github.com/mmogomedia/wynd-mcp-server.git
cd mcp-server
npm install
```

### Development Commands

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Project Structure

```
wynd-server/
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript output
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## API Reference

The server communicates with the WYND API at `https://wynd.mmogomedia.com`. All API calls are authenticated using the provided API token via Bearer authentication.

### Error Handling

The server provides detailed error messages for common issues:

- **Authentication errors**: Invalid or missing API token
- **Permission errors**: Insufficient permissions for requested operation
- **Validation errors**: Invalid input parameters
- **Network errors**: Connection issues with WYND API

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.wynd.com/mcp-server](https://docs.wynd.com/mcp-server)
- **Issues**: [https://github.com/wynd/mcp-server/issues](https://github.com/wynd/mcp-server/issues)
- **Email**: support@wynd.com

## Changelog

### v1.0.0
- Initial release
- Full workspace, project, and task management
- Prompt library with categories and collections
- User profile management
- Activity tracking and analytics
- Agent management capabilities
