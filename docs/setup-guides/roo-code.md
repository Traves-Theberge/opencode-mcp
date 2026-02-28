# Roo Code Setup Guide

Setup guide for the Roo Code VS Code extension.

## Overview

Roo Code supports MCP servers via JSON configuration files. It supports both stdio (local) and Streamable HTTP (remote) transports.

## Prerequisites

1. **Install Roo Code**: VS Code Marketplace extension `Roo Code`
2. **OpenCode MCP Server built**:
   ```bash
   git clone https://github.com/Traves-Theberge/opencode-mcp.git
   cd opencode-mcp
   npm install
   npm run build
   ```
3. **OpenCode server running**:
   ```bash
   opencode serve
   ```

## Configuration

Roo Code supports two MCP configuration locations:

- **Global config**: `mcp_settings.json` (opened from the Roo MCP settings UI)
- **Project config**: `.roo/mcp.json` (in your project root)

Project-level settings override global settings when server names overlap.

### stdio (local) Configuration

Add the following to your global `mcp_settings.json` or project `.roo/mcp.json`:

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/your/project",
        "OPENCODE_LOG_LEVEL": "info"
      },
      "disabled": false
    }
  }
}
```

### Streamable HTTP Configuration

If you are running OpenCode MCP Server with HTTP transport:

```json
{
  "mcpServers": {
    "opencode": {
      "type": "streamable-http",
      "url": "http://localhost:3000/mcp",
      "disabled": false
    }
  }
}
```

## Editing MCP Settings in Roo Code

1. Open Roo Code in VS Code
2. Click the **server** icon in the Roo Code panel
3. Scroll to the bottom of the MCP view
4. Click **Edit Global MCP** or **Edit Project MCP**

Roo Code will open the appropriate JSON file for you to edit.

## Verification

1. Restart Roo Code after updating MCP settings
2. Open the MCP panel and confirm `opencode` appears
3. Run a test prompt:
   ```
   Use opencode_run to list the files in the current directory
   ```

## Troubleshooting

### "Server not responding"

1. Confirm OpenCode server is running:
   ```bash
   curl http://localhost:4096/health
   ```
2. Confirm the path to `dist/index.js` is correct
3. Check Roo Code MCP settings for JSON syntax errors

### "Tools not showing"

1. Ensure the server is not marked `disabled`
2. Restart Roo Code after updating MCP settings
3. Confirm the server starts without errors in the MCP panel

## Related Documentation

- Roo Code MCP Guide: https://docs.roocode.com/features/mcp/using-mcp-in-roo
