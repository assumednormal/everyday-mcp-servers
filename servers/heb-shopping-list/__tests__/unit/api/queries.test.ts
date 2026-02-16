import { describe, it, expect } from 'vitest';
import {
  createSearchProductsQuery,
  createGetShoppingListsQuery,
  createGetShoppingListQuery,
  createAddToListQuery,
  createRemoveFromListQuery,
  createUpdateItemQuantityQuery,
} from '../../../src/api/queries.js';

describe('createSearchProductsQuery', () => {
  it('should build correct query structure with expected variables', () => {
    const query = createSearchProductsQuery('milk', 20, 456);
    expect(query.operationName).toBe('productSearchItems');
    expect(query.extensions.persistedQuery.version).toBe(1);
    const params = query.variables.params as Record<string, unknown>;
    expect(params.query).toBe('milk');
    expect(params.pageSize).toBe(20);
    expect(params.storeId).toBe(456);
    expect(query.variables.storeId).toBe(456);
    expect(params.sortBy).toBe('SCORE');
    expect(params.sortDirection).toBe('DESC');
    expect(query.variables.shoppingContext).toBe('EXPLORE_MY_STORE');
    expect(query.variables.searchMode).toBe('SHOPPING_LIST_SEARCH');
  });
});

describe('createGetShoppingListsQuery', () => {
  it('should build correct query structure', () => {
    const query = createGetShoppingListsQuery();
    expect(query.operationName).toBe('getShoppingListsV2');
    expect(query.extensions.persistedQuery.version).toBe(1);
    expect(query.variables).toEqual({});
  });
});

describe('createGetShoppingListQuery', () => {
  it('should build correct query structure with listId and pagination', () => {
    const query = createGetShoppingListQuery('my-list-123');
    expect(query.operationName).toBe('getShoppingListV2');
    expect(query.extensions.persistedQuery.version).toBe(1);
    const input = query.variables.input as Record<string, unknown>;
    expect(input.id).toBe('my-list-123');
    const page = input.page as Record<string, unknown>;
    expect(page.page).toBe(0);
    expect(page.size).toBe(500);
    expect(page.sort).toBe('CATEGORY');
    expect(page.sortDirection).toBe('ASC');
  });
});

describe('createAddToListQuery', () => {
  it('should build correct query structure with listId and products', () => {
    const query = createAddToListQuery('list-1', ['prod-1', 'prod-2']);
    expect(query.operationName).toBe('addToShoppingListV2');
    expect(query.extensions.persistedQuery.version).toBe(1);
    const input = query.variables.input as Record<string, unknown>;
    expect(input.listId).toBe('list-1');
    const listItems = input.listItems as Array<{ item: { productId: string } }>;
    expect(listItems).toHaveLength(2);
    expect(listItems[0].item.productId).toBe('prod-1');
    expect(listItems[1].item.productId).toBe('prod-2');
    const page = input.page as Record<string, unknown>;
    expect(page.sort).toBe('CATEGORY');
    expect(page.sortDirection).toBe('ASC');
  });

  it('should expand product entries based on quantity', () => {
    const query = createAddToListQuery('list-1', ['prod-1'], [3]);
    const input = query.variables.input as Record<string, unknown>;
    const listItems = input.listItems as Array<{ item: { productId: string } }>;
    expect(listItems).toHaveLength(3);
    expect(listItems[0].item.productId).toBe('prod-1');
    expect(listItems[1].item.productId).toBe('prod-1');
    expect(listItems[2].item.productId).toBe('prod-1');
  });

  it('should expand multiple products with different quantities', () => {
    const query = createAddToListQuery('list-1', ['prod-1', 'prod-2'], [2, 3]);
    const input = query.variables.input as Record<string, unknown>;
    const listItems = input.listItems as Array<{ item: { productId: string } }>;
    expect(listItems).toHaveLength(5);
    // First product appears twice
    expect(listItems[0].item.productId).toBe('prod-1');
    expect(listItems[1].item.productId).toBe('prod-1');
    // Second product appears three times
    expect(listItems[2].item.productId).toBe('prod-2');
    expect(listItems[3].item.productId).toBe('prod-2');
    expect(listItems[4].item.productId).toBe('prod-2');
  });

  it('should default to quantity 1 when quantities array is shorter', () => {
    const query = createAddToListQuery('list-1', ['prod-1', 'prod-2'], [2]);
    const input = query.variables.input as Record<string, unknown>;
    const listItems = input.listItems as Array<{ item: { productId: string } }>;
    // prod-1 x 2 + prod-2 x 1 = 3
    expect(listItems).toHaveLength(3);
  });
});

describe('createRemoveFromListQuery', () => {
  it('should build correct query structure with listId and itemIds', () => {
    const query = createRemoveFromListQuery('list-1', ['item-1', 'item-2', 'item-3']);
    expect(query.operationName).toBe('deleteShoppingListItems');
    expect(query.extensions.persistedQuery.version).toBe(1);
    const input = query.variables.input as Record<string, unknown>;
    expect(input.listId).toBe('list-1');
    expect(input.itemIds).toEqual(['item-1', 'item-2', 'item-3']);
    const page = input.page as Record<string, unknown>;
    expect(page.sort).toBe('CATEGORY');
    expect(page.sortDirection).toBe('ASC');
  });
});

describe('createUpdateItemQuantityQuery', () => {
  it('should build correct query structure with listId, itemId, and quantity', () => {
    const query = createUpdateItemQuantityQuery('list-1', 'item-1', 3);
    expect(query.operationName).toBe('updateShoppingListItem');
    expect(query.extensions.persistedQuery.version).toBe(1);
    const input = query.variables.input as Record<string, unknown>;
    expect(input.listId).toBe('list-1');
    expect(input.itemId).toBe('item-1');
    const quantityOrWeight = input.quantityOrWeight as Record<string, unknown>;
    expect(quantityOrWeight.quantity).toBe(3);
    const page = input.page as Record<string, unknown>;
    expect(page.sort).toBe('CATEGORY');
    expect(page.sortDirection).toBe('ASC');
  });
});
