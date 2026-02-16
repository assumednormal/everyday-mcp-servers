import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.allrecipes.com';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
}

interface Recipe {
  id: string;
  name: string;
  url: string;
  description?: string;
  author?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  calories?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories?: string;
    fat?: string;
    carbs?: string;
    protein?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Fetch HTML content from a URL
 */
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow', // Follow redirects
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for URL: ${url}`);
  }

  return response.text();
}

/**
 * Extract JSON-LD structured data from HTML
 */
function extractJsonLd(html: string, type: string): any | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse($(script).html() || '');

      // Handle both single objects and arrays
      if (Array.isArray(data)) {
        const found = data.find((item) => {
          const itemType = item['@type'];
          // @type can be a string or an array
          if (Array.isArray(itemType)) {
            return itemType.includes(type);
          }
          return itemType === type;
        });
        if (found) return found;
      } else {
        const itemType = data['@type'];
        // @type can be a string or an array
        if (Array.isArray(itemType)) {
          if (itemType.includes(type)) return data;
        } else if (itemType === type) {
          return data;
        }
      }
    } catch (error) {
      // Continue to next script tag
      continue;
    }
  }

  return null;
}

/**
 * Search for recipes on AllRecipes
 */
export async function searchRecipes(query: string, limit: number = 10): Promise<SearchResult[]> {
  const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);

  const results: SearchResult[] = [];

  // Find all card links in search results
  $('a.mntl-card-list-card--extendable, a.mntl-document-card, a.card').each((_, element) => {
    if (results.length >= limit) return false;

    const $card = $(element);
    const url = $card.attr('href');

    if (!url) return;

    // Only process actual recipe URLs (not articles or category pages)
    const idMatch = url.match(/\/recipe\/(\d+)\//);
    if (!idMatch) return;

    const id = idMatch[1];

    // Extract title - it appears twice in the text
    const titleText = $card.find('.card__title-text, .card__title').text().trim();
    // The title is duplicated, so split and take first occurrence
    const title = titleText.includes(titleText.slice(0, titleText.length / 2))
      ? titleText.slice(0, titleText.length / 2)
      : titleText;

    if (!title) return;

    // Extract image
    const imageUrl = $card.find('img').attr('data-src') ||
                     $card.find('img').attr('src');

    // Extract rating if available
    const ratingElement = $card.find('[class*="rating"]');
    const ratingText = ratingElement.attr('data-rating') || ratingElement.text().trim();
    const rating = ratingText ? parseFloat(ratingText) : undefined;

    // Extract review count
    const reviewText = $card.find('[class*="review"]').text();
    const reviewMatch = reviewText.match(/(\d+)/);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : undefined;

    // Extract description
    const description = $card.find('.card__summary, .card__description').text().trim();

    results.push({
      id,
      title,
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      imageUrl,
      rating,
      reviewCount,
      description: description || undefined,
    });

    return undefined;
  });

  return results;
}

/**
 * Get detailed recipe information
 */
export async function getRecipe(recipeIdOrUrl: string): Promise<Recipe> {
  let recipeUrl: string;
  let recipeId: string;

  // Check if input is a full URL or just an ID
  if (recipeIdOrUrl.startsWith('http')) {
    recipeUrl = recipeIdOrUrl;
    const idMatch = recipeIdOrUrl.match(/\/recipe\/(\d+)\//);
    recipeId = idMatch ? idMatch[1] : recipeIdOrUrl;
  } else {
    // Just an ID - try to fetch it (AllRecipes should redirect to the full URL)
    recipeId = recipeIdOrUrl;
    recipeUrl = `${BASE_URL}/recipe/${recipeId}`;
  }

  const html = await fetchHtml(recipeUrl);

  // Try to extract JSON-LD structured data first (most reliable)
  const recipeData = extractJsonLd(html, 'Recipe');

  if (recipeData) {
    return parseRecipeFromJsonLd(recipeId, recipeData);
  }

  // Fallback to HTML parsing if JSON-LD not found
  return parseRecipeFromHtml(recipeId, html);
}

/**
 * Parse recipe from JSON-LD structured data
 */
function parseRecipeFromJsonLd(recipeId: string, data: any): Recipe {
  const ingredients: string[] = [];
  if (Array.isArray(data.recipeIngredient)) {
    ingredients.push(...data.recipeIngredient);
  }

  const instructions: string[] = [];
  if (Array.isArray(data.recipeInstructions)) {
    for (const instruction of data.recipeInstructions) {
      if (typeof instruction === 'string') {
        instructions.push(instruction);
      } else if (instruction.text) {
        instructions.push(instruction.text);
      }
    }
  }

  const nutrition: Recipe['nutrition'] = {};
  if (data.nutrition) {
    if (data.nutrition.calories) nutrition.calories = data.nutrition.calories;
    if (data.nutrition.fatContent) nutrition.fat = data.nutrition.fatContent;
    if (data.nutrition.saturatedFatContent) nutrition.saturatedFat = data.nutrition.saturatedFatContent;
    if (data.nutrition.unsaturatedFatContent) nutrition.unsaturatedFat = data.nutrition.unsaturatedFatContent;
    if (data.nutrition.carbohydrateContent) nutrition.carbs = data.nutrition.carbohydrateContent;
    if (data.nutrition.sugarContent) nutrition.sugar = data.nutrition.sugarContent;
    if (data.nutrition.fiberContent) nutrition.fiber = data.nutrition.fiberContent;
    if (data.nutrition.proteinContent) nutrition.protein = data.nutrition.proteinContent;
    if (data.nutrition.cholesterolContent) nutrition.cholesterol = data.nutrition.cholesterolContent;
    if (data.nutrition.sodiumContent) nutrition.sodium = data.nutrition.sodiumContent;
  }

  return {
    id: recipeId,
    name: data.name || '',
    url: data.url || `${BASE_URL}/recipe/${recipeId}`,
    description: data.description,
    author: data.author?.name,
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    totalTime: data.totalTime,
    servings: data.recipeYield?.toString(),
    calories: nutrition.calories,
    rating: data.aggregateRating?.ratingValue ? parseFloat(data.aggregateRating.ratingValue) : undefined,
    reviewCount: data.aggregateRating?.reviewCount ? parseInt(data.aggregateRating.reviewCount) : undefined,
    imageUrl: Array.isArray(data.image) ? data.image[0] : data.image,
    ingredients,
    instructions,
    nutrition: Object.keys(nutrition).length > 0 ? nutrition : undefined,
  };
}

/**
 * Fallback: Parse recipe from HTML (less reliable)
 */
function parseRecipeFromHtml(recipeId: string, html: string): Recipe {
  const $ = cheerio.load(html);

  const name = $('h1.article-heading, h1.headline, h1').first().text().trim();

  const ingredients: string[] = [];
  $('li[class*="ingredient"], .ingredients-item, [class*="mntl-structured-ingredients"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(text);
  });

  const instructions: string[] = [];
  $('li[class*="instruction"], .instructions-section li, ol li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10) instructions.push(text);
  });

  return {
    id: recipeId,
    name,
    url: `${BASE_URL}/recipe/${recipeId}`,
    ingredients,
    instructions,
  };
}
