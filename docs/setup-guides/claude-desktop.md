# Claude Desktop Setup Guide

Complete guide to configure OpenCode MCP Server in Claude Desktop.

## Overview

Claude Desktop is Anthropic's official desktop application with native MCP support. It uses stdio transport and stores configuration in a JSON file.

## Prerequisites

- [Claude Desktop](https://claude.ai/download) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: Settings UI

1. Open Claude Desktop
2. Click **Settings** (gear icon) in the bottom-left
3. Navigate to **Developer** tab
4. Click **Edit Config**
5. The config file will open in your default editor

### Method 2: Direct File Edit

Edit the configuration file directly:

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

## OpenCode Configuration

### Basic Configuration

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
        "OPENCODE_DEFAULT_MODEL": "anthropic/claude-sonnet-4",
        "OPENCODE_TIMEOUT": "120000"
      }
    }
  }
}
```

### With Additional MCP Servers

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    }
  }
}
```

## Verification

1. **Completely quit** Claude Desktop (not just close the window)
   - macOS: `Cmd+Q` or Claude → Quit
   - Windows: Right-click tray icon → Exit
2. Restart Claude Desktop
3. Start a new conversation
4. Look for the **hammer/tools icon** in the message box
5. Click to see available tools (29 OpenCode tools)

## Usage

In Claude Desktop chat:

```
Use opencode_run to implement a React hook for data fetching
```

```
Use opencode_agent_delegate to have the plan agent review the authentication module for security issues
```

```
Use opencode_file_search to find all uses of deprecated functions
```

## Security Notes

- MCP servers run with your user permissions
- Only add servers from trusted sources
- Review what each server can access before enabling

## Troubleshooting

### Server Not Loading

```bash
# Check config file syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool

# Test MCP server directly
node /path/to/opencode-mcp/dist/index.js
```

### No Tools Appearing

1. Ensure Claude is **completely quit** before restart
2. Check for JSON syntax errors in config
3. Check Node.js is installed: `node --version`
4. Try running the command manually in terminal

### Connection Refused

```bash
# Verify OpenCode server is running
curl http://localhost:4096/health

# Start if not running
opencode serve
```

### Debug Logging

Check Claude Desktop logs:

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```
%APPDATA%\Claude\logs\mcp*.log
```

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

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

- [Claude Desktop Documentation](https://docs.anthropic.com/claude/docs/mcp)
- [OpenCode Documentation](https://opencode.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
