# AllRecipes MCP Server

An MCP server for searching and retrieving recipes from AllRecipes.com.

## Features

- **Search Recipes** - Search AllRecipes.com by keyword and get matching results
- **Get Recipe Details** - Retrieve full recipe information including ingredients, instructions, nutrition, ratings, and more

## Installation

```bash
# Install dependencies
npm install

# Build the server
npm run build
```

## Configuration

No configuration required! This server scrapes public recipe data from AllRecipes.com.

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "allrecipes": {
      "command": "node",
      "args": ["/path/to/servers/allrecipes/dist/index.js"]
    }
  }
}
```

### With Claude Code

```json
{
  "mcpServers": {
    "allrecipes": {
      "command": "node",
      "args": ["/path/to/servers/allrecipes/dist/index.js"]
    }
  }
}
```

## Available Tools

### `search_recipes`

Search for recipes by keyword.

**Parameters:**
- `query` (string, required) - Search query (e.g., "chicken pasta", "healthy salad")
- `limit` (number, optional) - Maximum results to return (default: 10, max: 50)

**Returns:**
```json
[
  {
    "id": "78144",
    "title": "Garlic Chicken Fried Brown Rice",
    "url": "https://www.allrecipes.com/recipe/78144/garlic-chicken-fried-brown-rice/",
    "imageUrl": "https://www.allrecipes.com/thmb/...",
    "rating": 4.5,
    "reviewCount": 1234,
    "description": "A delicious fried rice recipe..."
  }
]
```

### `get_recipe`

Get detailed information about a specific recipe.

**Parameters:**
- `recipeUrl` (string, required) - Full recipe URL from search results (e.g., "https://www.allrecipes.com/recipe/240747/mommas-healthy-meatloaf/")

**Returns:**
```json
{
  "id": "78144",
  "name": "Garlic Chicken Fried Brown Rice",
  "url": "https://www.allrecipes.com/recipe/78144/garlic-chicken-fried-brown-rice/",
  "description": "This is a great way to use leftover rice...",
  "author": "LYNNINMA",
  "prepTime": "PT10M",
  "cookTime": "PT20M",
  "totalTime": "PT30M",
  "servings": "4",
  "rating": 4.5,
  "reviewCount": 1234,
  "imageUrl": "https://www.allrecipes.com/thmb/...",
  "ingredients": [
    "2 tablespoons vegetable oil",
    "1 pound skinless, boneless chicken breast, cut into strips",
    "3 cloves garlic, minced",
    "..."
  ],
  "instructions": [
    "Heat oil in a large skillet over medium-high heat...",
    "Add chicken and garlic; cook and stir until chicken is cooked through...",
    "..."
  ],
  "nutrition": {
    "calories": "345 calories",
    "fat": "12g",
    "carbs": "38g",
    "protein": "23g"
  }
}
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Test with MCP Inspector
npm run inspector
```

## Testing

_To be documented_

## License

MIT
