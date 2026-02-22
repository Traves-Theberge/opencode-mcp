# Continue.dev Setup Guide

Complete guide to configure OpenCode MCP Server in Continue.dev.

## Overview

Continue.dev is an open-source AI code assistant extension for VS Code and JetBrains IDEs. It supports MCP servers through YAML configuration files.

**Official Docs**: [https://docs.continue.dev/features/model-context-protocol](https://docs.continue.dev/features/model-context-protocol)

## Prerequisites

- [Continue.dev Extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue) installed
- Node.js 18+ installed
- OpenCode server running (`opencode serve`)

## Configuration

### Method 1: Workspace Configuration

1. Create the MCP servers directory in your project:
   ```bash
   mkdir -p .continue/mcpServers
   ```

2. Create a YAML config file:
   ```bash
   touch .continue/mcpServers/opencode.yaml
   ```

3. Add configuration (see below)

### Method 2: User Configuration

Create configuration in your user directory:

**macOS/Linux:**
```bash
mkdir -p ~/.continue/mcpServers
touch ~/.continue/mcpServers/opencode.yaml
```

**Windows:**
```
%USERPROFILE%\.continue\mcpServers\opencode.yaml
```

## OpenCode Configuration

### YAML Configuration

Create `.continue/mcpServers/opencode.yaml`:

```yaml
name: OpenCode MCP Server
version: 0.1.0
schema: v1
mcpServers:
  - name: opencode
    command: npx
    args:
      - "-y"
      - "@opencode-mcp/server"
    env:
      OPENCODE_SERVER_URL: "http://localhost:4096"
```

### With Custom Model

```yaml
name: OpenCode MCP Server
version: 0.1.0
schema: v1
mcpServers:
  - name: opencode
    command: npx
    args:
      - "-y"
      - "@opencode-mcp/server"
    env:
      OPENCODE_SERVER_URL: "http://localhost:4096"
      OPENCODE_DEFAULT_MODEL: "anthropic/claude-sonnet-4"
      OPENCODE_TIMEOUT: "120000"
```

### HTTP Transport

```yaml
name: OpenCode MCP Server
version: 0.1.0
schema: v1
mcpServers:
  - name: opencode
    type: sse
    url: "http://localhost:3000/mcp"
```

### Multiple Servers

```yaml
name: Project MCP Servers
version: 0.1.0
schema: v1
mcpServers:
  - name: opencode
    command: npx
    args:
      - "-y"
      - "@opencode-mcp/server"
    env:
      OPENCODE_SERVER_URL: "http://localhost:4096"
  
  - name: filesystem
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/path/to/allowed/directory"
```

## Verification

1. Reload VS Code window
2. Open Continue.dev sidebar
3. Look for MCP tools in the tools dropdown
4. Verify OpenCode tools are available

## Usage

In Continue chat:

```
Use opencode_run to implement a rate limiter middleware for Express.js
```

```
Use opencode_agent_delegate to have the plan agent review the auth module
```

## Project Structure

```
your-project/
├── .continue/
│   └── mcpServers/
│       └── opencode.yaml
└── ...
```

## Troubleshooting

### Server Not Loading

```bash
# Check YAML syntax
cat .continue/mcpServers/opencode.yaml

# Test server manually
node /path/to/opencode-mcp/dist/index.js
```

### No Tools Available

1. Check YAML syntax is valid
2. Ensure paths are correct
3. Reload the IDE

### Connection Issues

```bash
# Verify OpenCode server
curl http://localhost:4096/health

# Start if not running
opencode serve
```

## Config File Locations

| Scope | Path |
|-------|------|
| User | `~/.continue/mcpServers/opencode.yaml` |
| Workspace | `.continue/mcpServers/opencode.yaml` |

## Full Example

```yaml
name: OpenCode MCP Server
version: 0.1.0
schema: v1
mcpServers:
  - name: opencode
    command: npx
    args:
      - "-y"
      - "@opencode-mcp/server"
    env:
      OPENCODE_SERVER_URL: "http://localhost:4096"
      OPENCODE_AUTO_START: "true"
      OPENCODE_TIMEOUT: "120000"
```

## Resources

- [Continue MCP Documentation](https://docs.continue.dev/features/model-context-protocol)
- [OpenCode Documentation](https://opencode.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io)
