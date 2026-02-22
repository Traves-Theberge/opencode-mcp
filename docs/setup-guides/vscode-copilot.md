# VS Code with GitHub Copilot Setup Guide

Complete guide to configure OpenCode MCP Server in Visual Studio Code with GitHub Copilot.

## Overview

VS Code has native MCP support for GitHub Copilot. MCP servers can be configured at user level or workspace level, and support both stdio and HTTP transports.

**Official Docs**: [https://code.visualstudio.com/docs/copilot/customization/mcp-servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com) installed
- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) extension installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: MCP Marketplace (Easiest)

1. Open VS Code
2. Open Extensions panel: `Cmd+Shift+X` / `Ctrl+Shift+X`
3. Click the **filter icon** and select **MCP Server**
4. Search for servers or browse the gallery
5. Click **Install** on desired server

### Method 2: User-Level Config

Configure MCP servers for your user profile:

1. Open Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type **MCP: List Servers**
3. Click **Add Server** or edit settings

Or edit the file directly:

**macOS/Linux:**
```bash
~/.vscode/mcp.json
```

**Windows:**
```
%USERPROFILE%\.vscode\mcp.json
```

### Method 3: Workspace Config (Recommended for Teams)

Create `.vscode/mcp.json` in your project root. This can be committed to source control.

```bash
mkdir -p .vscode
touch .vscode/mcp.json
```

## OpenCode Configuration

### stdio Transport

```json
{
  "servers": {
    "opencode": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      }
    }
  }
}
```

### HTTP Transport

```json
{
  "servers": {
    "opencode": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### With Custom Model

```json
{
  "servers": {
    "opencode": {
      "type": "stdio",
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

## Verification

1. Reload VS Code window: `Cmd+Shift+P` → **Developer: Reload Window**
2. Open Copilot Chat panel
3. Click the **tools icon** in the chat input
4. Look for OpenCode tools in the dropdown

## Usage in Copilot Chat

### Agent Mode

1. Open Copilot Chat
2. Select **Agent** mode from dropdown
3. Reference OpenCode tools:

```
Use opencode_run to implement a rate limiter middleware for Express.js
```

### Edit Mode

```
/opencode_run implement a rate limiter middleware
```

## Team Configuration

For team projects, commit `.vscode/mcp.json`:

```json
{
  "servers": {
    "opencode": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096"
      }
    }
  }
}
```

## Organization/Enterprise Settings

If you're in an organization:
- Admin must enable **"MCP servers in Copilot"** policy
- Some servers may be blocked by policy

## Troubleshooting

### Check Configuration

```bash
# Command Palette
Cmd+Shift+P → MCP: List Servers

# Should show 'opencode' as configured
```

### Server Not Starting

```bash
# Test command manually
node /path/to/opencode-mcp/dist/index.js

# Check Node version
node --version  # Should be 18+
```

### View Logs

Open Output panel: `Cmd+Shift+U`
Select **MCP** from dropdown

## Config File Locations

| Scope | Location |
|-------|----------|
| User | `~/.vscode/mcp.json` |
| Workspace | `.vscode/mcp.json` |

## Full Example

```json
{
  "servers": {
    "opencode": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_AUTO_START": "true"
      }
    }
  }
}
```

## Resources

- [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [GitHub Copilot MCP Guide](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp)
- [OpenCode Documentation](https://opencode.ai/docs)
