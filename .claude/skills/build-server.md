---
name: build-server
description: Build, typecheck, test, and validate an MCP server. Use when you need to verify a server compiles correctly and tests pass.
---

You are helping build and validate an MCP server in the everyday-mcp-servers repository.

## Usage

When the user asks to build, test, or check a server, identify which server by name or path. Servers live under `servers/`.

## Build Steps

For a server at `servers/{name}/`:

1. **Install dependencies** (if node_modules is missing):
   ```bash
   cd servers/{name} && npm install
   ```

2. **Type check**:
   ```bash
   cd servers/{name} && npm run typecheck
   ```
   If this fails, analyze the TypeScript errors and help fix them.

3. **Run tests**:
   ```bash
   cd servers/{name} && npm test
   ```
   If tests fail, analyze failures and help fix them.

4. **Build**:
   ```bash
   cd servers/{name} && npm run build
   ```
   If this fails, analyze the build errors and help fix them.

5. **Verify output exists**:
   ```bash
   ls -la servers/{name}/dist/
   ```
   Confirm `index.js` and `index.d.ts` exist.

## Quick Status Check for All Servers

To check all servers at once:
```bash
for dir in servers/*/; do
  echo "=== $(basename $dir) ==="
  (cd "$dir" && npm run typecheck 2>&1 && npm test 2>&1 && npm run build 2>&1 && echo "OK" || echo "FAILED")
done
```

## Common Issues

- **Missing dependencies**: Run `npm install` first
- **Import path errors**: Ensure all imports use `.js` extension (ESM requirement)
- **Type errors after shared config change**: Verify `tsconfig.json` extends `../../tsconfig.base.json` correctly
- **tsup errors**: Check `tsup.config.ts` imports `baseConfig` from `../../tsup.config.base.js`
- **Test failures**: Check that all mocks are properly set up and reset between tests

## After Successful Build

Remind the user to test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node servers/{name}/dist/index.js
```

If the server requires environment variables, they must be set before running the inspector.
