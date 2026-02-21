# Zed Editor Setup Guide

Complete guide to configure OpenCode MCP Server in Zed Editor.

## Overview

Zed is a high-performance code editor with built-in MCP support. It supports stdio transport and stores MCP configuration in the settings file.

**Official Docs**: [https://zed.dev/docs/ai/mcp](https://zed.dev/docs/ai/mcp)

## Prerequisites

- [Zed Editor](https://zed.dev) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: Settings UI

1. Open Zed
2. Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
3. Search for "MCP" or navigate to AI settings
4. Add MCP server configuration

### Method 2: Settings File

Edit the Zed settings file:

**macOS/Linux:**
```bash
~/.config/zed/settings.json
```

**Windows:**
```
%APPDATA%\Zed\settings.json
```

## OpenCode Configuration

### Basic Configuration

Add to your `settings.json`:

```json
{
  "features": {
    "edit_prediction_provider": "copilot"
  },
  "mcp_servers": {
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

### With Existing Settings

If you have existing settings, merge carefully:

```json
{
  "theme": "One Dark",
  "vim_mode": false,
  "features": {
    "edit_prediction_provider": "copilot"
  },
  "mcp_servers": {
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
  "mcp_servers": {
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

## Security: Worktree Trust

Zed uses a **secure-by-default** approach:

- New worktrees are **not trusted** by default
- MCP servers in project settings won't run until you trust the worktree
- You'll be prompted to review before executing

To trust a worktree:
1. Open a project
2. You'll see a prompt about worktree trust
3. Review the MCP servers listed
4. Click **Trust** to enable

## Verification

1. Restart Zed completely
2. Open the Assistant panel
3. Look for available MCP tools
4. Verify OpenCode tools are listed

## Usage

In Zed's Assistant:

```
Use opencode_run to implement a rate limiter middleware
```

```
Use opencode_agent_delegate to have the plan agent review the code
```

## Project-Level Configuration

You can also configure MCP servers per-project in `.zed/settings.json`:

```json
{
  "mcp_servers": {
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

**Note**: Project-level servers require worktree trust.

## Troubleshooting

### Server Not Loading

```bash
# Check settings syntax
cat ~/.config/zed/settings.json | python -m json.tool

# Test server manually
npx @opencode-mcp/server
```

### Trust Issues

If servers aren't running:
1. Check if you've trusted the worktree
2. Look for trust prompts in Zed
3. Review what the MCP server can access

### Connection Issues

```bash
# Verify OpenCode server
curl http://localhost:4096/health

# Start if not running
opencode serve
```

## Config File Locations

| OS | Path |
|----|------|
| macOS | `~/.config/zed/settings.json` |
| Linux | `~/.config/zed/settings.json` |
| Windows | `%APPDATA%\Zed\settings.json` |
| Project | `.zed/settings.json` |

## Full Example

```json
{
  "theme": "One Dark",
  "features": {
    "edit_prediction_provider": "copilot"
  },
  "mcp_servers": {
    "opencode": {
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

- [Zed MCP Documentation](https://zed.dev/docs/ai/mcp)
- [Zed Security Blog](https://zed.dev/blog/secure-by-default)
- [OpenCode Documentation](https://opencode.ai/docs)
