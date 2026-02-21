# Cursor Setup Guide

Complete guide to configure OpenCode MCP Server in Cursor IDE.

## Overview

Cursor is an AI-first code editor with built-in MCP support. It uses stdio transport by default and stores MCP configuration in a JSON file.

## Prerequisites

- [Cursor](https://cursor.sh) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: Settings UI

1. Open Cursor
2. Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux) to open Settings
3. Search for "MCP" or navigate to Features → MCP
4. Click "Add MCP Server"
5. Enter the following:
   - **Name**: `opencode`
   - **Command**: `npx`
   - **Args**: `-y, @opencode-mcp/server`
   - **Environment Variables**: `OPENCODE_SERVER_URL=http://localhost:4096`

### Method 2: Config File (Recommended)

Edit the MCP configuration file directly:

**macOS/Linux:**
```bash
~/.cursor/mcp.json
```

**Windows:**
```
%USERPROFILE%\.cursor\mcp.json
```

**Configuration:**

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

### HTTP Transport (Optional)

For HTTP transport, configure Cursor to connect to a remote MCP server:

```json
{
  "mcpServers": {
    "opencode": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Verification

1. Restart Cursor
2. Open the Chat panel (`Cmd+L` / `Ctrl+L`)
3. Click the tools icon to see available tools
4. You should see 29 OpenCode tools listed

## Usage

In Cursor Chat, reference OpenCode tools directly:

```
Use opencode_run to implement a rate limiter middleware for Express.js
```

```
Use opencode_agent_delegate to have the plan agent review the auth module
```

## Troubleshooting

### Server Not Starting

```bash
# Check if the server starts manually
npx @opencode-mcp/server

# Check Node.js version
node --version  # Should be 18+
```

### Tools Not Appearing

1. Completely quit Cursor (not just close the window)
2. Check the config file syntax is valid JSON
3. Verify the paths are correct for your system

### Connection Refused

```bash
# Ensure OpenCode server is running
curl http://localhost:4096/health

# Or start it
opencode serve
```

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/.cursor/mcp.json` |
| Linux | `~/.cursor/mcp.json` |
| Windows | `%USERPROFILE%\.cursor\mcp.json` |

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

- [Cursor MCP Documentation](https://docs.cursor.com/context/mcp)
- [OpenCode Documentation](https://opencode.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
