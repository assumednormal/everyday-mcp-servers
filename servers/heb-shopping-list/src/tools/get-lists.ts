import { getClient } from '../api/client.js';
import { createGetShoppingListsQuery } from '../api/queries.js';
import type { ShoppingList } from '../api/types.js';

/**
 * GraphQL response structure for getShoppingListsV2
 */
interface GetShoppingListsResponse {
  getShoppingListsV2: {
    lists?: Array<{
      id: string;
      name: string;
      totalItemCount: number;
      created?: string;
      updated?: string;
    }>;
  };
}

/**
 * Get all shopping lists for the user
 */
export async function getShoppingLists(): Promise<ShoppingList[]> {
  const client = getClient();
  const query = createGetShoppingListsQuery();
  const response = await client.execute<GetShoppingListsResponse>(query);

  const lists = response.getShoppingListsV2?.lists || [];

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    itemCount: list.totalItemCount,
    createdAt: list.created,
    updatedAt: list.updated,
  }));
}
