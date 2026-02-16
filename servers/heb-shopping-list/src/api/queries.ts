import type { GraphQLRequest } from './types.js';

/**
 * Persisted query hashes extracted from HEB's GraphQL API
 */
const QUERY_HASHES = {
  productSearchItems: 'fb40e1079a8d12236ed91e90dfe7dccbccbf416645e19b46affb880c88b7af8f',
  typeaheadContent: '1ed956c0f10efcfc375321f33c40964bc236fff1397a4e86b7b53cb3b18ad329',
  getShoppingListsV2: '954a24fe9f3cf6f904fdb602b412e355271dbc8b919303ae84c8328e555e99fa',
  getShoppingListV2: '085fcaef4f2f05ee16ea44c1489801e7ae7e7a95311cbf6d7a3f09135f0ea557',
  addToShoppingListV2: '6b1534f6270004656ac14944f790a993822fba67fe24c9558713016cea2217c8',
  deleteShoppingListItems: 'd680a2e6c47fe0f832af2628378af8e17da7d448c46b15e799d609a56aa13e69',
  updateShoppingListItem: 'b57aa69ab197bcc3bface2afe47ff8b778eb1313c5caa479d41d40385af61818',
};

/**
 * Create a GraphQL request with persisted query
 */
function createPersistedQuery(
  operationName: keyof typeof QUERY_HASHES,
  variables: Record<string, unknown>
): GraphQLRequest {
  return {
    operationName,
    variables,
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: QUERY_HASHES[operationName],
      },
    },
  };
}

/**
 * Search for products by term
 */
export function createSearchProductsQuery(term: string, maxResults: number = 10, storeId: number): GraphQLRequest {
  return createPersistedQuery('productSearchItems', {
    includeUnitPriceDiff: false,
    userIsLoggedIn: true,
    params: {
      addressAllowAlcohol: false,
      doNotSuggestPhrase: false,
      ignoreRules: false,
      ignoreSynonyms: false,
      includeFullCategoryHierarchy: false,
      pageIndex: 0,
      pageSize: maxResults,
      query: term,
      shoppingContext: 'EXPLORE_MY_STORE',
      sortBy: 'SCORE',
      sortDirection: 'DESC',
      storeId,
      timeSlotStartTime: null,
    },
    storeId,
    shoppingContext: 'EXPLORE_MY_STORE',
    searchMode: 'SHOPPING_LIST_SEARCH',
    searchContextToken: null,
    searchPageLayout: 'MOBILE_WEB_SEARCH_PAGE_LAYOUT',
  });
}

/**
 * Get all shopping lists for the user
 */
export function createGetShoppingListsQuery(): GraphQLRequest {
  return createPersistedQuery('getShoppingListsV2', {});
}

/**
 * Get a specific shopping list with items
 */
export function createGetShoppingListQuery(listId: string): GraphQLRequest {
  return createPersistedQuery('getShoppingListV2', {
    input: {
      id: listId,
      page: {
        page: 0,
        size: 500,
        sort: 'CATEGORY',
        sortDirection: 'ASC',
      },
    },
  });
}

/**
 * Add items to a shopping list
 * Note: HEB's API doesn't support quantity in the mutation - it always adds 1 item.
 * To add multiple quantities, add the same product multiple times.
 */
export function createAddToListQuery(
  listId: string,
  productIds: string[],
  quantities?: number[]
): GraphQLRequest {
  // If quantities are provided, duplicate products to achieve the desired quantity
  const expandedProductIds: string[] = [];
  productIds.forEach((productId, index) => {
    const qty = quantities?.[index] || 1;
    for (let i = 0; i < qty; i++) {
      expandedProductIds.push(productId);
    }
  });

  const listItems = expandedProductIds.map((productId) => ({
    item: {
      productId,
    },
  }));

  return createPersistedQuery('addToShoppingListV2', {
    input: {
      listId,
      listItems,
      page: {
        sort: 'CATEGORY',
        sortDirection: 'ASC',
      },
    },
  });
}

/**
 * Remove items from a shopping list
 */
export function createRemoveFromListQuery(
  listId: string,
  itemIds: string[]
): GraphQLRequest {
  return createPersistedQuery('deleteShoppingListItems', {
    input: {
      listId,
      itemIds,
      page: {
        sort: 'CATEGORY',
        sortDirection: 'ASC',
      },
    },
  });
}

/**
 * Update the quantity of an item in a shopping list
 */
export function createUpdateItemQuantityQuery(
  listId: string,
  itemId: string,
  quantity: number
): GraphQLRequest {
  return createPersistedQuery('updateShoppingListItem', {
    input: {
      itemId,
      listId,
      quantityOrWeight: {
        quantity,
      },
      page: {
        sort: 'CATEGORY',
        sortDirection: 'ASC',
      },
    },
  });
}
