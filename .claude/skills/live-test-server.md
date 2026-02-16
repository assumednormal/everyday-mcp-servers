---
name: live-test-server
description: Run a live API test against an MCP server using real environment variables. Use when you need to verify a server works against the actual external API.
---

You are helping test an MCP server against its live external API using environment variables from the project `.env` file.

## Prerequisites

- The `.env` file at the repository root must contain the required environment variables
- The server must be built (`npm run build` in the server directory)

## How to Load Environment Variables

Source the `.env` file before running Node:
```bash
export $(grep -v '^#' .env | grep -v '^$' | xargs)
```

## Testing Approach

Write an inline Node.js script (`node -e "..."`) that:
1. Reads env vars from `process.env`
2. Constructs the API request directly (using `fetch`, not the server's module system — avoids ESM/startup issues)
3. Sends the request and logs the **full raw response** as `JSON.stringify(data, null, 2)`
4. Uses a 15-second timeout

### Template for GraphQL APIs (e.g., HEB)

```bash
export $(grep -v '^#' .env | grep -v '^$' | xargs) && node -e "
const headers = {
  'content-type': 'application/json',
  'accept': '*/*',
  // ... API-specific headers using process.env values
};

const body = {
  operationName: 'operationName',
  variables: { /* ... */ },
  extensions: { persistedQuery: { version: 1, sha256Hash: 'hash' } }
};

fetch('https://api-endpoint.com/graphql', {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
}).then(r => r.json()).then(data => {
  console.log('FULL RESPONSE:', JSON.stringify(data, null, 2));
}).catch(e => console.error('Error:', e.message));
" 2>&1
```

### Template for REST/Scraping APIs (e.g., AllRecipes)

```bash
export $(grep -v '^#' .env | grep -v '^$' | xargs) && node -e "
fetch('https://api-endpoint.com/path', {
  headers: { /* ... */ },
}).then(r => r.text()).then(body => {
  console.log('Response length:', body.length);
  console.log('First 2000 chars:', body.substring(0, 2000));
}).catch(e => console.error('Error:', e.message));
" 2>&1
```

## What to Check

1. **Response field names** — especially for GraphQL APIs where operation names differ from response field names (e.g., operation `updateShoppingListItem` → response field `updateShoppingListItemV2`)
2. **Response structure depth** — don't assume nesting, verify actual shape
3. **Field naming inconsistencies** — API may use `totalItemCount` while types use `itemCount`
4. **Error responses** — check for auth failures (401/403), rate limiting (429), or GraphQL errors
5. **Data types** — confirm numbers are numbers, dates are strings, etc.

## After Testing

- Update the server code if the response structure doesn't match what was assumed
- Rebuild and rerun unit tests after any fixes
- If auth cookies have expired, tell the user to refresh them from their browser

## Server-Specific Notes

### HEB Shopping List
- Cookie-based auth: `sat`, `JSESSIONID`, `reese84`, `CURR_SESSION_STORE`
- GraphQL endpoint: `https://www.heb.com/graphql`
- Requires headers: `apollographql-client-name`, `apollographql-client-version`, realistic `user-agent`
- Response fields almost always have a V2 suffix that differs from the operation name

### AllRecipes
- No auth required — public web scraping
- Test by fetching a known recipe URL and verifying HTML parsing
