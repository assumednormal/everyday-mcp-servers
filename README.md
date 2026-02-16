# Everyday MCP Servers

A collection of Model Context Protocol (MCP) servers for everyday life tasks.

## Overview

This repository houses custom MCP servers that help automate and streamline common daily activities. Each server is a standalone MCP implementation that can be used with Claude Desktop, Claude Code, or other MCP clients.

## Servers

| Server | Description | Status |
|--------|-------------|--------|
| [HEB Shopping List](servers/heb-shopping-list/) | Manage HEB grocery shopping lists — search products, add/remove items, view lists | v0.1.0 |
| [AllRecipes](servers/allrecipes/) | Search and retrieve recipes from AllRecipes.com with full details | v0.1.0 |

## Structure

```
everyday-mcp-servers/
├── servers/
│   ├── heb-shopping-list/   # HEB grocery shopping list server
│   └── allrecipes/          # AllRecipes recipe search server
├── tsconfig.base.json       # Shared TypeScript config
├── tsup.config.base.ts      # Shared build config
└── CLAUDE.md                # Development guidelines
```

## Development

Each server lives in its own directory under `/servers` with its own `package.json`, dependencies, and build configuration. All servers share base TypeScript and build configs from the repository root.

### Quick Start

```bash
# Build a specific server
cd servers/<server-name>
npm install
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Type check
npm run typecheck
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node servers/<server-name>/dist/index.js
```

## Getting Started

Instructions for setting up and using individual MCP servers can be found in their respective directories.

## License

MIT
