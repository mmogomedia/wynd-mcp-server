# WYND MCP Server

A Model Context Protocol (MCP) server that provides tools and resources for interacting with the WYND Project Management Software. This server enables AI assistants to manage workspaces, projects, tasks, documents, and error tracking programmatically.

## 🚀 Features

- **Workspace Management**: Create, update, and manage workspaces
- **Project Management**: Full CRUD operations for projects
  - **Default Project**: Configure a default project for operations
  - **Workspace Inheritance**: New projects inherit workspace from default project
- **Task Management**: Create, assign, and track tasks
- **Document Management**: Create and manage project documentation
- **Error Tracking**: Track and manage application errors
- **Prompt Library Management**: Create, organize, and manage AI prompts with categories, tags, and usage tracking
- **TypeScript Support**: Fully typed API and resources
- **Modular Architecture**: Clean separation of concerns
- **Environment Configuration**: Easy configuration via environment variables

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Via NPM (Recommended)

```bash
npm install -g @mmogomedia/wynd-mcp-server
```

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/mmogomedia/wynd-mcp-server.git
   cd wynd-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## ⚙️ Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   ```env
   # API Configuration
   WYND_API_URL=https://wynd.mmogomedia.com
   WYND_API_TOKEN=your_api_token_here
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   
   # Timeout for API requests in milliseconds
   API_TIMEOUT=10000

   # Default Project (Required)
   # This project ID will be used as the default for operations
   # that require a project context when none is specified.
   # This should be set to your main project ID.
   DEFAULT_PROJECT_ID=your_project_id_here
   ```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WYND_API_URL` | No | `https://wynd.mmogomedia.com` | WYND API base URL |
| `WYND_API_TOKEN` | Yes | - | Your WYND API authentication token |
| `PORT` | No | `3000` | Port to run the server on |
| `NODE_ENV` | No | `development` | Node.js environment |
| `LOG_LEVEL` | No | `info` | Logging level |
| `API_TIMEOUT` | No | `10000` | API request timeout in ms |
| `DEFAULT_PROJECT_ID` | Yes | - | Default project ID for operations requiring project context |

## 🚀 Usage

### Development

```bash
# Start in development mode with hot-reload
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Start in production mode
npm start
```

## 🏗️ Project Structure

```
wynd-mcp/
├── src/
│   ├── api/                  # API client and endpoints
│   │   ├── client.ts         # Axios client configuration
│   │   ├── endpoints/        # API endpoint definitions
│   │   └── types/            # TypeScript type definitions
│   ├── config/               # Configuration management
│   ├── server/               # MCP server implementation
│   │   ├── resources/        # Resource handlers
│   │   └── index.ts          # Server setup and initialization
│   └── utils/                # Utility functions
│       └── logger.ts         # Logging utility
├── .env.example             # Example environment variables
├── package.json             # Project configuration
└── tsconfig.json            # TypeScript configuration
```

## 📚 API Resources

The following resources are available through the MCP server:

- `wynd://workspaces` - Workspace management
- `wynd://projects` - Project management
- `wynd://documents` - Document management
- `wynd://errors` - Error tracking
- `wynd://prompts` - Prompt library management

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions or support, please contact [support@wynd.com](mailto:support@wynd.com)

## 🔧 Getting Your Project ID

To find your project ID:

1. Log into your WYND account at https://wynd.mmogomedia.com
2. Navigate to the project you want to use as default
3. The project ID is displayed in the URL: `https://wynd.mmogomedia.com/projects/{project-id}`
4. Copy this ID and use it as your `DEFAULT_PROJECT_ID`

### Why is DEFAULT_PROJECT_ID Required?

The `DEFAULT_PROJECT_ID` is required because many operations in WYND require a project context. When you don't specify a project for an operation, the system uses this default project ID. This ensures that tasks, documents, and other resources are created in the correct project by default.

## 🔑 Getting Your API Token

1. Log into your WYND account at https://wynd.mmogomedia.com
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
      "args": ["-y", "@mmogomedia/wynd-mcp-server"],
      "env": {
        "WYND_API_TOKEN": "your-api-token-here",
        "DEFAULT_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

### With Other MCP Clients

The server can be used with any MCP-compatible client by running:

```bash
WYND_API_TOKEN=your-token-here DEFAULT_PROJECT_ID=your-project-id-here npx @mmogomedia/wynd-mcp-server
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

## Prompt Library

The WYND MCP server includes a comprehensive prompt library management system that allows you to create, organize, and manage AI prompts for various use cases.

### What are Prompts?

Prompts are reusable templates for AI interactions that can be:
- **Structured**: Use variables like `{{variable_name}}` for dynamic content
- **Categorized**: Organize prompts by categories (e.g., "Code Review", "Content Creation", "Analysis")
- **Tagged**: Add tags for easy searching and filtering
- **Versioned**: Track changes and maintain prompt history
- **Shared**: Share prompts with team members or workspaces
- **Tracked**: Monitor usage analytics and performance

### Prompt Features

- **Variable Support**: Use `{{variable_name}}` syntax for dynamic content
- **Categories**: Organize prompts into logical groups
- **Tags**: Add multiple tags for easy discovery
- **Versioning**: Track prompt changes and maintain history
- **Usage Analytics**: Monitor how prompts are used and their effectiveness
- **Sharing**: Share prompts with team members or make them public
- **Collections**: Group related prompts into collections
- **Search**: Find prompts by content, title, tags, or category

### Prompt Structure

```typescript
interface Prompt {
  id: string;
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
  created_at: string;
  updated_at: string;
}
```

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

### Searching Prompts

```javascript
// Search prompts by content or title
{
  "query": "code review",
  "workspace_id": "workspace-123"
}
```

### Getting Prompts by Category

```javascript
// Get all prompts in a specific category
{
  "category_id": "category-789",
  "workspace_id": "workspace-123"
}
```

### Tracking Prompt Usage

```javascript
// Track when a prompt is used
{
  "prompt_id": "prompt-123",
  "project_id": "project-456",
  "execution_time_ms": 1500,
  "success": true,
  "input_variables": {
    "criteria": "security vulnerabilities"
  },
  "output_result": {
    "issues_found": 3,
    "severity": "medium"
  }
}
```
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
