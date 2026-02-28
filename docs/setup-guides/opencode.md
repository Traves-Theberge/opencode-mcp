# OpenCode Setup Guide

Configure OpenCode MCP Server within OpenCode itself - self-hosted configuration.

## Overview

OpenCode can use its own MCP server! This creates a recursive setup where OpenCode can delegate to itself as a subagent with different models or agents.

## Prerequisites

- [OpenCode](https://opencode.ai) installed
- OpenCode server running (`opencode serve` or TUI active)
- API keys configured via `/connect`

## Configuration

### Method 1: opencode.json

Add to your `opencode.json` configuration file:

**Project-level:** `./opencode.json`
**Global:** `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode": {
      "type": "local",
      "command": ["node", "/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      },
      "enabled": true
    }
  }
}
```

### Method 2: Command Line

Start OpenCode with MCP server configured:

```bash
# Start OpenCode server
opencode serve

# In another terminal, run OpenCode TUI with MCP
opencode
```

Then in the TUI, use `/mcp` command to manage servers.

## Configuration Options

### Basic stdio Configuration

```json
{
  "mcp": {
    "opencode": {
      "type": "local",
      "command": ["node", "/path/to/opencode-mcp/dist/index.js"],
      "enabled": true
    }
  }
}
```

### With Custom Server URL

```json
{
  "mcp": {
    "opencode": {
      "type": "local",
      "command": ["node", "/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_MODEL": "anthropic/claude-sonnet-4"
      },
      "enabled": true
    }
  }
}
```

### HTTP Transport

For HTTP transport, configure as a remote server:

```json
{
  "mcp": {
    "opencode": {
      "type": "remote",
      "url": "http://localhost:3000/mcp",
      "enabled": true
    }
  }
}
```

### With Authentication

```json
{
  "mcp": {
    "opencode": {
      "type": "remote",
      "url": "https://your-server.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:OPENCODE_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

## Running the HTTP Server

To use HTTP transport, start the MCP server separately:

```bash
# Start OpenCode server
opencode serve --port 4096

# Start OpenCode MCP server (HTTP mode)
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node /path/to/opencode-mcp/dist/index.js
```

Or with environment variables:

```bash
export OPENCODE_SERVER_URL=http://localhost:4096
export MCP_TRANSPORT=http
export MCP_HTTP_PORT=3000
node /path/to/opencode-mcp/dist/index.js
```

## Usage in OpenCode

### Via TUI Chat

In the OpenCode TUI:

```
Use opencode_run to implement a rate limiter middleware
```

```
Use opencode_agent_delegate to have the plan agent review the code
```

### Via CLI

```bash
# Run a prompt through OpenCode
opencode run "Use opencode_run to implement a rate limiter"
```

### Recursive Delegation

Use different models/agents for subtasks:

```
Use opencode_agent_delegate with model anthropic/claude-opus-4 to analyze the security implications
```

## Tool Permissions

Control which tools are available:

```json
{
  "mcp": {
    "opencode": {
      "type": "local",
      "command": ["node", "/path/to/opencode-mcp/dist/index.js"],
      "enabled": true
    }
  },
  "tools": {
    "opencode_run": true,
    "opencode_session_*": true,
    "opencode_file_*": true,
    "opencode_agent_*": true
  }
}
```

## Verification

1. Start OpenCode TUI
2. Run `/mcp` command
3. Verify `opencode` server is listed
4. Check tool count (21 tools)

## Troubleshooting

### Server Not Connecting

```bash
# Check OpenCode server is running
curl http://localhost:4096/health

# Check MCP server starts
node /path/to/opencode-mcp/dist/index.js
```

### Tools Not Available

1. Check `enabled: true` in config
2. Restart OpenCode TUI
3. Check `/mcp` output for errors

### Port Conflicts

```bash
# Use different ports
opencode serve --port 4097

# Update MCP config
OPENCODE_SERVER_URL=http://localhost:4097 node /path/to/opencode-mcp/dist/index.js
```

## Config File Locations

| Scope | Path |
|-------|------|
| Global | `~/.config/opencode/opencode.json` |
| Project | `./opencode.json` |

## Full Example

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4",
  "mcp": {
    "opencode": {
      "type": "local",
      "command": ["node", "/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_MODEL": "anthropic/claude-sonnet-4"
      },
      "enabled": true
    }
  },
  "tools": {
    "opencode_*": true
  }
}
```

## Resources

- [OpenCode Documentation](https://opencode.ai/docs)
- [OpenCode MCP Servers](https://opencode.ai/docs/mcp-servers)
- [MCP Specification](https://modelcontextprotocol.io)
