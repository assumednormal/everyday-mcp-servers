import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment module
vi.mock('../../../src/config/environment.js', () => ({
  getEnvironment: () => ({
    HEB_SAT_COOKIE: 'test-sat',
    HEB_JSESSIONID: 'test-session',
    HEB_REESE84: 'test-reese',
    HEB_STORE_ID: '123',
    HEB_DEFAULT_LIST_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  }),
  loadEnvironment: () => ({
    HEB_SAT_COOKIE: 'test-sat',
    HEB_JSESSIONID: 'test-session',
    HEB_REESE84: 'test-reese',
    HEB_STORE_ID: '123',
    HEB_DEFAULT_LIST_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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

import { GetListItemsInputSchema, getListItems } from '../../../src/tools/get-list-items.js';

describe('GetListItemsInputSchema', () => {
  it('should parse valid input with UUID listId', () => {
    const result = GetListItemsInputSchema.parse({
      listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.listId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('should parse input without listId (optional)', () => {
    const result = GetListItemsInputSchema.parse({});
    expect(result.listId).toBeUndefined();
  });

  it('should reject invalid UUID format', () => {
    expect(() => GetListItemsInputSchema.parse({ listId: 'not-a-uuid' })).toThrow();
  });
});

describe('getListItems', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('should map response with items correctly', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'My Groceries',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-15T00:00:00Z',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: {
                id: 'prod-1',
                fullDisplayName: 'HEB Whole Milk',
                productImageUrls: [
                  { url: 'https://images.heb.com/small.jpg', size: 'SMALL' },
                  { url: 'https://images.heb.com/medium.jpg', size: 'MEDIUM' },
                ],
              },
              quantity: 2,
              checked: false,
              itemPrice: { salePrice: 4.99 },
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.id).toBe('list-1');
    expect(result.name).toBe('My Groceries');
    expect(result.itemCount).toBe(1);
    expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(result.updatedAt).toBe('2024-01-15T00:00:00Z');
    expect(result.items).toHaveLength(1);
  });

  it('should prefer MEDIUM image for list items', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: {
                id: 'prod-1',
                fullDisplayName: 'Product',
                productImageUrls: [
                  { url: 'https://images.heb.com/small.jpg', size: 'SMALL' },
                  { url: 'https://images.heb.com/medium.jpg', size: 'MEDIUM' },
                  { url: 'https://images.heb.com/large.jpg', size: 'LARGE' },
                ],
              },
              quantity: 1,
              checked: false,
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items[0].imageUrl).toBe('https://images.heb.com/medium.jpg');
  });

  it('should fall back to first image when no MEDIUM image', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: {
                id: 'prod-1',
                fullDisplayName: 'Product',
                productImageUrls: [
                  { url: 'https://images.heb.com/large.jpg', size: 'LARGE' },
                ],
              },
              quantity: 1,
              checked: false,
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items[0].imageUrl).toBe('https://images.heb.com/large.jpg');
  });

  it('should map item price from salePrice', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: {
                id: 'prod-1',
                fullDisplayName: 'Product',
              },
              quantity: 1,
              checked: false,
              itemPrice: { salePrice: 7.49 },
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items[0].price).toBe(7.49);
  });

  it('should handle missing itemPrice', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: {
                id: 'prod-1',
                fullDisplayName: 'Product',
              },
              quantity: 1,
              checked: false,
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items[0].price).toBeUndefined();
  });

  it('should get item count from totalCount', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: { id: 'p1', fullDisplayName: 'A' },
              quantity: 1,
              checked: false,
            },
            {
              id: 'item-2',
              product: { id: 'p2', fullDisplayName: 'B' },
              quantity: 3,
              checked: true,
            },
          ],
          thisPage: { totalCount: 42 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.itemCount).toBe(42);
  });

  it('should map item fields correctly (id, productId, name, quantity, checked)', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-abc',
              product: {
                id: 'prod-xyz',
                fullDisplayName: 'HEB Organic Bananas',
              },
              quantity: 5,
              checked: true,
              itemPrice: { salePrice: 1.99 },
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items[0].id).toBe('item-abc');
    expect(result.items[0].productId).toBe('prod-xyz');
    expect(result.items[0].name).toBe('HEB Organic Bananas');
    expect(result.items[0].quantity).toBe(5);
    expect(result.items[0].checked).toBe(true);
  });

  it('should return empty items when list has no items', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'Empty List',
        itemPage: {
          items: [],
          thisPage: { totalCount: 0 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items).toEqual([]);
    expect(result.itemCount).toBe(0);
  });

  it('should use default list ID when none provided', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Default List',
        itemPage: {
          items: [],
          thisPage: { totalCount: 0 },
        },
      },
    });

    const result = await getListItems({});

    expect(result.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(mockExecute).toHaveBeenCalled();
  });

  it('should handle missing productImageUrls', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListV2: {
        id: 'list-1',
        name: 'List',
        itemPage: {
          items: [
            {
              id: 'item-1',
              product: {
                id: 'prod-1',
                fullDisplayName: 'Product Without Image',
              },
              quantity: 1,
              checked: false,
            },
          ],
          thisPage: { totalCount: 1 },
        },
      },
    });

    const result = await getListItems({ listId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

    expect(result.items[0].imageUrl).toBeUndefined();
  });
});
