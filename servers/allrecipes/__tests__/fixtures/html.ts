/**
 * HTML fixture helpers for AllRecipes MCP server tests.
 * These produce minimal but realistic HTML fragments that match
 * the selectors used in the production code.
 */

// ─── Search result card helpers ──────────────────────────────────────────────

export interface CardOptions {
  href: string;
  title: string;
  dataSrc?: string;
  imgSrc?: string;
  rating?: string;
  reviewCount?: number;
  description?: string;
}

/**
 * Build a single search-result card matching the `.mntl-card-list-card--extendable` selector.
 * The title text is intentionally duplicated inside `.card__title-text` to mirror the
 * real AllRecipes markup the dedup logic handles.
 */
export function buildSearchCard(opts: CardOptions): string {
  const imgAttr = opts.dataSrc
    ? `data-src="${opts.dataSrc}"`
    : opts.imgSrc
      ? `src="${opts.imgSrc}"`
      : '';

  const ratingHtml = opts.rating
    ? `<div class="rating" data-rating="${opts.rating}"></div>`
    : '';

  const reviewHtml =
    opts.reviewCount !== undefined
      ? `<div class="review">${opts.reviewCount} Reviews</div>`
      : '';

  const descriptionHtml = opts.description
    ? `<div class="card__summary">${opts.description}</div>`
    : '';

  return `
    <a class="mntl-card-list-card--extendable" href="${opts.href}">
      <span class="card__title-text">${opts.title}${opts.title}</span>
      ${imgAttr ? `<img ${imgAttr} />` : ''}
      ${ratingHtml}
      ${reviewHtml}
      ${descriptionHtml}
    </a>`;
}

/**
 * Wrap an array of card HTML strings in a minimal page body.
 */
export function buildSearchResultsPage(cards: string[]): string {
  return `<html><body><div>${cards.join('\n')}</div></body></html>`;
}

// ─── Recipe page helpers ─────────────────────────────────────────────────────

export interface JsonLdRecipeOptions {
  type?: string | string[];
  name?: string;
  description?: string;
  authorName?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string;
  ingredients?: string[];
  instructions?: (string | { text: string })[];
  nutrition?: Record<string, string>;
  aggregateRating?: { ratingValue: string; reviewCount: string };
  image?: string | string[];
  url?: string;
}

/**
 * Build a full HTML page containing a `<script type="application/ld+json">` block.
 * Accepts either a single JSON-LD object description or an array of them.
 */
export function buildJsonLdPage(recipes: JsonLdRecipeOptions | JsonLdRecipeOptions[]): string {
  const items = Array.isArray(recipes) ? recipes : [recipes];

  const jsonLdObjects = items.map((opts) => {
    const obj: Record<string, unknown> = {
      '@type': opts.type ?? 'Recipe',
      'name': opts.name ?? '',
    };

    if (opts.description !== undefined) obj['description'] = opts.description;
    if (opts.authorName !== undefined) obj['author'] = { name: opts.authorName };
    if (opts.prepTime !== undefined) obj['prepTime'] = opts.prepTime;
    if (opts.cookTime !== undefined) obj['cookTime'] = opts.cookTime;
    if (opts.totalTime !== undefined) obj['totalTime'] = opts.totalTime;
    if (opts.recipeYield !== undefined) obj['recipeYield'] = opts.recipeYield;
    if (opts.ingredients !== undefined) obj['recipeIngredient'] = opts.ingredients;
    if (opts.instructions !== undefined) obj['recipeInstructions'] = opts.instructions;
    if (opts.nutrition !== undefined) obj['nutrition'] = opts.nutrition;
    if (opts.aggregateRating !== undefined) obj['aggregateRating'] = opts.aggregateRating;
    if (opts.image !== undefined) obj['image'] = opts.image;
    if (opts.url !== undefined) obj['url'] = opts.url;

    return obj;
  });

  const payload = jsonLdObjects.length === 1 ? jsonLdObjects[0] : jsonLdObjects;

  return `<html><head>
<script type="application/ld+json">${JSON.stringify(payload)}</script>
</head><body></body></html>`;
}

/**
 * Build a recipe page that has NO JSON-LD but uses HTML elements for fallback parsing.
 */
export function buildHtmlFallbackRecipePage(opts: {
  name: string;
  ingredients: string[];
  instructions: string[];
}): string {
  const ingredientItems = opts.ingredients
    .map((i) => `<li class="mntl-structured-ingredients__list-item">${i}</li>`)
    .join('\n');

  const instructionItems = opts.instructions
    .map((i) => `<li class="instruction-step">${i}</li>`)
    .join('\n');

  return `<html><body>
<h1 class="article-heading">${opts.name}</h1>
<ul>
  ${ingredientItems}
</ul>
<ol>
  ${instructionItems}
</ol>
</body></html>`;
}

/**
 * Build a page with invalid JSON inside a ld+json script tag, plus HTML fallback content.
 */
export function buildInvalidJsonLdWithFallback(opts: {
  name: string;
  ingredients: string[];
  instructions: string[];
}): string {
  const ingredientItems = opts.ingredients
    .map((i) => `<li class="mntl-structured-ingredients__list-item">${i}</li>`)
    .join('\n');

  const instructionItems = opts.instructions
    .map((i) => `<li class="instruction-step">${i}</li>`)
    .join('\n');

  return `<html><head>
<script type="application/ld+json">{ INVALID JSON !!!</script>
</head><body>
<h1 class="article-heading">${opts.name}</h1>
<ul>
  ${ingredientItems}
</ul>
<ol>
  ${instructionItems}
</ol>
</body></html>`;
}

/**
 * Build an empty search results page (no card elements at all).
 */
export function buildEmptySearchPage(): string {
  return `<html><body><div class="search-results"><p>No results found</p></div></body></html>`;
}

/**
 * Build a page containing a JSON-LD array where the Recipe entry is mixed in with
 * other types (e.g. a BreadcrumbList).
 */
export function buildJsonLdArrayPage(opts: JsonLdRecipeOptions): string {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home' },
    ],
  };

  const recipe: Record<string, unknown> = {
    '@type': opts.type ?? 'Recipe',
    'name': opts.name ?? '',
  };

  if (opts.description !== undefined) recipe['description'] = opts.description;
  if (opts.authorName !== undefined) recipe['author'] = { name: opts.authorName };
  if (opts.prepTime !== undefined) recipe['prepTime'] = opts.prepTime;
  if (opts.cookTime !== undefined) recipe['cookTime'] = opts.cookTime;
  if (opts.totalTime !== undefined) recipe['totalTime'] = opts.totalTime;
  if (opts.recipeYield !== undefined) recipe['recipeYield'] = opts.recipeYield;
  if (opts.ingredients !== undefined) recipe['recipeIngredient'] = opts.ingredients;
  if (opts.instructions !== undefined) recipe['recipeInstructions'] = opts.instructions;
  if (opts.nutrition !== undefined) recipe['nutrition'] = opts.nutrition;
  if (opts.aggregateRating !== undefined) recipe['aggregateRating'] = opts.aggregateRating;
  if (opts.image !== undefined) recipe['image'] = opts.image;
  if (opts.url !== undefined) recipe['url'] = opts.url;

  const payload = [breadcrumb, recipe];

  return `<html><head>
<script type="application/ld+json">${JSON.stringify(payload)}</script>
</head><body></body></html>`;
}
