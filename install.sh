#!/bin/bash

# WYND MCP Server Installation Script

set -e

echo "🚀 Installing WYND MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Install the package globally
echo "📦 Installing @wynd/mcp-server globally..."
npm install -g @wynd/mcp-server

echo "✅ WYND MCP Server installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Get your WYND API token from https://wynd.mmogomedia.com/settings/api"
echo "2. Set the WYND_API_TOKEN environment variable"
echo "3. Add the server to your MCP client configuration"
echo ""
echo "📖 For detailed setup instructions, visit:"
echo "   https://github.com/wynd/mcp-server#readme"
echo ""
echo "🎉 Happy coding with WYND!"