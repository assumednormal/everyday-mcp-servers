/**
 * Product information from HEB API
 */
export interface Product {
  productId: string;
  name: string;
  price?: number;
  imageUrl?: string;
  brand?: string;
  size?: string;
  availability?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
}

/**
 * Shopping list summary
 */
export interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Item in a shopping list
 */
export interface ListItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  checked: boolean;
  price?: number;
  imageUrl?: string;
}

/**
 * Detailed shopping list with items
 */
export interface ShoppingListDetail extends ShoppingList {
  items: ListItem[];
}

/**
 * GraphQL persisted query structure
 */
export interface PersistedQuery {
  version: number;
  sha256Hash: string;
}

/**
 * GraphQL request structure
 */
export interface GraphQLRequest {
  operationName: string;
  variables: Record<string, unknown>;
  extensions: {
    persistedQuery: PersistedQuery;
  };
}

/**
 * GraphQL response structure
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}
