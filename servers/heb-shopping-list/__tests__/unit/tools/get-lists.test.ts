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

import { getShoppingLists } from '../../../src/tools/get-lists.js';

describe('getShoppingLists', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it('should map totalItemCount to itemCount', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [
          {
            id: 'list-1',
            name: 'My Groceries',
            totalItemCount: 15,
            created: '2024-01-01T00:00:00Z',
            updated: '2024-01-15T00:00:00Z',
          },
        ],
      },
    });

    const result = await getShoppingLists();

    expect(result).toHaveLength(1);
    expect(result[0].itemCount).toBe(15);
    expect(result[0]).not.toHaveProperty('totalItemCount');
  });

  it('should map created to createdAt', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [
          {
            id: 'list-1',
            name: 'My List',
            totalItemCount: 5,
            created: '2024-06-15T12:30:00Z',
            updated: '2024-06-20T08:00:00Z',
          },
        ],
      },
    });

    const result = await getShoppingLists();

    expect(result[0].createdAt).toBe('2024-06-15T12:30:00Z');
    expect(result[0]).not.toHaveProperty('created');
  });

  it('should map updated to updatedAt', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [
          {
            id: 'list-1',
            name: 'My List',
            totalItemCount: 5,
            created: '2024-06-15T12:30:00Z',
            updated: '2024-06-20T08:00:00Z',
          },
        ],
      },
    });

    const result = await getShoppingLists();

    expect(result[0].updatedAt).toBe('2024-06-20T08:00:00Z');
    expect(result[0]).not.toHaveProperty('updated');
  });

  it('should map id and name correctly', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [
          {
            id: 'abc-123',
            name: 'Weekly Groceries',
            totalItemCount: 10,
          },
        ],
      },
    });

    const result = await getShoppingLists();

    expect(result[0].id).toBe('abc-123');
    expect(result[0].name).toBe('Weekly Groceries');
  });

  it('should handle multiple lists', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [
          {
            id: 'list-1',
            name: 'Groceries',
            totalItemCount: 10,
          },
          {
            id: 'list-2',
            name: 'Party Supplies',
            totalItemCount: 25,
          },
          {
            id: 'list-3',
            name: 'Snacks',
            totalItemCount: 3,
          },
        ],
      },
    });

    const result = await getShoppingLists();

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Groceries');
    expect(result[1].name).toBe('Party Supplies');
    expect(result[2].name).toBe('Snacks');
  });

  it('should return empty array when no lists exist', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [],
      },
    });

    const result = await getShoppingLists();
    expect(result).toEqual([]);
  });

  it('should handle undefined lists field gracefully', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {},
    });

    const result = await getShoppingLists();
    expect(result).toEqual([]);
  });

  it('should handle optional created and updated fields', async () => {
    mockExecute.mockResolvedValue({
      getShoppingListsV2: {
        lists: [
          {
            id: 'list-1',
            name: 'New List',
            totalItemCount: 0,
          },
        ],
      },
    });

    const result = await getShoppingLists();

    expect(result[0].createdAt).toBeUndefined();
    expect(result[0].updatedAt).toBeUndefined();
  });
});
