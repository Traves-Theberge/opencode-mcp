# Windsurf Setup Guide

Complete guide to configure OpenCode MCP Server in Windsurf IDE.

## Overview

Windsurf is an AI-native code editor with Cascade agent that supports MCP servers. It supports stdio, HTTP, and SSE transports with a built-in MCP Marketplace.

**Official Docs**: [https://docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)

## Prerequisites

- [Windsurf](https://windsurf.com) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: MCP Marketplace (Easiest)

1. Open Windsurf
2. Click the **MCPs** icon in the top-right of the Cascade panel
3. Browse or search for servers
4. Click **Install** on desired server
5. Configure environment variables when prompted

### Method 2: Settings UI

1. Open Windsurf Settings: `Windsurf → Settings` (macOS) or `File → Settings` (Windows/Linux)
2. Navigate to **Cascade → MCP Servers**
3. Click **Add MCP Server** or **View raw config**

### Method 3: Config File (Recommended)

Edit the MCP configuration file:

**macOS/Linux:**
```bash
~/.codeium/windsurf/mcp_config.json
```

**Windows:**
```
%USERPROFILE%\.codeium\windsurf\mcp_config.json
```

## OpenCode Configuration

### stdio Transport (Recommended)

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

### With Custom Model

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_MODEL": "anthropic/claude-sonnet-4"
      }
    }
  }
}
```

### HTTP Transport (Remote)

For HTTP transport, use `serverUrl`:

```json
{
  "mcpServers": {
    "opencode": {
      "serverUrl": "http://localhost:3000/mcp"
    }
  }
}
```

### With Authentication

```json
{
  "mcpServers": {
    "opencode": {
      "serverUrl": "http://your-server.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:OPENCODE_API_KEY}"
      }
    }
  }
}
```

## Environment Variable Interpolation

Windsurf supports `${env:VAR_NAME}` syntax:

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "${env:OPENCODE_SERVER_URL}",
        "OPENCODE_DEFAULT_MODEL": "${env:OPENCODE_DEFAULT_MODEL}"
      }
    }
  }
}
```

## Verification

1. Restart Windsurf completely
2. Open Cascade panel
3. Click the **MCPs** icon
4. Verify `opencode` is listed with green status
5. Click on it to see available tools (29 tools)

## Managing Tools

Windsurf has a limit of **100 total tools** across all MCP servers.

To toggle individual tools:

1. Click the **MCPs** icon
2. Click on the `opencode` server
3. Toggle tools on/off as needed

## Usage

In Cascade chat, reference OpenCode tools:

```
Use opencode_run to implement a rate limiter middleware
```

```
Use opencode_agent_delegate to have the plan agent review the auth module
```

## Team/Enterprise Settings

For Teams and Enterprise:

1. Admin can whitelist approved MCP servers
2. Once any server is whitelisted, all others are blocked
3. Server ID in whitelist must match config key exactly

**Admin whitelist config:**
- Server ID: `opencode`
- Server Config: (leave empty for plugin store default)

## Troubleshooting

### MCP Not Appearing

```bash
# Check config file exists and is valid JSON
cat ~/.codeium/windsurf/mcp_config.json | python -m json.tool

# Or with jq
jq . ~/.codeium/windsurf/mcp_config.json
```

### Tool Limit Exceeded

If you see "too many tools" error:
- Open MCP settings
- Disable unused tools from other servers
- Keep total under 100 tools

### Connection Issues

```bash
# Test OpenCode server
curl http://localhost:4096/health

# Test MCP server manually
node /path/to/opencode-mcp/dist/index.js
```

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/.codeium/windsurf/mcp_config.json` |
| Linux | `~/.codeium/windsurf/mcp_config.json` |
| Windows | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |

## Full Example

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_AUTO_START": "true",
        "OPENCODE_TIMEOUT": "120000"
      }
    }
  }
}
```

## Resources

- [Windsurf MCP Documentation](https://docs.windsurf.com/windsurf/cascade/mcp)
- [OpenCode Documentation](https://opencode.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
