#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { searchRecipes, getRecipe } from './allrecipes.js';

// Tool input schemas
const SearchRecipesSchema = z.object({
  query: z.string().describe('Search query for recipes (e.g., "chicken pasta", "healthy salad")'),
  limit: z.number().min(1).max(50).optional().describe('Maximum number of results to return (default: 10)'),
});

const GetRecipeSchema = z.object({
  recipeUrl: z.string().describe('The full recipe URL from search results (e.g., "https://www.allrecipes.com/recipe/240747/mommas-healthy-meatloaf/")'),
});

// Create server instance
const server = new Server(
  {
    name: 'allrecipes',
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
      {
        name: 'search_recipes',
        description:
          'Search for recipes on AllRecipes.com by keyword. Returns a list of matching recipes with basic information.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for recipes (e.g., "chicken pasta", "healthy salad")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10, max: 50)',
              minimum: 1,
              maximum: 50,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_recipe',
        description:
          'Get detailed information about a specific recipe by its URL. Returns full recipe details including ingredients, instructions, nutrition, ratings, and more. IMPORTANT: Use the full URL returned from search_recipes, not just the recipe ID.',
        inputSchema: {
          type: 'object',
          properties: {
            recipeUrl: {
              type: 'string',
              description: 'The full recipe URL from search results (e.g., "https://www.allrecipes.com/recipe/240747/mommas-healthy-meatloaf/")',
            },
          },
          required: ['recipeUrl'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'search_recipes') {
      const { query, limit = 10 } = SearchRecipesSchema.parse(args);
      const results = await searchRecipes(query, limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    if (name === 'get_recipe') {
      const { recipeUrl } = GetRecipeSchema.parse(args);
      const recipe = await getRecipe(recipeUrl);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(recipe, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
});

// Start server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AllRecipes MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
