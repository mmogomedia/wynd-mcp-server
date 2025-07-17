# GitHub Repository Setup Guide

This guide explains how to set up the WYND MCP Server as a public GitHub repository and publish it to GitHub Package Registry.

## Repository Setup

### 1. Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Repository name: `wynd-mcp-server`
3. Organization: `mmogomedia`
4. Set as **Public** repository
5. Initialize with README: **No** (we already have one)

### 2. Initialize Git Repository
```bash
cd /home/tawanda/.local/share/Kilo-Code/MCP/wynd-server
git init
git add .
git commit -m "Initial commit: WYND MCP Server package"
git branch -M main
git remote add origin https://github.com/mmogomedia/wynd-mcp-server.git
git push -u origin main
```

### 3. GitHub Package Registry Setup

#### Create Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with these permissions:
   - `read:packages` (for installing packages)
   - `write:packages` (for publishing packages)
   - `delete:packages` (optional, for managing packages)

#### Configure NPM for GitHub Package Registry
```bash
# Login to GitHub Package Registry
npm login --registry=https://npm.pkg.github.com
# Username: your-github-username
# Password: your-personal-access-token
# Email: your-email@example.com
```

#### Alternative: Use .npmrc file
Create a `.npmrc` file in your home directory:
```
//npm.pkg.github.com/:_authToken=YOUR_PERSONAL_ACCESS_TOKEN
@mmogomedia:registry=https://npm.pkg.github.com
```

## Publishing the Package

### 1. Build and Test
```bash
npm run build
npm pack
```

### 2. Publish to GitHub Package Registry
```bash
npm publish
```

## Installation for Users

### Prerequisites
Users need to authenticate with GitHub Package Registry:
```bash
npm login --registry=https://npm.pkg.github.com
```

### Installation Methods
```bash
# Global installation
npm install -g @mmogomedia/wynd-mcp-server --registry=https://npm.pkg.github.com

# NPX usage
npx @mmogomedia/wynd-mcp-server --registry=https://npm.pkg.github.com

# Or configure .npmrc for easier access
echo "@mmogomedia:registry=https://npm.pkg.github.com" >> ~/.npmrc
npm install -g @mmogomedia/wynd-mcp-server
```

## Repository Structure
```
wynd-mcp-server/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
│   ├── index.js         # Main executable
│   └── index.d.ts       # TypeScript definitions
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
├── README.md            # Main documentation
├── LICENSE              # MIT License
├── .gitignore           # Git ignore rules
├── install.sh           # Installation script
├── DISTRIBUTION.md      # Distribution guide
└── GITHUB_SETUP.md      # This file
```

## Continuous Integration (Optional)

Consider adding GitHub Actions for:
- Automated testing
- Automated publishing on releases
- Code quality checks

Example `.github/workflows/publish.yml`:
```yaml
name: Publish Package
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Support and Issues

- **Repository**: https://github.com/mmogomedia/wynd-mcp-server
- **Issues**: https://github.com/mmogomedia/wynd-mcp-server/issues
- **Documentation**: See README.md for complete usage instructions