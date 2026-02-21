# Cline Setup Guide

Complete guide to configure OpenCode MCP Server in Cline for VS Code.

## Overview

Cline is an autonomous coding agent extension for VS Code with native MCP support. It supports both stdio and SSE transports.

**Official Docs**: [https://docs.cline.bot/mcp/configuring-mcp-servers](https://docs.cline.bot/mcp/configuring-mcp-servers)

## Prerequisites

- [VS Code](https://code.visualstudio.com) installed
- [Cline Extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: Have Cline Add It

The easiest way is to ask Cline to add the server:

1. Open Cline in VS Code
2. Type:
   ```
   Add the OpenCode MCP server from https://github.com/opencode-mcp/server
   ```
3. Cline will clone, build, and configure it

### Method 2: Settings UI

1. Click the **MCP Servers** icon in Cline's top navigation
2. Click **Configure MCP Servers**
3. Select **Configure** tab
4. Add the server configuration

### Method 3: Config File

Edit `cline_mcp_settings.json`:

**macOS/Linux:**
```bash
~/.config/cline/mcp_settings.json
```

**Windows:**
```
%USERPROFILE%\.config\cline\mcp_settings.json
```

## OpenCode Configuration

### stdio Transport

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      },
      "alwaysAllow": [],
      "disabled": false
    }
  }
}
```

### With Always-Allow Tools

Skip approval for specific tools:

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      },
      "alwaysAllow": [
        "opencode_run",
        "opencode_session_list",
        "opencode_file_read"
      ],
      "disabled": false
    }
  }
}
```

### SSE Transport (HTTP)

```json
{
  "mcpServers": {
    "opencode": {
      "url": "http://localhost:3000/mcp",
      "alwaysAllow": [],
      "disabled": false
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
        "OPENCODE_DEFAULT_MODEL": "anthropic/claude-sonnet-4",
        "OPENCODE_TIMEOUT": "120000"
      },
      "disabled": false
    }
  }
}
```

## Global MCP Mode

Control how MCP servers affect token usage:

1. Open Cline settings
2. Click **Advanced MCP Settings**
3. Select **Configure** tab
4. Find **Cline > Mcp: Mode**

Options:
- **Auto**: Include all tools automatically
- **Manual**: Include only when specifically requested

## Verification

1. Click **MCP Servers** icon in Cline
2. Verify `opencode` is listed
3. Green dot = connected
4. Click to see tool count

## Usage

In Cline chat:

```
Use opencode_run to implement a rate limiter middleware
```

```
Use opencode_agent_delegate to have the plan agent review the code
```

## Managing Servers

| Action | How |
|--------|-----|
| Enable/Disable | Toggle switch next to server |
| Restart | Click "Restart Server" |
| Delete | Click trash icon |
| Network Timeout | Set in server settings (30s - 1hr) |

## Troubleshooting

### Server Not Responding

```bash
# Check if process is running
ps aux | grep opencode-mcp

# Test server manually
npx @opencode-mcp/server
```

### Tools Not Available

1. Check server is not disabled
2. Restart the server from Cline UI
3. Check logs for errors

### Permission Errors

Ensure environment variables are set correctly:
```json
{
  "env": {
    "OPENCODE_SERVER_URL": "http://localhost:4096"
  }
}
```

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/.config/cline/mcp_settings.json` |
| Linux | `~/.config/cline/mcp_settings.json` |
| Windows | `%USERPROFILE%\.config\cline\mcp_settings.json` |

## Full Example

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_AUTO_START": "true"
      },
      "alwaysAllow": ["opencode_run"],
      "disabled": false
    }
  }
}
```

## Resources

- [Cline MCP Documentation](https://docs.cline.bot/mcp/configuring-mcp-servers)
- [Cline MCP Marketplace](https://docs.cline.bot/mcp/mcp-marketplace)
- [OpenCode Documentation](https://opencode.ai/docs)
