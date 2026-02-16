import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock external modules so that importing index.ts does not start a real server ──

// Track handler registrations so we can invoke them in tests.
const registeredHandlers = new Map<string, (...args: any[]) => any>();

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn((schema: string, handler: (...args: any[]) => any) => {
      registeredHandlers.set(schema, handler);
    }),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
}));

// Mock the allrecipes module to avoid real network calls from tool handlers.
const mockSearchRecipes = vi.fn();
const mockGetRecipe = vi.fn();

vi.mock('../../src/allrecipes.js', () => ({
  searchRecipes: (...args: any[]) => mockSearchRecipes(...args),
  getRecipe: (...args: any[]) => mockGetRecipe(...args),
}));

// Now import the server module. Because of the mocks above the `main()` call will
// create a mocked Server and StdioServerTransport, so it won't try to use stdio.
await import('../../src/index.js');

// ─── Tool handler tests ─────────────────────────────────────────────────────
// These exercise the actual request handlers registered in index.ts through the
// mocked Server instance.

describe('MCP tool handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function getCallToolHandler() {
    const handler = registeredHandlers.get('CallToolRequestSchema');
    if (!handler) throw new Error('CallToolRequestSchema handler not registered');
    return handler;
  }

  function getListToolsHandler() {
    const handler = registeredHandlers.get('ListToolsRequestSchema');
    if (!handler) throw new Error('ListToolsRequestSchema handler not registered');
    return handler;
  }

  describe('list_tools', () => {
    it('returns both search_recipes and get_recipe tools', async () => {
      const handler = getListToolsHandler();
      const result = await handler();

      expect(result.tools).toHaveLength(2);

      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('search_recipes');
      expect(toolNames).toContain('get_recipe');
    });

    it('search_recipes tool definition has required query property', async () => {
      const handler = getListToolsHandler();
      const result = await handler();

      const searchTool = result.tools.find((t: any) => t.name === 'search_recipes');
      expect(searchTool.inputSchema.required).toContain('query');
      expect(searchTool.inputSchema.properties.query.type).toBe('string');
      expect(searchTool.inputSchema.properties.limit.type).toBe('number');
    });

    it('get_recipe tool definition has required recipeUrl property', async () => {
      const handler = getListToolsHandler();
      const result = await handler();

      const recipeTool = result.tools.find((t: any) => t.name === 'get_recipe');
      expect(recipeTool.inputSchema.required).toContain('recipeUrl');
      expect(recipeTool.inputSchema.properties.recipeUrl.type).toBe('string');
    });
  });

  describe('call_tool: search_recipes', () => {
    it('calls searchRecipes with parsed arguments and returns JSON content', async () => {
      const mockResults = [
        { id: '1', title: 'Mock Recipe', url: 'https://www.allrecipes.com/recipe/1/mock/' },
      ];
      mockSearchRecipes.mockResolvedValueOnce(mockResults);

      const handler = getCallToolHandler();
      const result = await handler({
        params: { name: 'search_recipes', arguments: { query: 'chicken', limit: 5 } },
      });

      expect(mockSearchRecipes).toHaveBeenCalledWith('chicken', 5);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockResults);
    });

    it('uses default limit of 10 when limit is not provided', async () => {
      mockSearchRecipes.mockResolvedValueOnce([]);

      const handler = getCallToolHandler();
      await handler({
        params: { name: 'search_recipes', arguments: { query: 'soup' } },
      });

      expect(mockSearchRecipes).toHaveBeenCalledWith('soup', 10);
    });

    it('returns error content on Zod validation failure', async () => {
      const handler = getCallToolHandler();
      const result = await handler({
        params: { name: 'search_recipes', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('returns error content when searchRecipes throws', async () => {
      mockSearchRecipes.mockRejectedValueOnce(new Error('Fetch failed'));

      const handler = getCallToolHandler();
      const result = await handler({
        params: { name: 'search_recipes', arguments: { query: 'failing' } },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Fetch failed');
    });
  });

  describe('call_tool: get_recipe', () => {
    it('calls getRecipe with the recipeUrl and returns JSON content', async () => {
      const mockRecipe = {
        id: '12345',
        name: 'Test Recipe',
        url: 'https://www.allrecipes.com/recipe/12345/test/',
        ingredients: ['1 cup flour'],
        instructions: ['Mix well.'],
      };
      mockGetRecipe.mockResolvedValueOnce(mockRecipe);

      const handler = getCallToolHandler();
      const result = await handler({
        params: {
          name: 'get_recipe',
          arguments: { recipeUrl: 'https://www.allrecipes.com/recipe/12345/test/' },
        },
      });

      expect(mockGetRecipe).toHaveBeenCalledWith(
        'https://www.allrecipes.com/recipe/12345/test/',
      );
      expect(result.content).toHaveLength(1);
      expect(JSON.parse(result.content[0].text)).toEqual(mockRecipe);
    });

    it('returns error content on Zod validation failure', async () => {
      const handler = getCallToolHandler();
      const result = await handler({
        params: { name: 'get_recipe', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    });

    it('returns error content when getRecipe throws', async () => {
      mockGetRecipe.mockRejectedValueOnce(new Error('Recipe not found'));

      const handler = getCallToolHandler();
      const result = await handler({
        params: {
          name: 'get_recipe',
          arguments: { recipeUrl: 'https://www.allrecipes.com/recipe/99999/missing/' },
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Recipe not found');
    });
  });

  describe('call_tool: unknown tool', () => {
    it('returns error for an unknown tool name', async () => {
      const handler = getCallToolHandler();
      const result = await handler({
        params: { name: 'nonexistent_tool', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });
  });
});
