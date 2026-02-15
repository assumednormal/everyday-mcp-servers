import { z } from 'zod';
import { getClient } from '../api/client.js';
import { getEnvironment } from '../config/environment.js';
import { createRemoveFromListQuery } from '../api/queries.js';
import { getListItems } from './get-list-items.js';
import { validateListId } from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Input schema for remove from list tool
 */
export const RemoveFromListInputSchema = z.object({
  itemIds: z.array(z.string().uuid()).optional(),
  productName: z.string().optional(),
  listId: z.string().uuid().optional(),
}).refine(
  (data) => data.itemIds || data.productName,
  {
    message: 'Either itemIds or productName must be provided',
  }
);

export type RemoveFromListInput = z.infer<typeof RemoveFromListInputSchema>;

/**
 * Response from removing items from list
 */
export interface RemoveFromListResult {
  success: boolean;
  removedCount: number;
  listId: string;
  listName: string;
  message: string;
}

/**
 * GraphQL response structure for deleteShoppingListItemsV2
 */
interface DeleteShoppingListItemsResponse {
  deleteShoppingListItemsV2: {
    id: string;
    name: string;
    totalItemCount: number;
  };
}

/**
 * Remove item(s) from a shopping list
 */
export async function removeFromList(input: RemoveFromListInput): Promise<RemoveFromListResult> {
  // Determine which list ID to use
  let listId: string;

  if (input.listId) {
    listId = validateListId(input.listId);
  } else {
    const env = getEnvironment();
    if (!env.HEB_DEFAULT_LIST_ID) {
      throw new ValidationError('No list ID provided and HEB_DEFAULT_LIST_ID is not set');
    }
    listId = validateListId(env.HEB_DEFAULT_LIST_ID);
  }

  // Determine which item IDs to remove
  let itemIds: string[];

  if (input.itemIds) {
    // Use provided item IDs
    itemIds = input.itemIds;
  } else if (input.productName) {
    // Search for items by product name in the list
    const listDetail = await getListItems({ listId });

    if (!listDetail.items || listDetail.items.length === 0) {
      throw new NotFoundError('Items', 'in shopping list');
    }

    // Find items matching the product name (case-insensitive partial match)
    const searchTerm = input.productName.toLowerCase();
    const matchingItems = listDetail.items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );

    if (matchingItems.length === 0) {
      throw new NotFoundError('Item', input.productName);
    }

    itemIds = matchingItems.map((item) => item.id);
  } else {
    throw new ValidationError('Either itemIds or productName must be provided');
  }

  // Remove from list
  const client = getClient();
  const query = createRemoveFromListQuery(listId, itemIds);
  const response = await client.execute<DeleteShoppingListItemsResponse>(query);

  const list = response.deleteShoppingListItemsV2;

  if (!list) {
    throw new ValidationError('Failed to remove items from shopping list');
  }

  return {
    success: true,
    removedCount: itemIds.length,
    listId: list.id,
    listName: list.name,
    message: `Successfully removed ${itemIds.length} item(s) from "${list.name}"`,
  };
}
