import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { searchProducts, SearchProductsInputSchema } from './tools/search-products.js';
import { getShoppingLists } from './tools/get-lists.js';
import { getListItems, GetListItemsInputSchema } from './tools/get-list-items.js';
import { addToList, AddToListInputSchema } from './tools/add-to-list.js';
import { removeFromList, RemoveFromListInputSchema } from './tools/remove-from-list.js';

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'heb-shopping-list',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'heb_search_products',
          description:
            'ALWAYS use this tool FIRST when the user wants to add a product to their shopping list. Search for products at HEB by name or keyword and SHOW the results to the user so they can choose which specific product they want. Returns a list of products with their ID, name, price, brand, size, and availability. The user can then select from these options.',
          inputSchema: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'The product name or keyword to search for (e.g., "eggs", "milk", "bread")',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)',
                default: 10,
              },
            },
            required: ['searchTerm'],
          },
        },
        {
          name: 'heb_add_to_list',
          description:
            'Add a specific product to the HEB shopping list. PREFERRED: Use with productId after showing search results to the user. ALTERNATIVE: Use searchTerm to automatically add the top result only when the user explicitly confirms they want the first/top result without seeing options.',
          inputSchema: {
            type: 'object',
            properties: {
              productId: {
                type: 'string',
                description: 'The specific HEB product ID to add. Use this after showing search results to the user and they have selected a product.',
              },
              searchTerm: {
                type: 'string',
                description: 'Search term to automatically find and add the top result (e.g., "eggs"). Only use this if the user explicitly wants to skip seeing options and add the first result directly.',
              },
              quantity: {
                type: 'number',
                description: 'Quantity to add (default: 1)',
                default: 1,
              },
              listId: {
                type: 'string',
                description: 'Shopping list ID (optional if HEB_DEFAULT_LIST_ID is set)',
              },
            },
          },
        },
        {
          name: 'heb_get_shopping_lists',
          description:
            'Get all your HEB shopping lists. Returns a list of shopping lists with their ID, name, and item count. Use this to find list IDs for adding items or viewing list contents.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'heb_get_list_items',
          description:
            'Get all items in a specific HEB shopping list. Returns detailed information about each item including product name, quantity, price, and checked status.',
          inputSchema: {
            type: 'object',
            properties: {
              listId: {
                type: 'string',
                description: 'Shopping list ID (optional if HEB_DEFAULT_LIST_ID is set)',
              },
            },
          },
        },
        {
          name: 'heb_remove_from_list',
          description:
            'Remove item(s) from your HEB shopping list. You can remove by item IDs (from get_list_items) or by product name (will remove all matching items). Use this when the user wants to delete or remove items from their list.',
          inputSchema: {
            type: 'object',
            properties: {
              itemIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Array of shopping list item IDs to remove (get these from heb_get_list_items)',
              },
              productName: {
                type: 'string',
                description: 'Product name to search for and remove all matching items (e.g., "eggs"). Use this when user says "remove eggs" without specifying which one.',
              },
              listId: {
                type: 'string',
                description: 'Shopping list ID (optional if HEB_DEFAULT_LIST_ID is set)',
              },
            },
          },
        },
      ],
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case 'heb_search_products': {
          const input = SearchProductsInputSchema.parse(request.params.arguments);
          const products = await searchProducts(input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(products, null, 2),
              },
            ],
          };
        }

        case 'heb_add_to_list': {
          const input = AddToListInputSchema.parse(request.params.arguments);
          const result = await addToList(input);
          return {
            content: [
              {
                type: 'text',
                text: result.message,
              },
            ],
          };
        }

        case 'heb_get_shopping_lists': {
          const lists = await getShoppingLists();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(lists, null, 2),
              },
            ],
          };
        }

        case 'heb_get_list_items': {
          const input = GetListItemsInputSchema.parse(request.params.arguments);
          const listDetail = await getListItems(input);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(listDetail, null, 2),
              },
            ],
          };
        }

        case 'heb_remove_from_list': {
          const input = RemoveFromListInputSchema.parse(request.params.arguments);
          const result = await removeFromList(input);
          return {
            content: [
              {
                type: 'text',
                text: result.message,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Run the server with stdio transport
 */
export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('HEB Shopping List MCP server running on stdio');
}
