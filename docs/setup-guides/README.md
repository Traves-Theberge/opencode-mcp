# Setup Guides Index

Complete setup instructions for configuring OpenCode MCP Server in various IDEs and AI clients.

## Available Guides

| IDE/Client | Transport | Config File | Status |
|------------|-----------|-------------|--------|
| [Codex CLI](./codex.md) | stdio | `~/.codex/config.toml` | ✅ Supported |
| [Gemini CLI](./gemini.md) | stdio/HTTP | `~/.gemini/settings.json` | ✅ Supported |
| [Roo Code](./roo-code.md) | stdio/HTTP | `mcp_settings.json` or `.roo/mcp.json` | ✅ Supported |
| [Antigravity](./antigravity.md) | stdio | `~/.gemini/antigravity/mcp_config.json` | ✅ Supported |
| [Cursor](./cursor.md) | stdio | `~/.cursor/mcp.json` | ✅ Supported |
| [Windsurf](./windsurf.md) | stdio | `~/.codeium/windsurf/mcp_config.json` | ✅ Supported |
| [Claude Desktop](./claude-desktop.md) | stdio | `~/Library/Application Support/Claude/claude_desktop_config.json` | ✅ Supported |
| [VS Code (Copilot)](./vscode-copilot.md) | stdio/HTTP | `.vscode/mcp.json` | ✅ Supported |
| [Cline](./cline.md) | stdio | `cline_mcp_settings.json` | ✅ Supported |
| [Continue.dev](./continue.md) | stdio | `.continue/mcpServers/` | ✅ Supported |
| [Zed](./zed.md) | stdio | `~/.config/zed/settings.json` | ✅ Supported |
| [OpenCode](./opencode.md) | stdio/HTTP | `opencode.json` | ✅ Self-hosted |
| [Aider MCP Server](./aider.md) | stdio | `aider-mcp` command | ✅ Reference |

## Quick Reference

### Config File Template (stdio)

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/your/project"
      }
    }
  }
}
```

> Replace `/path/to/opencode-mcp` with the actual path where you cloned the repository.

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
| `OPENCODE_DEFAULT_PROJECT` | Default project directory | - (required) |
| `OPENCODE_DEFAULT_MODEL` | Default model | - |
| `OPENCODE_AUTO_START` | Auto-start OpenCode | `true` |
| `OPENCODE_TIMEOUT` | Request timeout (ms) | `120000` |
| `OPENCODE_LOG_LEVEL` | Log level (debug, info, warn, error) | `info` |
| `MCP_TRANSPORT` | Transport mode | `stdio` |
| `MCP_HTTP_PORT` | HTTP port | `3000` |

## Prerequisites

Before configuring any IDE:

1. **Clone and build the MCP server**:
   ```bash
   git clone https://github.com/Traves-Theberge/opencode-mcp.git
   cd opencode-mcp
   npm install
   npm run build
   ```
2. **Install Node.js 18+** - Required for running the MCP server
3. **Install OpenCode** - [Install Guide](https://opencode.ai/docs/#install)
4. **Configure API Keys** - Run `opencode` and use `/connect` to set up providers
5. **Start OpenCode Server** - Run `opencode serve` or use the TUI

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot connect to OpenCode server" | Ensure `opencode serve` is running on the configured port |
| "Tool not found" | Restart the IDE after adding the MCP server |
| "Files created in wrong directory" | Set `OPENCODE_DEFAULT_PROJECT` environment variable |
| Slow responses | Check `OPENCODE_TIMEOUT` setting |

### Debug Mode

Enable debug logging in your MCP config:

```json
{
  "env": {
    "OPENCODE_LOG_LEVEL": "debug"
  }
}
```

Check OpenCode server logs:

```bash
opencode serve --log-level debug
```
