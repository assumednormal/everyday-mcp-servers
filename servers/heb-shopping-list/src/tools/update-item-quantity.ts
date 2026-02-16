import { z } from 'zod';
import { getClient } from '../api/client.js';
import { getEnvironment } from '../config/environment.js';
import { createUpdateItemQuantityQuery } from '../api/queries.js';
import { validateListId } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Input schema for update item quantity tool
 */
export const UpdateItemQuantityInputSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  listId: z.string().uuid().optional(),
});

export type UpdateItemQuantityInput = z.infer<typeof UpdateItemQuantityInputSchema>;

/**
 * Response from updating item quantity
 */
export interface UpdateItemQuantityResult {
  success: boolean;
  itemId: string;
  quantity: number;
  listId: string;
  listName: string;
  message: string;
}

/**
 * GraphQL response structure for updateShoppingListItemV2
 * Note: Response field has V2 suffix despite operation name being updateShoppingListItem
 */
interface UpdateShoppingListItemResponse {
  updateShoppingListItemV2: {
    id: string;
    name: string;
    totalItemCount: number;
  };
}

/**
 * Update the quantity of an item in a shopping list
 */
export async function updateItemQuantity(input: UpdateItemQuantityInput): Promise<UpdateItemQuantityResult> {
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

  // Update the item quantity
  const client = getClient();
  const query = createUpdateItemQuantityQuery(listId, input.itemId, input.quantity);
  const response = await client.execute<UpdateShoppingListItemResponse>(query);

  const list = response.updateShoppingListItemV2;

  if (!list) {
    throw new ValidationError('Failed to update item quantity');
  }

  return {
    success: true,
    itemId: input.itemId,
    quantity: input.quantity,
    listId: list.id,
    listName: list.name,
    message: `Successfully updated item quantity to ${input.quantity} in "${list.name}"`,
  };
}
