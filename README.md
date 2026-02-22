# OpenCode MCP Server

> MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@opencode-mcp/server.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-4.0-purple.svg)](https://zod.dev/)

## Overview

OpenCode MCP Server allows any MCP-compatible client (Cursor, Windsurf, Claude Desktop, Claude Code, Opencode, Antigravity, Zed, etc.) to delegate coding tasks to OpenCode as a subagent. This enables powerful multi-tool workflows where your primary AI assistant can call upon OpenCode for:

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
- **Hybrid Config Persistence**: Config changes apply immediately AND persist to `opencode.json`
- **Tool Annotations**: MCP-compliant annotations for better LLM discoverability
- **Dual Transport**: stdio (local) and HTTP (remote) with stateless/stateful modes
- **Type-Safe**: Full TypeScript support with Zod v4 validation
- **Actionable Errors**: Error messages include specific suggestions for resolution
- **Request Timeouts**: Configurable timeout handling with proper cleanup
- **Structured Logging**: Debug, info, warn, error levels via environment variable
- **Session Management**: Create, manage, and share coding sessions
- **Agent Delegation**: Delegate tasks to specialized agents (build, plan, explore)
- **Skill System**: Discover and create reusable skill definitions
- **MCP Management**: Dynamically add/remove MCP servers

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Traves-Theberge/opencode-mcp.git
cd opencode-mcp

# Install dependencies and build
npm install
npm run build
```

### Prerequisites

1. **OpenCode installed**: [Install OpenCode](https://opencode.ai/docs/#install)
2. **OpenCode server running**: Start with `opencode serve` or the TUI
3. **API keys configured**: Set up your LLM provider keys in OpenCode
4. **This MCP server built**: Run `npm run build` in the project directory

### Configure in Your IDE

OpenCode MCP Server works with all major AI-enabled IDEs:

| IDE | Config File | Setup Guide |
|-----|-------------|-------------|
| [Antigravity](docs/setup-guides/antigravity.md) | `~/.gemini/antigravity/mcp_config.json` | [Full Guide](docs/setup-guides/antigravity.md) |
| [Cursor](docs/setup-guides/cursor.md) | `~/.cursor/mcp.json` | [Full Guide](docs/setup-guides/cursor.md) |
| [Windsurf](docs/setup-guides/windsurf.md) | `~/.codeium/windsurf/mcp_config.json` | [Full Guide](docs/setup-guides/windsurf.md) |
| [Claude Desktop](docs/setup-guides/claude-desktop.md) | `~/Library/Application Support/Claude/claude_desktop_config.json` | [Full Guide](docs/setup-guides/claude-desktop.md) |
| [VS Code (Copilot)](docs/setup-guides/vscode-copilot.md) | `.vscode/mcp.json` | [Full Guide](docs/setup-guides/vscode-copilot.md) |
| [Cline](docs/setup-guides/cline.md) | `cline_mcp_settings.json` | [Full Guide](docs/setup-guides/cline.md) |
| [Continue.dev](docs/setup-guides/continue.md) | `.continue/mcpServers/` | [Full Guide](docs/setup-guides/continue.md) |
| [Zed](docs/setup-guides/zed.md) | `~/.config/zed/settings.json` | [Full Guide](docs/setup-guides/zed.md) |
| [OpenCode](docs/setup-guides/opencode.md) | `opencode.json` | [Full Guide](docs/setup-guides/opencode.md) |

### Quick Config (Antigravity)

Add to `~/.gemini/antigravity/mcp_config.json`:

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

> **Note:** Replace `/path/to/opencode-mcp` with the actual path where you cloned the repository.

### Quick Config (Cursor)

Add to `~/.cursor/mcp.json`:

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

### Quick Config (Claude Desktop)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

See [docs/setup-guides/](docs/setup-guides/) for complete setup instructions for all supported IDEs.

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
- Best for remote access and multiple clients
- Supports stateless and stateful sessions
- Configure with environment variables:

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npx @opencode-mcp/server
```

**Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api` | GET | API documentation |
| `/mcp` | POST | Stateless MCP requests |
| `/mcp` | GET | SSE streaming (stateless) |
| `/mcp/:sessionId` | POST | Stateful MCP requests |
| `/mcp/:sessionId` | GET | SSE streaming (stateful) |
| `/mcp/:sessionId` | DELETE | Close stateful session |

**Modes**:
- **Stateless** (default): No session state between requests, better for scaling
- **Stateful**: Session state maintained via sessionId, required for multi-turn context

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_SERVER_URL` | `http://localhost:4096` | OpenCode server URL |
| `OPENCODE_AUTO_START` | `true` | Auto-start OpenCode |
| `OPENCODE_DEFAULT_MODEL` | - | Default model |
| `OPENCODE_TIMEOUT` | `120000` | Request timeout in ms |
| `OPENCODE_DEFAULT_PROJECT` | - | Default project directory (used when workingDirectory not specified) |
| `OPENCODE_CONFIG_PATH` | auto-detected | Path to opencode.json for config persistence |
| `OPENCODE_LOG_LEVEL` | `info` | Log level (debug, info, warn, error, none) |
| `OPENCODE_LOG_TIMESTAMP` | `false` | Include timestamps in logs |
| `MCP_TRANSPORT` | `stdio` | Transport mode (stdio or http) |
| `MCP_HTTP_PORT` | `3000` | HTTP port |
| `MCP_CORS_ORIGINS` | `*` | CORS origins (comma-separated, restrict in production) |

## Config Persistence

Config tools (`opencode_model_configure`, `opencode_config_update`) use a **hybrid approach**:

1. **API Update** - Changes apply immediately to the running OpenCode server
2. **File Persistence** - Changes are saved to `opencode.json` for persistence across restarts

### Config Path Detection

The config file location is auto-detected in this priority:

1. **`OPENCODE_CONFIG_PATH`** environment variable (explicit override)
2. **Project local**: `{workingDirectory}/.opencode/opencode.json`
3. **Global**: `~/.config/opencode/opencode.json`

Changes are deep-merged with existing config, preserving other settings.

## Project Directory Detection

OpenCode MCP Server uses this priority to determine the working directory:

1. **Explicit `workingDirectory` parameter** - passed in tool call
2. **`OPENCODE_DEFAULT_PROJECT` environment variable** - set in MCP config
3. **Auto-detection** - searches for `.git`, `package.json`, etc. from current directory
4. **Fallback** - current working directory of MCP server process

**Recommended:** Set `OPENCODE_DEFAULT_PROJECT` in your MCP config to avoid specifying the directory every time:

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

## Error Handling

All tools return errors in a consistent format with actionable suggestions:

```
Error: <operation> failed.

Details: <error message>

Suggestions:
  1. <actionable suggestion>
  2. <another suggestion>
```

See [Error Handling Guide](docs/guides/ERRORS.md) for details.

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

# Run linting
npm run lint

# Build
npm run build
```

## Security

OpenCode MCP Server is designed with security in mind:

- **stdio transport (default)**: Local-only access, requires system access
- **No credential storage**: API keys managed by OpenCode, not MCP server
- **Input validation**: All inputs validated with Zod schemas
- **CORS configurable**: Restrict origins for HTTP transport
- **Request limits**: Configurable body size limits and timeouts

For production deployments with HTTP transport, see the [Security Guide](docs/guides/SECURITY.md).

## Documentation

- [API Reference](docs/api/TOOLS.md) - Complete tool documentation with annotations
- [IDE Setup Guide](docs/guides/IDE_SETUP.md) - Configure your IDE
- [Logging Guide](docs/guides/LOGGING.md) - Configure logging levels
- [Error Handling Guide](docs/guides/ERRORS.md) - Error format and categories
- [Security Guide](docs/guides/SECURITY.md) - Security considerations and best practices
- [Architecture](docs/ARCHITECTURE.md) - System design

## Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/development/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenCode](https://opencode.ai) - The AI coding agent this server integrates
- [Model Context Protocol](https://modelcontextprotocol.io) - The protocol that makes this possible
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - The SDK used to build this server
