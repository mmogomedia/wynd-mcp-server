# WYND MCP Server

A comprehensive Model Context Protocol (MCP) server that provides intelligent tools and resources for interacting with the WYND Project Management Software. This server enables AI assistants and developers to seamlessly manage projects, tasks, documents, and collaborate on rapid application development.

## 🎯 Overview

WYND MCP Server is designed for **"vibe coding"** workflows where teams can build applications rapidly through AI-assisted development. It provides context-aware project management with intelligent task filtering, comprehensive documentation management, and collaborative prompt libraries.

**Current Version**: 1.5.0  
**Protocol**: Model Context Protocol (MCP)  
**Transport**: stdio (optimized for AI assistants)  
**License**: MIT

## ✨ Key Features

### 🔍 **Smart Context Discovery**
- **Automatic Project Context**: Clients immediately know the default project ID and workspace
- **Server Capabilities**: Full visibility into available operations and restrictions
- **Usage Examples**: Built-in guidance for common operations
- **Quick Start Information**: Ready-to-use API patterns

### 📋 **Intelligent Task Management**
- **Smart Filtering**: Tasks default to showing only `in_progress` status for focused workflow
- **Flexible Status Control**: Override default filters for custom task views
- **Priority Management**: Support for low, medium, high, and urgent priorities
- **Assignment Tracking**: Full assignee and due date management

### 📚 **Read-Only Project Access**
- **Secure Project Information**: View project details, statistics, and metadata
- **Protected Operations**: Projects cannot be modified via MCP for data integrity
- **Comprehensive Stats**: Access project analytics and performance metrics
- **Related Data Access**: View project tasks, documents, and team information

### 📄 **Comprehensive Document Management**
- **Full CRUD Operations**: Create, read, update, and delete project documentation
- **Markdown Support**: Rich text formatting with syntax highlighting
- **File Attachments**: Support for various document formats
- **Categorization**: Organize documents by type and purpose
- **Search Capabilities**: Full-text search across document content

### 🤖 **AI Prompt Library**
- **Prompt Organization**: Categorize and tag prompts for easy discovery
- **Variable Support**: Dynamic prompts with `{{variable_name}}` substitution
- **Version Control**: Track prompt changes and maintain history
- **Usage Analytics**: Monitor prompt effectiveness and performance
- **Collaborative Sharing**: Share prompts across teams and projects

### 🐛 **Error Tracking & Debugging**
- **Public Error Logs**: Transparent error tracking for collaborative debugging
- **Stack Trace Analysis**: Detailed error information for quick resolution
- **Solution Tracking**: Link errors to their solutions and fixes
- **Categorization**: Organize errors by type, severity, and component

## 🚀 Quick Start

### Installation

The WYND MCP server is available as an NPM package and can be used directly with any MCP-compatible client:

```bash
# Use with npx (recommended - always gets latest version)
npx @mmogomedia/wynd-mcp-server@latest

# Or install globally
npm install -g @mmogomedia/wynd-mcp-server
```

### MCP Client Configuration

#### With Cursor IDE
Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wynd": {
      "command": "npx",
      "args": ["-y", "@mmogomedia/wynd-mcp-server@latest"],
      "env": {
        "WYND_API_TOKEN": "your-api-token-here",
        "DEFAULT_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

#### With Claude Desktop
Add to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "wynd": {
      "command": "npx",
      "args": ["-y", "@mmogomedia/wynd-mcp-server@latest"],
      "env": {
        "WYND_API_TOKEN": "your-api-token-here",
        "DEFAULT_PROJECT_ID": "your-project-id-here"
      }
    }
  }
}
```

#### With Any MCP Client
```bash
WYND_API_TOKEN=your-token DEFAULT_PROJECT_ID=your-project-id npx @mmogomedia/wynd-mcp-server@latest
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WYND_API_TOKEN` | ✅ | Your WYND API authentication token |
| `DEFAULT_PROJECT_ID` | ✅ | Default project ID for operations |
| `WYND_API_URL` | ❌ | API base URL (defaults to https://wynd.mmogomedia.com) |
| `LOG_LEVEL` | ❌ | Logging level (defaults to info) |

## 📚 Available Resources

The WYND MCP server provides the following resources:

### 🔍 `wynd://context` - Server Context & Project Information
**Purpose**: Provides essential context information for clients
- **Default Project ID**: Immediately visible to clients
- **Server Capabilities**: Available operations and restrictions
- **Usage Examples**: Common API patterns and quick start guide
- **Project Details**: Current project information and workspace context

