# HEB Shopping List MCP Server

An MCP (Model Context Protocol) server that enables Claude to interact with your HEB shopping list. Add items, search for products, and manage your shopping lists directly through Claude.

## Features

- **Search Products**: Find HEB products by name or keyword
- **Add to List**: Add items to your shopping list (by product ID or search term)
- **View Lists**: See all your shopping lists
- **View List Items**: Get detailed information about items in a list

## Installation

### Prerequisites

- Node.js 18 or higher
- An active HEB account with a shopping list
- Claude Desktop (for integration)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the server**:
   ```bash
   npm run build
   ```

3. **Extract HEB cookies**:
   - Log in to [heb.com](https://www.heb.com) in your browser
   - Open DevTools (F12 or Right-click → Inspect)
   - Go to Application tab → Cookies → https://www.heb.com
   - Copy the values for these cookies:
     - `sat` (JWT authentication token)
     - `JSESSIONID` (session identifier)
     - `reese84` (security token)
     - `CURR_SESSION_STORE` (your selected store number, e.g., "804")

4. **Find your shopping list ID** (optional but recommended):
   - Go to your shopping list on HEB.com
   - The URL will be: `https://www.heb.com/shopping-list/[LIST-ID]`
   - Copy the LIST-ID (UUID format)

## Configuration

### Environment Variables

Configure these environment variables in your Claude Desktop config:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `HEB_SAT_COOKIE` | Yes | JWT authentication token from `sat` cookie | `eyJhbGciOiJSUzI1...` |
| `HEB_JSESSIONID` | Yes | Session ID from `JSESSIONID` cookie | `QMbRfPwCg0JFYOqh1lgO9nOIWw8ad8VG2UBNnUtR` |
| `HEB_REESE84` | Yes | Security token from `reese84` cookie | `3:rfkO80rPVvuZmIY56Dwi8Q==:Av9N...` |
| `HEB_STORE_ID` | Yes | Your selected HEB store number | `804` |
| `HEB_DEFAULT_LIST_ID` | No | Default shopping list ID (UUID) | `6ab59696-6480-4ee4-8833-42bb3b1e80f5` |

### Claude Desktop Configuration

Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "heb-shopping-list": {
      "command": "node",
      "args": [
        "/path/to/everyday-mcp-servers/servers/heb-shopping-list/dist/index.js"
      ],
      "env": {
        "HEB_SAT_COOKIE": "your-sat-token-here",
        "HEB_JSESSIONID": "your-jsessionid-here",
        "HEB_REESE84": "your-reese84-token-here",
        "HEB_STORE_ID": "804",
        "HEB_DEFAULT_LIST_ID": "your-list-id-here"
      }
    }
  }
}
```

**Important**: Replace `/path/to/` with the actual absolute path to this repository.

### Cookie Expiration

The `sat` cookie typically expires after 30 minutes of inactivity. When you see authentication errors in Claude, you'll need to:

1. Log in to HEB.com again
2. Extract fresh cookies
3. Update your Claude Desktop config
4. Restart Claude Desktop

## Usage

Once configured, you can use these tools in Claude:

### Search for Products

```
Search for eggs at HEB
```

Claude will use the `heb_search_products` tool to find matching products.

### Add Items to Shopping List

```
Add eggs to my shopping list
```

```
Add bread and milk to my HEB list
```

Claude will use the `heb_add_to_list` tool. If you provide a product name, it will search for the product and add the top result.

### View Shopping Lists

```
Show me my HEB shopping lists
```

Claude will use the `heb_get_shopping_lists` tool to display all your lists.

### View List Items

```
What's in my HEB shopping list?
```

Claude will use the `heb_get_list_items` tool to show all items in your default list (or you can specify a list ID).

## Development

### Run in Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

## Tools Reference

### `heb_search_products`

Search for products at HEB.

**Parameters**:
- `searchTerm` (string, required): Product name or keyword
- `maxResults` (number, optional): Maximum results to return (default: 10)

**Returns**: Array of products with ID, name, price, availability

### `heb_add_to_list`

Add an item to your shopping list.

**Parameters**:
- `productId` (string, optional): Specific HEB product ID
- `searchTerm` (string, optional): Search for product by name
- `quantity` (number, optional): Quantity to add (default: 1)
- `listId` (string, optional): Target list ID (uses `HEB_DEFAULT_LIST_ID` if not provided)

**Note**: Either `productId` or `searchTerm` must be provided.

**Returns**: Confirmation message with product and list details

### `heb_get_shopping_lists`

Get all your shopping lists.

**Parameters**: None

**Returns**: Array of shopping lists with ID, name, and item count

### `heb_get_list_items`

Get items from a shopping list.

**Parameters**:
- `listId` (string, optional): Specific list ID (uses `HEB_DEFAULT_LIST_ID` if not provided)

**Returns**: List details with array of items (product info, quantity, checked status)

## Troubleshooting

### Authentication Errors

**Error**: "Authentication failed. Please update your HEB cookies."

**Solution**:
1. Cookies may have expired. Extract fresh cookies from HEB.com
2. Update your Claude Desktop config with new cookies
3. Restart Claude Desktop

### Product Not Found

**Error**: "Product not found"

**Solution**:
- Try a different search term (e.g., "organic eggs" instead of "eggs")
- Check spelling
- Make sure the product is available at your selected store

### List ID Errors

**Error**: "No list ID provided and HEB_DEFAULT_LIST_ID is not set"

**Solution**:
- Set `HEB_DEFAULT_LIST_ID` in your environment config
- Or provide a `listId` parameter when calling the tool

### Store Not Set

**Error**: "HEB_STORE_ID is required"

**Solution**:
- Make sure `HEB_STORE_ID` is set in your environment config
- The value should be your store number (e.g., "804")

## Architecture

- **TypeScript**: Full type safety with strict mode
- **MCP SDK**: Official Model Context Protocol SDK
- **Zod**: Runtime validation for all inputs
- **GraphQL**: HEB's GraphQL API with persisted queries
- **Cookie Auth**: Stateless authentication via environment variables

## Security

- All credentials are stored in environment variables (never in code)
- No credentials are logged or exposed in error messages
- All user inputs are validated and sanitized
- Secure cookie handling with proper headers

## Future Enhancements

Planned for v2:
- Username/password authentication (automatic cookie retrieval)
- Remove items from list
- Update item quantities
- Mark items as checked/unchecked
- Create new shopping lists

## License

MIT

## Contributing

This is part of the [everyday-mcp-servers](../../README.md) repository. See the main README for contribution guidelines.
