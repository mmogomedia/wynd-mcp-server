# WYND MCP Server - Distribution Package

## Package Information
- **Package Name**: `@mmogomedia/wynd-mcp-server`
- **Version**: 1.0.0
- **Binary Name**: `wynd-mcp-server`
- **Package Size**: 12.1 kB (compressed)
- **Unpacked Size**: 101.2 kB
- **Registry**: GitHub Package Registry

## Distribution Files
- `mmogomedia-wynd-mcp-server-1.0.0.tgz` - NPM package tarball
- `install.sh` - Installation script with Node.js version checking

## Installation Methods

### Method 1: GitHub Package Registry Installation
```bash
npm install -g @mmogomedia/wynd-mcp-server --registry=https://npm.pkg.github.com
```

### Method 2: NPX (No Installation Required)
```bash
npx @mmogomedia/wynd-mcp-server --registry=https://npm.pkg.github.com
```

### Method 3: Local Package Installation
```bash
npm install -g mmogomedia-wynd-mcp-server-1.0.0.tgz
```

### Authentication for GitHub Package Registry
You'll need to authenticate with GitHub Package Registry first:
```bash
npm login --registry=https://npm.pkg.github.com
```
Use your GitHub username and a personal access token with `read:packages` permission.

### Method 4: Installation Script
```bash
chmod +x install.sh
./install.sh
```

## Package Contents
- `build/index.js` - Main executable server (89.4kB)
- `build/index.d.ts` - TypeScript definitions (291B)
- `package.json` - Package metadata (1.5kB)
- `README.md` - Complete documentation (8.9kB)
- `LICENSE` - MIT License (1.1kB)

## Verification
After installation, verify the server is working:

```bash
# Check binary location
which wynd-mcp-server

# Test server startup (will timeout after 3 seconds)
WYND_API_TOKEN=test-token timeout 3s wynd-mcp-server || echo "Server test completed"
```

## Configuration
The server requires the following environment variable:
- `WYND_API_TOKEN` - Your WYND API authentication token

## MCP Client Configuration
Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "wynd": {
      "command": "wynd-mcp-server",
      "env": {
        "WYND_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

## Publishing to GitHub Package Registry
To publish this package to the GitHub Package Registry:

```bash
npm login --registry=https://npm.pkg.github.com
npm publish
```

Note: You'll need a GitHub personal access token with `write:packages` permission to publish.

## Support
For issues and documentation, see the README.md file included in the package.