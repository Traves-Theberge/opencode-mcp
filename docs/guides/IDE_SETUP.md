# IDE Setup Guide

How to configure OpenCode MCP Server in your IDE or AI client.

## Quick Start

### 1. Install OpenCode

First, ensure OpenCode is installed and configured:

```bash
# Install OpenCode
curl -fsSL https://opencode.ai/install | bash

# Configure your API key
opencode
# Then run /connect to set up your provider
```

### 2. Start OpenCode Server

```bash
# Start the OpenCode server (or use the TUI which starts it automatically)
opencode serve --port 4096
```

### 3. Configure Your IDE

Add the MCP server configuration to your IDE's MCP settings.

---

## Cursor

**Configuration File**: `~/.cursor/mcp.json`

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

**With HTTP Transport**:
```json
{
  "mcpServers": {
    "opencode": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

---

## Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

---

## Windsurf

**Configuration File**: `~/.codeium/windsurf/mcp_config.json`

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

---

## VS Code (with Cline or Continue)

### Cline

Add to VS Code settings or `.vscode/mcp.json`:

```json
{
  "cline.mcpServers": {
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

### Continue

Add to `~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "opencode",
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@opencode-mcp/server"],
          "env": {
            "OPENCODE_SERVER_URL": "http://localhost:4096"
          }
        }
      }
    ]
  }
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_SERVER_URL` | OpenCode server URL | `http://localhost:4096` |
| `OPENCODE_AUTO_START` | Auto-start OpenCode server | `true` |
| `OPENCODE_DEFAULT_MODEL` | Default model to use | - |
| `OPENCODE_TIMEOUT` | Request timeout in ms | `120000` |
| `MCP_TRANSPORT` | Transport mode: `stdio` or `http` | `stdio` |
| `MCP_HTTP_PORT` | HTTP port (if transport=http) | `3000` |
| `MCP_CORS_ORIGINS` | CORS origins (comma-separated) | `*` |

---

## Transport Modes

### stdio (Recommended for IDEs)

- **Best for**: Local IDE integration
- **Pros**: Simple configuration, works with all MCP clients
- **Cons**: Only one client at a time

### HTTP

- **Best for**: Remote access, multiple clients
- **Pros**: Can be accessed from any machine, multiple clients
- **Cons**: Requires port management, potential security considerations

**Starting HTTP server**:
```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npx @opencode-mcp/server
```

**Endpoints**:
- `GET /health` - Health check
- `POST /mcp` - MCP requests
- `GET /mcp` - SSE streaming

---

## Usage Examples

Once configured, you can use OpenCode tools in your IDE:

### Basic Task
```
Use opencode_run to implement a rate limiter middleware for Express.js
```

### Code Review
```
Use opencode_agent_delegate to have the plan agent review the authentication module
```

### File Search
```
Use opencode_file_search to find all uses of the deprecated function
```

### Model Selection
```
Use opencode_run with model anthropic/claude-sonnet-4 to refactor this component
```

---

## Troubleshooting

### "Cannot connect to OpenCode server"

1. Ensure OpenCode is running: `opencode serve`
2. Check the server URL matches (default: `http://localhost:4096`)
3. Verify your API keys are configured in OpenCode

### "Tool not found"

1. Restart your IDE after adding the MCP server
2. Check the MCP server logs for errors
3. Verify the `npx` command works in terminal

### Slow responses

1. Use a smaller/faster model for simple tasks
2. Consider using `opencode_agent_delegate` with the `explore` agent for quick searches
3. Check OpenCode server logs for performance issues