**Usage**:
```javascript
// Get full context information
GET wynd://context

// Get specific context
GET wynd://context/project    // Project-specific context
GET wynd://context/workspace  // Workspace information
GET wynd://context/server     // Server configuration
```

### 📋 `wynd://tasks` - Intelligent Task Management
**Purpose**: Comprehensive task management with smart filtering
- **Default Filter**: Shows only `in_progress` tasks for focused workflow
- **Full CRUD**: Create, read, update, and delete tasks
- **Status Management**: todo, in_progress, done, cancelled
- **Priority Levels**: low, medium, high, urgent
- **Assignment Tracking**: Assignee and due date management

**Usage**:
```javascript
// List in-progress tasks (default)
GET wynd://tasks

// List tasks with specific status
GET wynd://tasks?status=todo

// Get specific task
GET wynd://tasks/{task-id}
```

### 📚 `wynd://projects` - Read-Only Project Access
**Purpose**: Secure project information access
- **Read-Only**: Projects cannot be modified via MCP for data integrity
- **Project Details**: View project information, statistics, and metadata
- **Related Data**: Access project tasks, documents, and team information
- **Analytics**: Project performance metrics and statistics

**Usage**:
```javascript
// List all projects
GET wynd://projects

// Get default project
GET wynd://projects/default

// Get specific project
GET wynd://projects/{project-id}
```

### 📄 `wynd://documents` - Document Management
**Purpose**: Comprehensive project documentation management
- **Full CRUD**: Create, read, update, and delete documents
- **Markdown Support**: Rich text formatting and syntax highlighting
- **File Organization**: Categorization and search capabilities
- **Project Association**: Automatic project context integration

**Usage**:
```javascript
// List project documents
GET wynd://documents

// Get specific document
GET wynd://documents/{document-id}

// Create new document
POST wynd://documents
{
  "title": "API Documentation",
  "content": "# API Reference\n...",
  "type": "documentation"
}
```

### 🤖 `wynd://prompts` - AI Prompt Library
**Purpose**: Collaborative AI prompt management
- **Variable Support**: Dynamic prompts with `{{variable_name}}` substitution
- **Organization**: Categories, tags, and collections
- **Version Control**: Track changes and maintain history
- **Usage Analytics**: Monitor effectiveness and performance
- **Sharing**: Collaborate on prompt development

**Usage**:
```javascript
// List all prompts
GET wynd://prompts

// Search prompts
GET wynd://prompts?query=code+review

// Get specific prompt
GET wynd://prompts/{prompt-id}

// Create new prompt
POST wynd://prompts
{
  "title": "Code Review Assistant",
  "content": "Please review this code for: {{criteria}}",
  "tags": ["code-review", "development"],
  "variables": {
    "criteria": {
      "type": "string",
      "description": "Review criteria"
    }
  }
}
```

### 🐛 `wynd://errors` - Error Tracking & Debugging
**Purpose**: Transparent error tracking for collaborative debugging
- **Public Access**: Open error logs for team collaboration
- **Stack Traces**: Detailed error information for quick resolution
- **Solution Tracking**: Link errors to fixes and resolutions
- **Categorization**: Organize by type, severity, and component

**Usage**:
```javascript
// List recent errors
GET wynd://errors

// Get specific error
GET wynd://errors/{error-id}

// Log new error
POST wynd://errors
{
  "title": "Database Connection Failed",
  "description": "Unable to connect to PostgreSQL",
  "stack_trace": "Error: connect ECONNREFUSED...",
  "severity": "high"
}
```

## 🔧 Getting Started

### 1. Get Your API Token

1. Log into your WYND account at https://wynd.mmogomedia.com
2. Navigate to Settings > API Tokens
3. Generate a new token with appropriate permissions
4. Copy the token for use in your environment

### 2. Find Your Project ID

