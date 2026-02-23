# Codex CLI Setup Guide

Setup guide for OpenAI's Codex CLI.

## Overview

Codex CLI is OpenAI's command-line AI coding assistant. It supports MCP servers via stdio transport and reads project instructions from `AGENTS.md`.

## Prerequisites

1. **Codex CLI installed**:
   ```bash
   npm install -g @openai/codex
   ```

2. **OpenAI API key configured**:
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

3. **OpenCode MCP Server built**:
   ```bash
   git clone https://github.com/Traves-Theberge/opencode-mcp.git
   cd opencode-mcp
   npm install
   npm run build
   ```

## Configuration

### Method 1: Using CLI Command

Add the MCP server using the Codex CLI:

```bash
codex mcp add opencode -- node /path/to/opencode-mcp/dist/index.js
```

Set environment variables:

```bash
codex mcp add opencode \
  --env OPENCODE_SERVER_URL=http://localhost:4096 \
  --env OPENCODE_DEFAULT_PROJECT=/path/to/your/project \
  -- node /path/to/opencode-mcp/dist/index.js
```

Verify the configuration:

```bash
codex mcp list
```

### Method 2: Manual TOML Configuration

Edit `~/.codex/config.toml`:

```toml
[mcp_servers.opencode]
command = "node"
args = ["/path/to/opencode-mcp/dist/index.js"]

[mcp_servers.opencode.env]
OPENCODE_SERVER_URL = "http://localhost:4096"
OPENCODE_DEFAULT_PROJECT = "/path/to/your/project"
OPENCODE_LOG_LEVEL = "info"
```

> **Note:** Replace `/path/to/opencode-mcp` with the actual path where you cloned the repository.

### Project-Level Configuration

For project-specific configuration, create `.codex/config.toml` in your project root:

```toml
[mcp_servers.opencode]
command = "node"
args = ["/path/to/opencode-mcp/dist/index.js"]

[mcp_servers.opencode.env]
OPENCODE_SERVER_URL = "http://localhost:4096"
OPENCODE_DEFAULT_PROJECT = "."
```

## AGENTS.md Support

Codex CLI reads the `AGENTS.md` file from your project root for instructions. This file is included in the OpenCode MCP Server repository and provides:

- Tool usage guidelines
- When to use each tool
- Best practices for the MCP server

## Verification

1. Start OpenCode server:
   ```bash
   opencode serve
   ```

2. Launch Codex CLI:
   ```bash
   codex
   ```

3. Test with a simple prompt:
   ```
   Use opencode_run to list the files in the current directory
   ```

4. Check MCP server status:
   ```bash
   codex mcp list
   ```

## Usage Examples

### Basic Task Execution
```
Use opencode_run to implement a REST API endpoint for user authentication
```

### Code Review
```
Use opencode_agent_delegate with the plan agent to review the security of my auth module
```

### File Search
```
Use opencode_file_search to find all uses of the deprecated function
```

## Transport Limitations

Codex CLI currently only supports **stdio transport** for MCP servers. Remote MCP servers (HTTP/SSE) are not supported yet.

## Troubleshooting

### "MCP server not found"

1. Verify the path to `dist/index.js` is correct
2. Ensure Node.js is in your PATH
3. Check the config file syntax (valid TOML)

### "Cannot connect to OpenCode server"

1. Ensure OpenCode server is running:
   ```bash
   curl http://localhost:4096/health
   ```
2. Check `OPENCODE_SERVER_URL` environment variable
3. Verify firewall settings

### "Files created in wrong directory"

Set `OPENCODE_DEFAULT_PROJECT` to your project path:
```toml
[mcp_servers.opencode.env]
OPENCODE_DEFAULT_PROJECT = "/absolute/path/to/your/project"
```

### Debug Mode

Enable verbose logging:
```toml
[mcp_servers.opencode.env]
OPENCODE_LOG_LEVEL = "debug"
```

## Configuration Reference

| Setting | Description | Default |
|---------|-------------|---------|
| `command` | Command to run MCP server | Required |
| `args` | Arguments for the command | `[]` |
| `env.OPENCODE_SERVER_URL` | OpenCode server URL | `http://localhost:4096` |
| `env.OPENCODE_DEFAULT_PROJECT` | Default project directory | Required |
| `env.OPENCODE_TIMEOUT` | Request timeout (ms) | `120000` |
| `env.OPENCODE_LOG_LEVEL` | Log level | `info` |

## Related Documentation

- [Codex CLI Documentation](https://developers.openai.com/codex/cli)
- [Codex MCP Documentation](https://developers.openai.com/codex/mcp)
- [AGENTS.md](../../AGENTS.md) - Project instructions for Codex
