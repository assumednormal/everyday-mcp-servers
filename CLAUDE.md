# Claude Development Guide - Everyday MCP Servers

This document contains instructions and best practices for developing Model Context Protocol (MCP) servers in this repository.

## 🎯 Core Principles

### MCP Server Development Best Practices

1. **Server Structure**
   - Each server MUST live in its own directory under `/servers/`
   - Every server MUST include a dedicated README.md with usage examples and setup instructions
   - Every server MUST have a complete `package.json` with all dependencies and build scripts
   - All servers MUST be written in TypeScript (no JavaScript)

2. **MCP Protocol Standards**
   - Follow the official [Model Context Protocol specification](https://modelcontextprotocol.io/)
   - All tools and resources MUST have proper error handling and validation
   - Use descriptive tool names and comprehensive parameter schemas (not optional)
   - Every tool, resource, and prompt MUST include detailed descriptions
   - Test all servers with the MCP Inspector before integration (mandatory)

   **Tool Description Best Practices**
   - Tool descriptions directly guide Claude's behavior - be explicit about workflows
   - Use directive language: "ALWAYS use X FIRST before Y" to enforce sequences
   - Distinguish approaches: "PREFERRED: Use X after Y" vs "ALTERNATIVE: Use Z when..."
   - Example: For shopping lists, always search → show options → user chooses → add item
   - This prevents unwanted auto-adding and gives users control over selections

3. **Code Quality**
   - Write clean, maintainable, well-documented code (no shortcuts)
   - Use meaningful variable and function names (single-letter variables only for iterators)
   - Handle ALL edge cases and errors gracefully (no silent failures)
   - Include appropriate logging for debugging and monitoring
   - Write tests for all critical functionality (testing is not optional)

4. **Security**
   - ALL user inputs MUST be sanitized and validated
   - ALL API responses MUST be validated before processing
   - NEVER store credentials in code - use environment variables exclusively
   - Document all required environment variables in the server's README and update the top-level `.env.example`
   - Request only the minimum API permissions required (principle of least privilege)

5. **Configuration**
   - All configuration MUST be via environment variables
   - Provide sensible defaults for non-sensitive configuration
   - Document ALL configuration options in the server README
   - Ensure `.gitignore` excludes sensitive files and build artifacts

## 📚 Living Documentation

**IMPORTANT**: This CLAUDE.md file should be treated as living documentation. As you work on this project:

- **Always update this file** when you discover patterns, conventions, or decisions that should be preserved
- Document project-specific quirks, gotchas, or best practices as you encounter them
- Record architectural decisions and their rationale
- Note any deviations from standard MCP patterns and explain why
- Update this file BEFORE completing tasks if you've learned something important
- Keep it organized - add new sections as needed, but keep it scannable

### What to Document Here
- MCP server implementation patterns used in this project
- Integration patterns with external APIs (HEB, etc.)
- Testing strategies and tools
- Deployment/distribution approaches
- Common debugging techniques
- Performance optimization discoveries

## 🔌 External API Integration Patterns

### GraphQL API Integration (Learned from HEB)

**Response Structure Pitfalls**
- Response field names frequently differ from operation names
  - Operation: `deleteShoppingListItems` → Response: `deleteShoppingListItemsV2`
  - Always check for "V2" or version suffixes in response fields
- Response structures are often flatter than expected
  - Don't assume: `response.data.wrapper.items`
  - Verify actual: `response.data.items` or `response.data.itemPage.items`
- Field name inconsistencies require mapping layer
  - API: `totalItemCount`, `created`, `updated`, `fullDisplayName`
  - Types: `itemCount`, `createdAt`, `updatedAt`, `name`
  - Always map in transformation, never rely on 1:1 naming

**Persisted Queries Pattern**
- Some GraphQL APIs (e.g., HEB/Apollo) use persisted queries with SHA-256 hashes
- Operation name in request ≠ response field name (verify both separately)
- Extract hashes from HAR files or network inspection
- Store hashes in dedicated queries file with descriptive function names

**API-Specific Quirks to Document**
When integrating a new API, document in server's README:
- Authentication method and required credentials
- Any API limitations (e.g., "no quantity field in mutations")
- Workarounds implemented (e.g., "duplicate items for quantity")
- Response structure patterns unique to that API

## 🛠️ Custom Skills

The `.claude/skills/` directory contains custom skills to enhance development workflows. **Proactively create new skills** when you identify repetitive tasks or common operations.

### When to Create a New Skill
- GitHub operations (PRs, issues, releases) - use `gh` CLI
- Testing workflows (running specific test suites)
- Building and packaging MCP servers
- Common debugging or inspection tasks
- Deployment or release procedures

### Example: GitHub Integration Skill
For GitHub operations, create skills in `.claude/skills/` that leverage the `gh` CLI:
- Checking PR status and reviews
- Creating issues from bug reports
- Managing releases and tags
- Viewing CI/CD status

**Action Item**: If you find yourself running similar GitHub commands repeatedly, create a skill for it.

## 🏗️ Project Structure

```
everyday-mcp-servers/
├── .claude/
│   └── skills/           # Custom Claude Code skills
├── servers/
│   ├── heb-shopping-list/  # Individual MCP server
│   └── [future-server]/
├── CLAUDE.md             # This file - keep updated!
├── README.md             # Public documentation
└── package.json          # Root package config
```

## 🧪 Testing MCP Servers

### General Testing Requirements
- MUST test all servers with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) before integration
- Test ALL tools with various inputs including edge cases and invalid inputs
- Verify error handling and validation work correctly
- Test integration with Claude Desktop or Claude Code
- Document test scenarios and expected behavior in each server's README

### Testing Strategy for External APIs
**CRITICAL**: When integrating with external APIs (especially GraphQL):

1. **Never trust HAR file responses alone**
   - HAR exports often have null/incomplete response bodies
   - Always verify actual API responses with direct tests using `fetch`

2. **Incremental testing approach**
   - Step 1: Direct API test (fetch) to verify response structure
   - Step 2: Test individual MCP tool implementation
   - Step 3: End-to-end workflow testing

3. **Response structure validation**
   - API response field names often differ from operation names
   - Example: Operation `addToShoppingListV2` → Response field `addShoppingListItemsV2`
   - Don't assume nested structures - verify the actual depth
   - Field naming is often inconsistent (e.g., `totalItemCount` vs `itemCount`, `created` vs `createdAt`)

4. **Create test scripts during development**
   - Build direct API test scripts to verify each endpoint
   - Keep them in the server directory during development
   - Delete before committing (they're for debugging only)

## 📦 Dependencies & Build Tools

- Use the official `@modelcontextprotocol/sdk` for all MCP implementations
- Keep dependencies minimal - only add well-maintained, necessary packages
- Use TypeScript exclusively (configured with strict mode)
- Use `tsup` for building all servers (consistent build tooling across project)
- Use `tsx` for development/watch mode

## 🚀 Distribution

- Each server MUST be runnable as a standalone package
- Include clear, step-by-step installation instructions in the server README
- Include example MCP client configurations (for Claude Desktop, etc.) in the server README

---

**Remember**: Keep this document updated as the project evolves. Document patterns and decisions here, but keep server-specific implementation details in each server's README.