1. Navigate to the project you want to use as default
2. The project ID is displayed in the URL: `https://wynd.mmogomedia.com/projects/{project-id}`
3. Copy this ID and use it as your `DEFAULT_PROJECT_ID`

### 3. Test Your Setup

```bash
# Test the MCP server
WYND_API_TOKEN=your-token DEFAULT_PROJECT_ID=your-project-id npx @mmogomedia/wynd-mcp-server@latest

# You should see:
# ✅ Server running in stdio mode
# ✅ Registered resources: context, projects, documents, errors, tasks, prompts
```

### 4. Discover Context Information

Once connected, your first call should be to get context information:

```javascript
// This will give you everything you need to know about the server
GET wynd://context
```

This returns:
- Default project ID and details
- Available resources and capabilities
- Usage examples and quick start guide
- Server configuration and status

## 💡 Usage Examples

### Get Outstanding Tasks (Default: In Progress)
```javascript
// Automatically filtered to in_progress tasks
const tasks = await client.readResource('wynd://tasks');
console.log(`Found ${tasks.length} in-progress tasks`);
```

### Create a New Task
```javascript
// Uses default project ID automatically
const newTask = await client.createResource('wynd://tasks', {
  title: 'Implement user authentication',
  description: 'Set up JWT-based authentication system',
  priority: 'high',
  status: 'todo'
});
```

### Access Project Information
```javascript
// Get default project details
const project = await client.readResource('wynd://projects/default');
console.log(`Working on: ${project.title}`);

// Get project statistics
const stats = await client.readResource('wynd://projects/default/stats');
```

### Create Documentation
```javascript
const doc = await client.createResource('wynd://documents', {
  title: 'API Documentation',
  content: '# API Reference\n\nThis document describes...',
  type: 'documentation'
});
```

### Use AI Prompts
```javascript
// Find code review prompts
const prompts = await client.readResource('wynd://prompts?query=code+review');

// Use a prompt with variables
const prompt = prompts[0];
const filledPrompt = prompt.content.replace('{{criteria}}', 'security vulnerabilities');
```

## 🏗️ Architecture

### Server Structure
```
wynd-mcp-server/
├── src/
│   ├── api/              # API client and endpoints
│   ├── config/           # Configuration management
│   ├── server/           # MCP server implementation
│   │   └── resources/    # Resource handlers
│   └── utils/            # Utilities and logging
├── build/                # Compiled output
└── package.json          # Package configuration
```

### Resource Architecture
Each resource implements a consistent interface:
- `list()` - Get multiple items
- `read(uri)` - Get specific item
- `create(data)` - Create new item (where applicable)
- `update(uri, data)` - Update item (where applicable)
- `delete(uri)` - Delete item (where applicable)

### Security Model
- **API Token Authentication**: All requests authenticated via Bearer token
- **Project Context**: Operations scoped to configured project
- **Read-Only Projects**: Projects cannot be modified for data integrity
- **Public Error Logs**: Errors are publicly accessible for collaborative debugging

## 🔄 Version Management

### Using @latest (Recommended)
```json
{
  "args": ["-y", "@mmogomedia/wynd-mcp-server@latest"]
}
```
- Always gets the newest version
- Automatic updates with new features
- Best for development and testing

### Using Specific Versions
```json
{
  "args": ["-y", "@mmogomedia/wynd-mcp-server@1.5.0"]
}
```
- Locked to specific version
- Predictable behavior
- Best for production environments

## 📈 Recent Updates

### Version 1.5.0 (Latest)
- ✅ Added `wynd://context` resource for project ID discovery
- ✅ Enhanced resource descriptions and documentation
- ✅ Improved client guidance and usage examples

### Version 1.4.0
- ✅ Task filtering defaults to `in_progress` status
- ✅ Projects made read-only for security
- ✅ Removed workspace and project template resources
- ✅ Enhanced resource descriptions

### Version 1.3.x
- ✅ Fixed stdio transport for MCP clients
- ✅ Changed service name to "wynd"
- ✅ Improved error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@wynd.com
- **Documentation**: https://docs.wynd.com/mcp-server
- **Issues**: https://github.com/mmogomedia/wynd-mcp-server/issues

---

**Built with ❤️ for rapid application development and AI collaboration.**