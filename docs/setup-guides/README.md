# Setup Guides Index

Complete setup instructions for configuring OpenCode MCP Server in various IDEs and AI clients.

## Available Guides

| IDE/Client | Transport | Config File | Status |
|------------|-----------|-------------|--------|
| [Cursor](./cursor.md) | stdio | `~/.cursor/mcp.json` | ✅ Supported |
| [Windsurf](./windsurf.md) | stdio | `~/.codeium/windsurf/mcp_config.json` | ✅ Supported |
| [Claude Desktop](./claude-desktop.md) | stdio | `~/Library/Application Support/Claude/claude_desktop_config.json` | ✅ Supported |
| [VS Code (Copilot)](./vscode-copilot.md) | stdio/HTTP | `.vscode/mcp.json` | ✅ Supported |
| [Cline](./cline.md) | stdio | `cline_mcp_settings.json` | ✅ Supported |
| [Continue.dev](./continue.md) | stdio | `.continue/mcpServers/` | ✅ Supported |
| [Zed](./zed.md) | stdio | `~/.config/zed/settings.json` | ✅ Supported |
| [OpenCode](./opencode.md) | stdio/HTTP | `opencode.json` | ✅ Self-hosted |

## Quick Reference

### Config File Template (stdio)

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      }
    }
  }
}
```

### Config File Template (HTTP)

```json
{
  "mcpServers": {
    "opencode": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Environment Variables

All guides use these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_SERVER_URL` | OpenCode server URL | `http://localhost:4096` |
| `OPENCODE_AUTO_START` | Auto-start OpenCode | `true` |
| `OPENCODE_DEFAULT_MODEL` | Default model | - |
| `OPENCODE_TIMEOUT` | Request timeout (ms) | `120000` |
| `MCP_TRANSPORT` | Transport mode | `stdio` |
| `MCP_HTTP_PORT` | HTTP port | `3000` |

## Prerequisites

Before configuring any IDE:

1. **Install Node.js 18+** - Required for running the MCP server
2. **Install OpenCode** - [Install Guide](https://opencode.ai/docs/#install)
3. **Configure API Keys** - Run `opencode` and use `/connect` to set up providers
4. **Start OpenCode Server** - Run `opencode serve` or use the TUI

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to OpenCode server" | Ensure `opencode serve` is running on the configured port |
| "Tool not found" | Restart the IDE after adding the MCP server |
| "npx not found" | Ensure Node.js is installed and in PATH |
| Slow responses | Check `OPENCODE_TIMEOUT` setting |

### Debug Mode

Enable debug logging:

```bash
# Set before running the MCP server
export MCP_TRANSPORT=stdio
npx @opencode-mcp/server
```

Check OpenCode server logs:

```bash
opencode serve --log-level debug
```
