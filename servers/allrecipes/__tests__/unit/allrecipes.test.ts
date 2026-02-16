import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildSearchCard,
  buildSearchResultsPage,
  buildJsonLdPage,
  buildHtmlFallbackRecipePage,
  buildInvalidJsonLdWithFallback,
  buildEmptySearchPage,
  buildJsonLdArrayPage,
} from '../fixtures/html.js';

// We mock global fetch because `fetchHtml` (called internally by searchRecipes / getRecipe)
// uses the native `fetch` API.  This avoids any real network calls.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper to make `fetch` resolve with the given HTML body.
function mockFetchHtml(html: string): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    text: () => Promise.resolve(html),
  });
}

// Helper to make `fetch` reject with an HTTP error.
function mockFetchError(status: number, statusText: string): void {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
  });
}

// Dynamic import so that the global `fetch` stub is already in place when the module loads.
const { searchRecipes, getRecipe } = await import('../../src/allrecipes.js');

describe('searchRecipes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Re-stub fetch after restoreAllMocks clears it.
    vi.stubGlobal('fetch', mockFetch);
  });

  it('parses recipe cards from search results HTML', async () => {
    const cards = [
      buildSearchCard({
        href: 'https://www.allrecipes.com/recipe/12345/chicken-parmesan/',
        title: 'Chicken Parmesan',
        dataSrc: 'https://img.example.com/chicken.jpg',
        rating: '4.5',
        reviewCount: 123,
        description: 'A classic Italian-American dish.',
      }),
      buildSearchCard({
        href: 'https://www.allrecipes.com/recipe/67890/beef-stew/',
        title: 'Beef Stew',
        imgSrc: 'https://img.example.com/stew.jpg',
        rating: '4.2',
        reviewCount: 85,
      }),
    ];

    mockFetchHtml(buildSearchResultsPage(cards));

    const results = await searchRecipes('chicken', 10);

    expect(results).toHaveLength(2);

    // First card assertions
    expect(results[0].id).toBe('12345');
    expect(results[0].title).toBe('Chicken Parmesan');
    expect(results[0].url).toBe('https://www.allrecipes.com/recipe/12345/chicken-parmesan/');
    expect(results[0].imageUrl).toBe('https://img.example.com/chicken.jpg');
    expect(results[0].rating).toBe(4.5);
    expect(results[0].reviewCount).toBe(123);
    expect(results[0].description).toBe('A classic Italian-American dish.');

    // Second card assertions
    expect(results[1].id).toBe('67890');
    expect(results[1].title).toBe('Beef Stew');
    expect(results[1].imageUrl).toBe('https://img.example.com/stew.jpg');
    expect(results[1].rating).toBe(4.2);
    expect(results[1].reviewCount).toBe(85);
    expect(results[1].description).toBeUndefined();
  });

  it('respects the limit parameter', async () => {
    const cards = Array.from({ length: 5 }, (_, i) =>
      buildSearchCard({
        href: `https://www.allrecipes.com/recipe/${1000 + i}/recipe-${i}/`,
        title: `Recipe ${i}`,
        dataSrc: `https://img.example.com/${i}.jpg`,
      }),
    );

    mockFetchHtml(buildSearchResultsPage(cards));

    const results = await searchRecipes('pasta', 2);

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1000');
    expect(results[1].id).toBe('1001');
  });

  it('filters out non-recipe URLs (articles, category pages)', async () => {
    const cards = [
      // Valid recipe card
      buildSearchCard({
        href: 'https://www.allrecipes.com/recipe/11111/good-recipe/',
        title: 'Good Recipe',
      }),
      // Article URL - no /recipe/ID/ pattern -- built manually to bypass helper
    ];

    // We also add a non-recipe card manually that has the right class but wrong URL format
    const articleCard = `
      <a class="mntl-card-list-card--extendable" href="https://www.allrecipes.com/article/best-chicken-recipes/">
        <span class="card__title-text">Best Chicken ArticleBest Chicken Article</span>
      </a>`;

    const categoryCard = `
      <a class="mntl-card-list-card--extendable" href="https://www.allrecipes.com/recipes/96/salad/">
        <span class="card__title-text">Salad RecipesSalad Recipes</span>
      </a>`;

    const html = buildSearchResultsPage([...cards, articleCard, categoryCard]);
    mockFetchHtml(html);

    const results = await searchRecipes('chicken', 10);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('11111');
    expect(results[0].title).toBe('Good Recipe');
  });

  it('returns empty array when no cards match', async () => {
    mockFetchHtml(buildEmptySearchPage());

    const results = await searchRecipes('nonexistent dish xyz', 10);

    expect(results).toHaveLength(0);
  });

  it('normalises relative URLs to absolute', async () => {
    const cards = [
      buildSearchCard({
        href: '/recipe/99999/relative-recipe/',
        title: 'Relative Recipe',
      }),
    ];

    mockFetchHtml(buildSearchResultsPage(cards));

    const results = await searchRecipes('relative', 10);

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://www.allrecipes.com/recipe/99999/relative-recipe/');
  });

  it('extracts image from src when data-src is absent', async () => {
    const cards = [
      buildSearchCard({
        href: 'https://www.allrecipes.com/recipe/22222/src-image/',
        title: 'Src Image Recipe',
        imgSrc: 'https://img.example.com/src-only.jpg',
      }),
    ];

    mockFetchHtml(buildSearchResultsPage(cards));

    const results = await searchRecipes('image test', 10);

    expect(results[0].imageUrl).toBe('https://img.example.com/src-only.jpg');
  });

  it('handles cards with no image gracefully', async () => {
    // Build a card manually without any img tag
    const cardHtml = `
      <a class="mntl-card-list-card--extendable" href="https://www.allrecipes.com/recipe/33333/no-image/">
        <span class="card__title-text">No Image RecipeNo Image Recipe</span>
      </a>`;

    mockFetchHtml(buildSearchResultsPage([cardHtml]));

    const results = await searchRecipes('no image', 10);

    expect(results).toHaveLength(1);
    expect(results[0].imageUrl).toBeUndefined();
  });

  it('passes correct URL and headers to fetch', async () => {
    mockFetchHtml(buildEmptySearchPage());

    await searchRecipes('test query', 10);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://www.allrecipes.com/search?q=test%20query');
    expect(options.headers['User-Agent']).toBeDefined();
    expect(options.redirect).toBe('follow');
  });

  it('throws on HTTP errors from fetch', async () => {
    mockFetchError(503, 'Service Unavailable');

    await expect(searchRecipes('error', 10)).rejects.toThrow('HTTP 503');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getRecipe
// ─────────────────────────────────────────────────────────────────────────────

describe('getRecipe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  // ── JSON-LD path ──────────────────────────────────────────────────────────

  describe('JSON-LD path', () => {
    it('parses a full recipe from JSON-LD data', async () => {
      const html = buildJsonLdPage({
        name: 'Classic Pancakes',
        description: 'Fluffy homemade pancakes.',
        authorName: 'Jane Baker',
        prepTime: 'PT10M',
        cookTime: 'PT15M',
        totalTime: 'PT25M',
        recipeYield: '4 servings',
        ingredients: ['2 cups flour', '2 eggs', '1 cup milk'],
        instructions: [
          { text: 'Mix dry ingredients together.' },
          { text: 'Add wet ingredients and stir.' },
          { text: 'Cook on griddle until golden.' },
        ],
        nutrition: {
          calories: '350 calories',
          fatContent: '12g',
          proteinContent: '8g',
          carbohydrateContent: '50g',
          sodiumContent: '400mg',
        },
        aggregateRating: { ratingValue: '4.8', reviewCount: '256' },
        image: ['https://img.example.com/pancakes.jpg'],
        url: 'https://www.allrecipes.com/recipe/21014/classic-pancakes/',
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/21014/classic-pancakes/');

      expect(recipe.id).toBe('21014');
      expect(recipe.name).toBe('Classic Pancakes');
      expect(recipe.description).toBe('Fluffy homemade pancakes.');
      expect(recipe.author).toBe('Jane Baker');
      expect(recipe.prepTime).toBe('PT10M');
      expect(recipe.cookTime).toBe('PT15M');
      expect(recipe.totalTime).toBe('PT25M');
      expect(recipe.servings).toBe('4 servings');
      expect(recipe.ingredients).toEqual(['2 cups flour', '2 eggs', '1 cup milk']);
      expect(recipe.instructions).toEqual([
        'Mix dry ingredients together.',
        'Add wet ingredients and stir.',
        'Cook on griddle until golden.',
      ]);
      expect(recipe.nutrition).toEqual({
        calories: '350 calories',
        fat: '12g',
        protein: '8g',
        carbs: '50g',
        sodium: '400mg',
      });
      expect(recipe.calories).toBe('350 calories');
      expect(recipe.rating).toBe(4.8);
      expect(recipe.reviewCount).toBe(256);
      expect(recipe.imageUrl).toBe('https://img.example.com/pancakes.jpg');
      expect(recipe.url).toBe('https://www.allrecipes.com/recipe/21014/classic-pancakes/');
    });

    it('handles instructions as plain strings', async () => {
      const html = buildJsonLdPage({
        name: 'Simple Toast',
        ingredients: ['2 slices bread'],
        instructions: ['Put bread in toaster.', 'Wait until golden.', 'Butter and serve.'],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10001/simple-toast/');

      expect(recipe.instructions).toEqual([
        'Put bread in toaster.',
        'Wait until golden.',
        'Butter and serve.',
      ]);
    });

    it('handles @type as an array (e.g. ["Recipe", "HowTo"])', async () => {
      const html = buildJsonLdPage({
        type: ['Recipe', 'HowTo'],
        name: 'Multi-Type Recipe',
        ingredients: ['1 item'],
        instructions: [{ text: 'Do the thing.' }],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10002/multi-type/');

      expect(recipe.name).toBe('Multi-Type Recipe');
      expect(recipe.ingredients).toEqual(['1 item']);
    });

    it('handles image as a single string (not an array)', async () => {
      const html = buildJsonLdPage({
        name: 'Single Image Recipe',
        image: 'https://img.example.com/single.jpg',
        ingredients: [],
        instructions: [],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10003/single-image/');

      expect(recipe.imageUrl).toBe('https://img.example.com/single.jpg');
    });

    it('handles image as an array and picks the first', async () => {
      const html = buildJsonLdPage({
        name: 'Array Image Recipe',
        image: ['https://img.example.com/first.jpg', 'https://img.example.com/second.jpg'],
        ingredients: [],
        instructions: [],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10004/array-image/');

      expect(recipe.imageUrl).toBe('https://img.example.com/first.jpg');
    });

    it('handles missing optional fields gracefully', async () => {
      const html = buildJsonLdPage({
        name: 'Minimal Recipe',
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10005/minimal/');

      expect(recipe.name).toBe('Minimal Recipe');
      expect(recipe.description).toBeUndefined();
      expect(recipe.author).toBeUndefined();
      expect(recipe.prepTime).toBeUndefined();
      expect(recipe.cookTime).toBeUndefined();
      expect(recipe.totalTime).toBeUndefined();
      expect(recipe.servings).toBeUndefined();
      expect(recipe.rating).toBeUndefined();
      expect(recipe.reviewCount).toBeUndefined();
      expect(recipe.imageUrl).toBeUndefined();
      expect(recipe.nutrition).toBeUndefined();
      expect(recipe.ingredients).toEqual([]);
      expect(recipe.instructions).toEqual([]);
    });

    it('extracts recipe from a JSON-LD array containing multiple types', async () => {
      const html = buildJsonLdArrayPage({
        name: 'Array Recipe',
        ingredients: ['1 cup sugar'],
        instructions: [{ text: 'Stir well.' }],
        url: 'https://www.allrecipes.com/recipe/10006/array-recipe/',
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10006/array-recipe/');

      expect(recipe.name).toBe('Array Recipe');
      expect(recipe.ingredients).toEqual(['1 cup sugar']);
    });

    it('maps all nutrition fields correctly', async () => {
      const html = buildJsonLdPage({
        name: 'Nutrition Test',
        nutrition: {
          calories: '200 calories',
          fatContent: '10g',
          saturatedFatContent: '3g',
          unsaturatedFatContent: '7g',
          carbohydrateContent: '25g',
          sugarContent: '5g',
          fiberContent: '3g',
          proteinContent: '8g',
          cholesterolContent: '30mg',
          sodiumContent: '500mg',
        },
        ingredients: [],
        instructions: [],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/10007/nutrition-test/');

      expect(recipe.nutrition).toEqual({
        calories: '200 calories',
        fat: '10g',
        saturatedFat: '3g',
        unsaturatedFat: '7g',
        carbs: '25g',
        sugar: '5g',
        fiber: '3g',
        protein: '8g',
        cholesterol: '30mg',
        sodium: '500mg',
      });
    });
  });

  // ── HTML fallback path ────────────────────────────────────────────────────

  describe('HTML fallback path', () => {
    it('parses recipe from HTML when no JSON-LD is present', async () => {
      const html = buildHtmlFallbackRecipePage({
        name: 'Fallback Brownies',
        ingredients: ['1 cup cocoa', '2 cups sugar', '3 eggs'],
        instructions: [
          'Preheat oven to 350 degrees Fahrenheit.',
          'Mix all ingredients together in a large bowl.',
          'Bake for 25 minutes until set.',
        ],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/40001/fallback-brownies/');

      expect(recipe.id).toBe('40001');
      expect(recipe.name).toBe('Fallback Brownies');
      expect(recipe.ingredients).toContain('1 cup cocoa');
      expect(recipe.ingredients).toContain('2 cups sugar');
      expect(recipe.ingredients).toContain('3 eggs');
      expect(recipe.instructions).toContain('Preheat oven to 350 degrees Fahrenheit.');
      expect(recipe.instructions).toContain('Mix all ingredients together in a large bowl.');
      expect(recipe.instructions).toContain('Bake for 25 minutes until set.');
    });

    it('filters out short instruction text (length <= 10)', async () => {
      const html = buildHtmlFallbackRecipePage({
        name: 'Filter Test Recipe',
        ingredients: ['1 item'],
        instructions: [
          'Short',  // length <= 10, should be filtered out
          'This instruction is long enough to pass the filter.',
        ],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/40002/filter-test/');

      expect(recipe.instructions).toHaveLength(1);
      expect(recipe.instructions[0]).toBe('This instruction is long enough to pass the filter.');
    });

    it('falls back to HTML when JSON-LD contains invalid JSON', async () => {
      const html = buildInvalidJsonLdWithFallback({
        name: 'Invalid JSON Fallback',
        ingredients: ['salt', 'pepper'],
        instructions: [
          'Season generously with salt and pepper to taste.',
        ],
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/40003/invalid-json/');

      expect(recipe.name).toBe('Invalid JSON Fallback');
      expect(recipe.ingredients).toContain('salt');
      expect(recipe.ingredients).toContain('pepper');
      expect(recipe.instructions).toContain('Season generously with salt and pepper to taste.');
    });
  });

  // ── URL handling ──────────────────────────────────────────────────────────

  describe('URL handling', () => {
    it('accepts a full URL and extracts the recipe ID', async () => {
      const html = buildJsonLdPage({
        name: 'Full URL Recipe',
        url: 'https://www.allrecipes.com/recipe/54321/full-url/',
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('https://www.allrecipes.com/recipe/54321/full-url/');

      expect(recipe.id).toBe('54321');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.allrecipes.com/recipe/54321/full-url/',
        expect.any(Object),
      );
    });

    it('accepts just a recipe ID and constructs the URL', async () => {
      const html = buildJsonLdPage({
        name: 'ID Only Recipe',
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('12345');

      expect(recipe.id).toBe('12345');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.allrecipes.com/recipe/12345',
        expect.any(Object),
      );
    });

    it('constructs the correct fallback URL in the recipe object for ID-only input', async () => {
      // When only an ID is given and there is no url in JSON-LD, the code uses BASE_URL + /recipe/ID
      const html = buildJsonLdPage({
        name: 'ID URL Test',
      });

      mockFetchHtml(html);

      const recipe = await getRecipe('77777');

      expect(recipe.url).toBe('https://www.allrecipes.com/recipe/77777');
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws on HTTP errors', async () => {
      mockFetchError(404, 'Not Found');

      await expect(
        getRecipe('https://www.allrecipes.com/recipe/99999/not-found/'),
      ).rejects.toThrow('HTTP 404');
    });

    it('throws on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        getRecipe('https://www.allrecipes.com/recipe/88888/network-fail/'),
      ).rejects.toThrow('Network failure');
    });
  });
});
