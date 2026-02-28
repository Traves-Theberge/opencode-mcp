# Aider MCP Server Guide

Setup guide for running the Aider MCP server. This is useful if you want to expose Aider as an MCP server to other MCP clients.

> **Note:** Aider itself is not an MCP client. This guide covers running **Aider as an MCP server**.

## Overview

The Aider MCP server lets MCP clients delegate file edits, code extraction, and git status checks to Aider.

## Prerequisites

1. **Python 3.8+**
2. **Aider installed**:
   ```bash
   pip install aider-chat
   ```
3. **API key** for the model you want Aider to use

## Install and Run (Recommended)

Using `uvx`:

```bash
uvx aider-mcp
```

Run with a repository path:

```bash
uvx aider-mcp --repo-path=/path/to/your/repo
```

## Client Configuration Example

Configure your MCP client to run the Aider MCP server:

```json
{
  "mcpServers": {
    "aider-mcp": {
      "command": "uvx",
      "args": ["aider-mcp", "--repo-path", "/path/to/your/repo"]
    }
  }
}
```

## Useful Environment Variables

- `AIDER_PATH`: Path to the Aider executable
- `REPO_PATH`: Path to the git repository
- `AIDER_CONFIG_FILE`: Path to a custom Aider config file
- `AIDER_ENV_FILE`: Path to a custom `.env` file
- `OPENAI_API_KEY`: API key for OpenAI models
- `ANTHROPIC_API_KEY`: API key for Anthropic models

## Verification

Test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector uvx aider-mcp --repo-path=/path/to/your/repo
```

## Related Documentation

- Aider MCP Server: https://github.com/sengokudaikon/aider-mcp-server
- Aider: https://github.com/paul-gauthier/aider
