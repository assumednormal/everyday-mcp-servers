import { z } from 'zod';
import { getClient } from '../api/client.js';
import { getEnvironment } from '../config/environment.js';
import { createAddToListQuery } from '../api/queries.js';
import { searchProducts } from './search-products.js';
import {
  validateListId,
  validateProductId,
  validatePositive,
} from '../utils/validation.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Input schema for add to list tool
 */
export const AddToListInputSchema = z.object({
  productId: z.string().optional(),
  searchTerm: z.string().optional(),
  quantity: z.number().int().positive().optional().default(1),
  listId: z.string().uuid().optional(),
}).refine(
  (data) => data.productId || data.searchTerm,
  {
    message: 'Either productId or searchTerm must be provided',
  }
);

export type AddToListInput = z.infer<typeof AddToListInputSchema>;

/**
 * Response from adding items to list
 */
export interface AddToListResult {
  success: boolean;
  productId: string;
  productName: string;
  quantity: number;
  listId: string;
  listName: string;
  message: string;
}

/**
 * GraphQL response structure for addShoppingListItemsV2
 * Note: The actual response field is addShoppingListItemsV2, not addToShoppingListV2
 */
interface AddToShoppingListResponse {
  addShoppingListItemsV2: {
    id: string;
    name: string;
    totalItemCount: number;
  };
}

/**
 * Add item(s) to a shopping list
 */
export async function addToList(input: AddToListInput): Promise<AddToListResult> {
  // Validate quantity
  const quantity = validatePositive(input.quantity, 'Quantity');

  // Determine product ID
  let productId: string;
  let productName: string;

  if (input.productId) {
    // Use provided product ID
    productId = validateProductId(input.productId);
    productName = `Product ${productId}`;
  } else if (input.searchTerm) {
    // Search for product first
    const searchResults = await searchProducts({
      searchTerm: input.searchTerm,
      maxResults: 1,
    });

    if (searchResults.length === 0) {
      throw new NotFoundError('Product', input.searchTerm);
    }

    const topResult = searchResults[0];
    productId = topResult.productId;
    productName = topResult.name;
  } else {
    throw new ValidationError('Either productId or searchTerm must be provided');
  }

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

  // Add to list
  const client = getClient();
  const query = createAddToListQuery(listId, [productId], [quantity]);
  const response = await client.execute<AddToShoppingListResponse>(query);

  const list = response.addShoppingListItemsV2;

  if (!list) {
    throw new ValidationError('Failed to add item to shopping list');
  }

  return {
    success: true,
    productId,
    productName,
    quantity,
    listId: list.id,
    listName: list.name,
    message: `Successfully added "${productName}" (x${quantity}) to "${list.name}"`,
  };
}
