# Gemini CLI Setup Guide

Setup guide for Google's Gemini CLI.

## Overview

Gemini CLI is Google's command-line AI assistant powered by Gemini models. It supports MCP servers via stdio and HTTP transports, and reads project instructions from `AGENTS.md`.

## Prerequisites

1. **Gemini CLI installed**:
   ```bash
   npm install -g @anthropic-ai/gemini-cli
   # or
   npm install -g @google/gemini-cli
   ```

2. **Gemini API key configured**:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
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

Add the MCP server using the Gemini CLI:

```bash
gemini mcp add opencode -- node /path/to/opencode-mcp/dist/index.js
```

With environment variables:

```bash
gemini mcp add opencode \
  --env OPENCODE_SERVER_URL=http://localhost:4096 \
  --env OPENCODE_DEFAULT_PROJECT=/path/to/your/project \
  -- node /path/to/opencode-mcp/dist/index.js
```

Verify the configuration:

```bash
gemini mcp list
```

### Method 2: Manual JSON Configuration

**Global Configuration** (`~/.gemini/settings.json`):

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
      }
    }
  }
}
```

> **Note:** Replace `/path/to/opencode-mcp` with the actual path where you cloned the repository.

**Project-Level Configuration** (`.gemini/settings.json` in project root):

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "."
      }
    }
  }
}
```

### Method 3: HTTP Transport

If running the MCP server with HTTP transport:

```bash
# Start MCP server with HTTP transport
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node /path/to/opencode-mcp/dist/index.js
```

Configure Gemini CLI:

```json
{
  "mcpServers": {
    "opencode": {
      "httpUrl": "http://localhost:3000/mcp"
    }
  }
}
```

Or using CLI:

```bash
gemini mcp add --transport http opencode http://localhost:3000/mcp
```

## AGENTS.md Support

Gemini CLI reads the `AGENTS.md` file from your project root for instructions. This file is included in the OpenCode MCP Server repository and provides:

- Tool usage guidelines
- When to use each tool
- Best practices for the MCP server

## Verification

1. Start OpenCode server:
   ```bash
   opencode serve
   ```

2. Launch Gemini CLI:
   ```bash
   gemini
   ```

3. Check MCP server status:
   ```
   /mcp
   ```

4. Test with a simple prompt:
   ```
   Use opencode_run to list the files in the current directory
   ```

## Usage Examples

### Basic Task Execution
```
Use opencode_run to implement a React hook for fetching data
```

### Code Review
```
Use opencode_agent_delegate with the plan agent to review my authentication module
```

### File Search
```
Use opencode_file_search to find all uses of deprecated functions
```

### Model Configuration
```
Use opencode_model_configure to set reasoningEffort to high
```

## Transport Options

| Transport | Use Case | Configuration |
|-----------|----------|---------------|
| stdio | Local development | `"command": "node", "args": [...]` |
| HTTP | Remote access, multiple clients | `"httpUrl": "http://..."` |

## Troubleshooting

### "MCP server not connecting"

1. Check the configuration file path:
   - Global: `~/.gemini/settings.json`
   - Project: `.gemini/settings.json`
2. Verify JSON syntax is valid
3. Check Node.js path is correct

### "Cannot connect to OpenCode server"

1. Ensure OpenCode server is running:
   ```bash
   curl http://localhost:4096/health
   ```
2. Verify `OPENCODE_SERVER_URL` matches
3. Check firewall settings

### "Files created in wrong directory"

Use absolute path for `OPENCODE_DEFAULT_PROJECT`:
```json
{
  "env": {
    "OPENCODE_DEFAULT_PROJECT": "/absolute/path/to/your/project"
  }
}
```

### Debug Mode

Enable verbose logging:
```json
{
  "env": {
    "OPENCODE_LOG_LEVEL": "debug"
  }
}
```

## Configuration Reference

| Setting | Description | Default |
|---------|-------------|---------|
| `command` | Command to run MCP server | Required (stdio) |
| `args` | Arguments for the command | `[]` |
| `env` | Environment variables | `{}` |
| `httpUrl` | HTTP endpoint (HTTP transport) | Required (HTTP) |
| `timeout` | Connection timeout (ms) | `30000` |
| `cwd` | Working directory | Project root |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_SERVER_URL` | OpenCode server URL | `http://localhost:4096` |
| `OPENCODE_DEFAULT_PROJECT` | Default project directory | Required |
| `OPENCODE_TIMEOUT` | Request timeout (ms) | `120000` |
| `OPENCODE_LOG_LEVEL` | Log level | `info` |
| `OPENCODE_LOG_TIMESTAMP` | Include timestamps | `false` |

## MCP Commands

Gemini CLI provides several MCP-related commands:

| Command | Description |
|---------|-------------|
| `/mcp` | Show MCP server status and tools |
| `gemini mcp list` | List configured MCP servers |
| `gemini mcp add` | Add a new MCP server |
| `gemini mcp remove <name>` | Remove an MCP server |

## Related Documentation

- [Gemini CLI Documentation](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI MCP Guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- [AGENTS.md](../../AGENTS.md) - Project instructions for Gemini CLI
