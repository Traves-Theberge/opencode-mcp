# OpenCode MCP Server

> MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@opencode-mcp/server.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

## Overview

OpenCode MCP Server allows any MCP-compatible client (Cursor, Windsurf, Claude Desktop, etc.) to delegate coding tasks to OpenCode as a subagent. This enables powerful multi-tool workflows where your primary AI assistant can call upon OpenCode for:

- Code implementation and refactoring
- File operations and search
- Code analysis and planning
- Multi-turn coding sessions
- Agent delegation (build, plan, custom agents)
- Model and provider management
- Skill discovery and creation
- Sub-MCP server management

## Features

- **Full OpenCode Integration**: Access all OpenCode capabilities via MCP tools
- **29 Tools**: Complete toolset for coding, config, agents, skills, and MCP management
- **Dual Transport**: stdio (local) and HTTP (remote) support
- **Type-Safe**: Full TypeScript support with Zod validation
- **Session Management**: Create, manage, and share coding sessions
- **Agent Delegation**: Delegate tasks to specialized agents (build, plan, explore)
- **Skill System**: Discover and create reusable skill definitions
- **MCP Management**: Dynamically add/remove MCP servers

## Quick Start

### Installation

```bash
# Using npx (recommended)
npx @opencode-mcp/server

# Or install globally
npm install -g @opencode-mcp/server
opencode-mcp
```

### Prerequisites

1. **OpenCode installed**: [Install OpenCode](https://opencode.ai/docs/#install)
2. **OpenCode server running**: Start with `opencode serve` or the TUI
3. **API keys configured**: Set up your LLM provider keys in OpenCode

### Configure in Cursor

Add to your Cursor settings (`~/.cursor/mcp.json`):

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

### Configure in Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

## Available Tools (29)

### Execution (6)
| Tool | Description |
|------|-------------|
| `opencode_run` | Execute a coding task through OpenCode |
| `opencode_session_create` | Create a new session |
| `opencode_session_prompt` | Send a prompt to a session |
| `opencode_session_list` | List all sessions |
| `opencode_session_abort` | Abort a running session |
| `opencode_session_share` | Share a session |

### Files (5)
| Tool | Description |
|------|-------------|
| `opencode_file_read` | Read a file from the project |
| `opencode_file_search` | Search text in files |
| `opencode_find_files` | Find files by name/pattern |
| `opencode_find_symbols` | Find workspace symbols |
| `opencode_file_status` | Get git status |

### Config (6)
| Tool | Description |
|------|-------------|
| `opencode_model_list` | List available models |
| `opencode_model_configure` | Configure model options |
| `opencode_provider_list` | List providers |
| `opencode_config_get` | Get configuration |
| `opencode_config_update` | Update configuration |
| `opencode_auth_set` | Set authentication |

### Agents (2)
| Tool | Description |
|------|-------------|
| `opencode_agent_list` | List available agents |
| `opencode_agent_delegate` | Delegate to an agent |

### Skills (3)
| Tool | Description |
|------|-------------|
| `opencode_skill_list` | List available skills |
| `opencode_skill_load` | Load a skill |
| `opencode_skill_create` | Create a skill |

### MCP Management (4)
| Tool | Description |
|------|-------------|
| `opencode_mcp_list` | List MCP servers |
| `opencode_mcp_add` | Add an MCP server |
| `opencode_mcp_remove` | Remove an MCP server |
| `opencode_mcp_enable` | Enable/disable MCP server |

### Tool Config (3)
| Tool | Description |
|------|-------------|
| `opencode_tool_list` | List all tools |
| `opencode_tool_configure` | Enable/disable tools |
| `opencode_permission_set` | Set tool permissions |

## Usage Examples

### Basic Task Execution
```
Use opencode_run to implement a React hook for fetching data with loading and error states
```

### Code Review with Planning Agent
```
Use opencode_agent_delegate to have the plan agent review the authentication module for security issues
```

### File Search
```
Use opencode_file_search to find all uses of deprecated functions
```

### Model Configuration
```
Use opencode_model_configure to set reasoningEffort to high for deep thinking tasks
```

### Create a Skill
```
Use opencode_skill_create to create a skill for database migration patterns
```

## Transport Modes

### stdio (Default)
- Best for local IDE integration
- Single client connection
- No configuration needed

### HTTP
- Best for remote access
- Multiple clients
- Configure with environment variables:

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npx @opencode-mcp/server
```

**Endpoints**:
- `GET /health` - Health check
- `POST /mcp` - MCP requests
- `GET /mcp` - SSE streaming

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_SERVER_URL` | `http://localhost:4096` | OpenCode server URL |
| `OPENCODE_AUTO_START` | `true` | Auto-start OpenCode |
| `OPENCODE_DEFAULT_MODEL` | - | Default model |
| `OPENCODE_TIMEOUT` | `120000` | Timeout in ms |
| `MCP_TRANSPORT` | `stdio` | Transport mode |
| `MCP_HTTP_PORT` | `3000` | HTTP port |
| `MCP_CORS_ORIGINS` | `*` | CORS origins |

## Development

```bash
# Clone and install
git clone https://github.com/opencode-mcp/server.git
cd server
npm install

# Run in dev mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Documentation

- [API Reference](docs/api/TOOLS.md) - Complete tool documentation
- [IDE Setup Guide](docs/guides/IDE_SETUP.md) - Configure your IDE
- [Architecture](docs/ARCHITECTURE.md) - System design

## Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/development/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenCode](https://opencode.ai) - The AI coding agent this server integrates
- [Model Context Protocol](https://modelcontextprotocol.io) - The protocol that makes this possible
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - The SDK used to build this server
