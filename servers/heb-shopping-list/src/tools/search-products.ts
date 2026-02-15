import { z } from 'zod';
import { getClient } from '../api/client.js';
import { createSearchProductsQuery } from '../api/queries.js';
import type { Product } from '../api/types.js';
import { validateNonEmpty, validatePositive } from '../utils/validation.js';
import { getEnvironment } from '../config/environment.js';

/**
 * Input schema for search products tool
 */
export const SearchProductsInputSchema = z.object({
  searchTerm: z.string().min(1, 'Search term cannot be empty'),
  maxResults: z.number().int().positive().optional().default(10),
});

export type SearchProductsInput = z.infer<typeof SearchProductsInputSchema>;

/**
 * GraphQL response structure for productSearchItems
 */
interface ProductSearchResponse {
  productSearchItems: {
    searchGrid: {
      items: Array<{
        id: string;
        fullDisplayName: string;
        SKUs: Array<{
          contextPrices: Array<{
            context: string;
            salePrice: {
              amount: number;
            };
          }>;
          customerFriendlySize?: string;
        }>;
        productImageUrls?: Array<{
          url: string;
          size: string;
        }>;
        brand?: {
          name: string;
        };
        inventory: {
          inventoryState: string;
        };
      }>;
    };
  };
}

/**
 * Search for HEB products
 */
export async function searchProducts(input: SearchProductsInput): Promise<Product[]> {
  // Validate inputs
  const searchTerm = validateNonEmpty(input.searchTerm, 'Search term');
  const maxResults = input.maxResults ? validatePositive(input.maxResults, 'Max results') : 10;

  // Get store ID from environment
  const env = getEnvironment();
  const storeId = parseInt(env.HEB_STORE_ID, 10);

  // Execute GraphQL query
  const client = getClient();
  const query = createSearchProductsQuery(searchTerm, maxResults, storeId);
  const response = await client.execute<ProductSearchResponse>(query);

  // Transform response to Product array
  const products = response.productSearchItems?.searchGrid?.items || [];

  return products.map((p) => {
    // Get the first SKU's price (prefer ONLINE context)
    const sku = p.SKUs?.[0];
    const onlinePrice = sku?.contextPrices?.find((cp) => cp.context === 'ONLINE');
    const price = onlinePrice?.salePrice?.amount;

    // Get the medium or first image
    const mediumImage = p.productImageUrls?.find((img) => img.size === 'MEDIUM');
    const imageUrl = mediumImage?.url || p.productImageUrls?.[0]?.url;

    return {
      productId: p.id,
      name: p.fullDisplayName,
      price,
      imageUrl,
      brand: p.brand?.name,
      size: sku?.customerFriendlySize,
      availability: p.inventory.inventoryState === 'IN_STOCK' ? 'IN_STOCK' :
                    p.inventory.inventoryState === 'LOW_STOCK' ? 'LOW_STOCK' : 'OUT_OF_STOCK',
    };
  });
}
