---
name: gh-helper
description: Helper for GitHub CLI operations. Use when working with PRs, issues, releases, or CI/CD workflows via the gh command.
---

You are helping with GitHub operations for the everyday-mcp-servers repository using the `gh` CLI.

## Common Operations

### Pull Requests
- **List PRs**: `gh pr list`
- **View PR details**: `gh pr view [number]`
- **Check PR status**: `gh pr checks [number]`
- **Create PR**: `gh pr create --title "..." --body "..."`

### Issues
- **List issues**: `gh issue list`
- **View issue**: `gh issue view [number]`
- **Create issue**: `gh issue create --title "..." --body "..."`

### Releases
- **List releases**: `gh release list`
- **Create release**: `gh release create [tag] --title "..." --notes "..."`
- **View release**: `gh release view [tag]`

### CI/CD & Repository
- **View repo info**: `gh repo view`
- **List workflow runs**: `gh run list`
- **Watch workflow**: `gh run watch`

## Best Practices

1. **Check auth first** if commands fail: `gh auth status`
2. **Use JSON output** for parsing: `--json` flag
3. **Follow conventions** from git history for commit/PR styles
4. **Be descriptive** in PR and issue bodies
5. **Summarize results** clearly for the user

## Quick Workflows

**Before merging a PR:**
```bash
gh pr view [number]
gh pr checks [number]
```

**Creating a release:**
```bash
git log --oneline -10  # Check recent changes
gh release create v0.x.x --title "Release v0.x.x" --notes "..."
```

**Monitoring CI:**
```bash
gh run list --limit 5
```

Execute the appropriate `gh` commands and provide clear summaries to the user.
