# Google Antigravity Setup Guide

Complete guide to configure OpenCode MCP Server in Google Antigravity IDE.

## Overview

[Google Antigravity](https://antigravity.google) is an AI-first code editor (fork of VS Code) with built-in MCP support and native integration with Gemini models. It uses stdio transport by default and stores MCP configuration in a JSON file.

## Prerequisites

- [Antigravity](https://antigravity.google/download) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)
- Google account signed in (for Gemini access)

## Configuration

### Method 1: Settings UI

1. Open Antigravity
2. Click the **"..."** menu at the top of the Agent panel
3. Select **MCP Servers → Manage MCP Servers → View raw config**
4. Add the OpenCode MCP server configuration (see below)
5. Save and restart Antigravity

### Method 2: Config File (Recommended)

Edit the MCP configuration file directly:

**macOS/Linux:**
```bash
~/.gemini/antigravity/mcp_config.json
```

**Windows:**
```
%USERPROFILE%\.gemini\antigravity\mcp_config.json
```

**Configuration:**

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

> **Important:** 
> - Replace `/path/to/opencode-mcp` with the actual path where you cloned the repository
> - Set `OPENCODE_DEFAULT_PROJECT` to your project directory. This ensures file operations work correctly.

### With Custom Model

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/your/project",
        "OPENCODE_DEFAULT_MODEL": "anthropic/claude-sonnet-4"
      }
    }
  }
}
```

### With Debug Logging

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/your/project",
        "OPENCODE_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### HTTP Transport (Optional)

For HTTP transport, configure Antigravity to connect to a remote MCP server:

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

1. Restart Antigravity
2. Open the Agent panel
3. Start a new conversation
4. You should be able to use OpenCode tools

## Usage

In Antigravity Agent, reference OpenCode tools directly:

```
Use opencode_run to implement a rate limiter middleware for Express.js
```

```
Use opencode_agent_delegate to have the plan agent review the auth module
```

```
Use opencode_file_search to find all uses of deprecated functions
```

## Antigravity-Specific Features

### Integration with Gemini Models

Antigravity provides access to Google's Gemini models. You can use OpenCode alongside Gemini:

```
First use opencode_run to analyze the codebase structure, then implement the feature
```

### Agent Autonomy Settings

Antigravity has agent autonomy settings that control tool execution:

1. Open Settings (`Cmd+,` / `Ctrl+,`)
2. Search for "Agent" or "Autonomy"
3. Configure terminal execution policy:
   - **Off**: Tools require approval (safest)
   - **Auto**: Agent decides when to ask
   - **Custom**: Configure allow/deny lists

For OpenCode tools, we recommend **Auto** or **Custom** with OpenCode tools in the allow list.

### Browser Integration

Antigravity has built-in browser integration. You can combine it with OpenCode:

```
Use opencode_run to create a React component, then use the browser to test it
```

## Troubleshooting

### Server Not Starting

```bash
# Make sure you've built the server
cd /path/to/opencode-mcp
npm install
npm run build

# Verify the build exists
ls dist/index.js

# Check Node.js version
node --version  # Should be 18+
```

### Tools Not Appearing

1. Completely quit Antigravity (not just close the window)
2. Check the config file syntax is valid JSON
3. Verify the paths are correct for your system
4. Check Antigravity's developer console for errors (`Help → Toggle Developer Tools`)

### Connection Refused

```bash
# Ensure OpenCode server is running
curl http://localhost:4096/health

# Or start it
opencode serve
```

### Permission Issues (Linux)

```bash
# Ensure your user has access to the config directory
sudo chown -R $USER:$USER ~/.gemini/antigravity
```

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/.gemini/antigravity/mcp_config.json` |
| Linux | `~/.gemini/antigravity/mcp_config.json` |
| Windows | `%USERPROFILE%\.gemini\antigravity\mcp_config.json` |

## Full Example

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/your/project",
        "OPENCODE_AUTO_START": "true",
        "OPENCODE_TIMEOUT": "120000",
        "OPENCODE_LOG_LEVEL": "info"
      }
    }
  }
}
```

> Replace `/path/to/opencode-mcp` with the actual path where you cloned the repository.

## Resources

- [Antigravity Official Site](https://antigravity.google)
- [Antigravity Download](https://antigravity.google/download)
- [OpenCode Documentation](https://opencode.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
