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

- MUST test all servers with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) before integration
- Test ALL tools with various inputs including edge cases and invalid inputs
- Verify error handling and validation work correctly
- Test integration with Claude Desktop or Claude Code
- Document test scenarios and expected behavior in each server's README

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
