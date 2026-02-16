---
name: create-mcp-server
description: Scaffold a new MCP server with all required boilerplate files following the project's established patterns. Use when creating a new server under /servers/.
---

You are scaffolding a new MCP server for the everyday-mcp-servers project.

## Required Information

Before scaffolding, confirm these with the user:
1. **Server name** (kebab-case, e.g., "weather-forecast")
2. **Brief description** (one sentence)
3. **Does it need environment variables/API keys?** (determines if config/environment.ts is needed)
4. **List of tools** the server will provide (name + brief description of each)

## File Structure

```
servers/{name}/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
└── src/
    ├── index.ts          # Entry point + server setup + tool handlers
    └── {name}.ts         # Core business logic (API calls, data processing)
```

For servers with auth/env vars, also create:
```
    ├── config/
    │   └── environment.ts  # Zod-based env validation
```

For servers with 4+ tools, use modular structure:
```
    ├── server.ts           # Server setup + tool registration
    ├── api/
    │   ├── client.ts       # API client with error handling
    │   └── types.ts        # API types and interfaces
    ├── tools/
    │   └── {tool-name}.ts  # One file per tool (exports InputSchema + handler)
    └── utils/
        ├── errors.ts       # Custom error classes
        └── validation.ts   # Input validation helpers
```

## Template: package.json

```json
{
  "name": "@everyday-mcp/{name}",
  "version": "0.1.0",
  "description": "{description}",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsx src/index.ts",
    "watch": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "{additional-keywords}"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "vitest": "^3.0.0"
  }
}
```

## Template: tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Template: tsup.config.ts

```typescript
import { defineConfig } from 'tsup';
import { baseConfig } from '../../tsup.config.base.js';

export default defineConfig({
  ...baseConfig,
});
```

## Template: src/index.ts (Standard Server)

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Tool input schemas
// const MyToolSchema = z.object({ ... });

// Create server instance
const server = new Server(
  {
    name: '{name}',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Define tools here with name, description, and inputSchema
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Tool handlers here
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{Name} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Template: src/index.ts (Server with Environment Variables)

```typescript
#!/usr/bin/env node

import { runServer } from './server.js';
import { loadEnvironment } from './config/environment.js';

async function main(): Promise<void> {
  try {
    loadEnvironment();
    await runServer();
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
```

## Template: config/environment.ts

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Define required environment variables here
  // EXAMPLE_API_KEY: z.string().min(1, 'EXAMPLE_API_KEY is required'),
});

export type Environment = z.infer<typeof envSchema>;

export function loadEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}

export function getEnvironment(): Environment {
  return loadEnvironment();
}
```

## Template: README.md

Follow this structure:
1. Title (`# {Name} MCP Server`) + one-line description
2. Features (bulleted list of tools)
3. Installation (`npm install && npm run build`)
4. Configuration (env vars table if applicable, "No configuration required!" if not)
5. Usage section with Claude Desktop and Claude Code JSON configs:
   ```json
   {
     "mcpServers": {
       "{name}": {
         "command": "node",
         "args": ["/path/to/servers/{name}/dist/index.js"]
       }
     }
   }
   ```
6. Available Tools (one subsection per tool with Parameters table and Returns description)
7. Development (`npm run dev`, `npm run build`, `npm run typecheck`, `npm test`)
8. License: MIT

## MCP Tool Definition Conventions

- `name`: snake_case, optionally prefixed for context (e.g., `heb_search_products`)
- `description`: Detailed, uses directive language per CLAUDE.md guidelines. Use "ALWAYS", "FIRST", "PREFERRED", "ALTERNATIVE" to guide Claude's behavior.
- `inputSchema`: Full JSON Schema with type, properties, required, and descriptions on every property

## Error Handling Convention

The `CallToolRequestSchema` handler MUST:
1. Wrap all tool executions in try/catch
2. Return `{ content: [{ type: 'text', text: errorMessage }], isError: true }` on error
3. Never let unhandled exceptions crash the server

## After Scaffolding

1. Run `npm install` in the new server directory
2. Run `npm run typecheck` to verify TypeScript setup
3. Run `npm run build` to verify the build works
4. Implement the tools in the business logic module
5. Write unit tests in `__tests__/`
6. Test with MCP Inspector: `npx @modelcontextprotocol/inspector node servers/{name}/dist/index.js`
7. Update the root `.env.example` if env vars are needed
8. Update the root `README.md` to list the new server
