import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment module
vi.mock('../../../src/config/environment.js', () => ({
  getEnvironment: () => ({
    HEB_SAT_COOKIE: 'test-sat',
    HEB_JSESSIONID: 'test-session',
    HEB_REESE84: 'test-reese',
    HEB_STORE_ID: '123',
  }),
  loadEnvironment: () => ({
    HEB_SAT_COOKIE: 'test-sat',
    HEB_JSESSIONID: 'test-session',
    HEB_REESE84: 'test-reese',
    HEB_STORE_ID: '123',
  }),
}));

// Mock the client module
const mockExecute = vi.fn();
vi.mock('../../../src/api/client.js', () => ({
  getClient: () => ({
    execute: mockExecute,
  }),
  HEBGraphQLClient: vi.fn(),
}));

import { SearchProductsInputSchema, searchProducts } from '../../../src/tools/search-products.js';

describe('SearchProductsInputSchema', () => {
  it('should parse valid input with defaults', () => {
    const result = SearchProductsInputSchema.parse({ searchTerm: 'eggs' });
    expect(result.searchTerm).toBe('eggs');
    expect(result.maxResults).toBe(10);
  });
});

describe('searchProducts', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('should map fullDisplayName to name', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '12345',
              fullDisplayName: 'HEB Organic Large Eggs',
              SKUs: [
                {
                  contextPrices: [
                    { context: 'ONLINE', salePrice: { amount: 3.99 } },
                  ],
                  customerFriendlySize: '12 ct',
                },
              ],
              productImageUrls: [
                { url: 'https://images.heb.com/medium.jpg', size: 'MEDIUM' },
              ],
              brand: { name: 'HEB' },
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'eggs', maxResults: 10 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('HEB Organic Large Eggs');
    expect(result[0].productId).toBe('12345');
  });

  it('should prefer ONLINE price context', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Test Product',
              SKUs: [
                {
                  contextPrices: [
                    { context: 'IN_STORE', salePrice: { amount: 4.99 } },
                    { context: 'ONLINE', salePrice: { amount: 5.49 } },
                  ],
                },
              ],
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });

    expect(result[0].price).toBe(5.49);
  });

  it('should prefer MEDIUM image size', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Test Product',
              SKUs: [{ contextPrices: [] }],
              productImageUrls: [
                { url: 'https://images.heb.com/small.jpg', size: 'SMALL' },
                { url: 'https://images.heb.com/medium.jpg', size: 'MEDIUM' },
                { url: 'https://images.heb.com/large.jpg', size: 'LARGE' },
              ],
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });

    expect(result[0].imageUrl).toBe('https://images.heb.com/medium.jpg');
  });

  it('should fall back to first image when no MEDIUM image', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Test Product',
              SKUs: [{ contextPrices: [] }],
              productImageUrls: [
                { url: 'https://images.heb.com/small.jpg', size: 'SMALL' },
                { url: 'https://images.heb.com/large.jpg', size: 'LARGE' },
              ],
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });

    expect(result[0].imageUrl).toBe('https://images.heb.com/small.jpg');
  });

  it('should handle missing optional fields', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Basic Product',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });

    expect(result[0].price).toBeUndefined();
    expect(result[0].imageUrl).toBeUndefined();
    expect(result[0].brand).toBeUndefined();
    expect(result[0].size).toBeUndefined();
  });

  it('should map IN_STOCK inventory state correctly', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Product',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });
    expect(result[0].availability).toBe('IN_STOCK');
  });

  it('should map LOW_STOCK inventory state correctly', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Product',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'LOW_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });
    expect(result[0].availability).toBe('LOW_STOCK');
  });

  it('should map unknown inventory state to OUT_OF_STOCK', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Product',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'UNAVAILABLE' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });
    expect(result[0].availability).toBe('OUT_OF_STOCK');
  });

  it('should map OUT_OF_STOCK inventory state correctly', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Product',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'OUT_OF_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'test', maxResults: 10 });
    expect(result[0].availability).toBe('OUT_OF_STOCK');
  });

  it('should return empty array when no products found', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'nonexistent', maxResults: 10 });
    expect(result).toEqual([]);
  });

  it('should map brand name correctly', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '100',
              fullDisplayName: 'Hill Country Fare Milk',
              SKUs: [{ contextPrices: [], customerFriendlySize: '1 gal' }],
              brand: { name: 'Hill Country Fare' },
              inventory: { inventoryState: 'IN_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'milk', maxResults: 10 });
    expect(result[0].brand).toBe('Hill Country Fare');
    expect(result[0].size).toBe('1 gal');
  });

  it('should handle multiple products in response', async () => {
    mockExecute.mockResolvedValue({
      productSearchItems: {
        searchGrid: {
          items: [
            {
              id: '1',
              fullDisplayName: 'Product A',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'IN_STOCK' },
            },
            {
              id: '2',
              fullDisplayName: 'Product B',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'LOW_STOCK' },
            },
            {
              id: '3',
              fullDisplayName: 'Product C',
              SKUs: [{ contextPrices: [] }],
              inventory: { inventoryState: 'OUT_OF_STOCK' },
            },
          ],
        },
      },
    });

    const result = await searchProducts({ searchTerm: 'products', maxResults: 10 });
    expect(result).toHaveLength(3);
    expect(result[0].productId).toBe('1');
    expect(result[1].productId).toBe('2');
    expect(result[2].productId).toBe('3');
  });
});
