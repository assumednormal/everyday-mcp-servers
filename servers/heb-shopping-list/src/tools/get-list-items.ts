import { z } from 'zod';
import { getClient } from '../api/client.js';
import { getEnvironment } from '../config/environment.js';
import { createGetShoppingListQuery } from '../api/queries.js';
import type { ShoppingListDetail, ListItem } from '../api/types.js';
import { validateListId } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Input schema for get list items tool
 */
export const GetListItemsInputSchema = z.object({
  listId: z.string().uuid().optional(),
});

export type GetListItemsInput = z.infer<typeof GetListItemsInputSchema>;

/**
 * GraphQL response structure for getShoppingListV2
 */
interface GetShoppingListResponse {
  getShoppingListV2: {
    id: string;
    name: string;
    created?: string;
    updated?: string;
    itemPage: {
      items: Array<{
        id: string;
        product: {
          id: string;
          fullDisplayName: string;
          productImageUrls?: Array<{
            url: string;
            size: string;
          }>;
        };
        quantity: number;
        checked: boolean;
        itemPrice?: {
          salePrice: number;
        };
      }>;
      thisPage: {
        totalCount: number;
      };
    };
  };
}

/**
 * Get items from a shopping list
 */
export async function getListItems(input: GetListItemsInput): Promise<ShoppingListDetail> {
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

  // Execute GraphQL query
  const client = getClient();
  const query = createGetShoppingListQuery(listId);
  const response = await client.execute<GetShoppingListResponse>(query);

  const list = response.getShoppingListV2;

  if (!list) {
    throw new ValidationError(`Shopping list with ID "${listId}" not found`);
  }

  // Transform items
  const items: ListItem[] = (list.itemPage?.items || []).map((item) => {
    // Get the medium or first image
    const mediumImage = item.product.productImageUrls?.find((img) => img.size === 'MEDIUM');
    const imageUrl = mediumImage?.url || item.product.productImageUrls?.[0]?.url;

    return {
      id: item.id,
      productId: item.product.id,
      name: item.product.fullDisplayName,
      quantity: item.quantity,
      checked: item.checked,
      price: item.itemPrice?.salePrice,
      imageUrl,
    };
  });

  return {
    id: list.id,
    name: list.name,
    itemCount: list.itemPage?.thisPage?.totalCount || 0,
    createdAt: list.created,
    updatedAt: list.updated,
    items,
  };
}
