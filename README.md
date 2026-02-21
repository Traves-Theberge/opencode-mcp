# OpenCode MCP Server

> MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@opencode-mcp/server.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

## Overview

OpenCode MCP Server allows any MCP-compatible client (Cursor, Windsurf, Claude Desktop, etc.) to delegate coding tasks to OpenCode as a subagent. This enables powerful multi-tool workflows where your primary AI assistant can call upon OpenCode for:

- Code implementation and refactoring
- File operations and search
- Code analysis and planning
- Multi-turn coding sessions
- Agent delegation (build, plan, custom agents)

## Features

- **Full OpenCode Integration**: Access all OpenCode capabilities via MCP tools
- **Session Management**: Create, manage, and share coding sessions
- **File Operations**: Read, search, and navigate project files
- **Model Management**: List and configure AI models
- **Agent Delegation**: Delegate tasks to specialized agents (build, plan, custom)
- **Dual Transport**: stdio (local) and HTTP (remote) support
- **Type-Safe**: Full TypeScript support with strict typing

## Quick Start

### Installation

```bash
# Using npx (recommended)
npx @opencode-mcp/server

# Or install globally
npm install -g @opencode-mcp/server
opencode-mcp
```

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

Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

## Prerequisites

1. **OpenCode installed**: [Install OpenCode](https://opencode.ai/docs/#install)
2. **OpenCode server running**: Start with `opencode serve` or the TUI
3. **API keys configured**: Set up your LLM provider keys in OpenCode

## Usage Examples

### Basic Task Execution

```
Use opencode_run to implement a React hook for fetching data with loading and error states
```

### Code Review

```
Use opencode_agent_delegate to have the plan agent review the authentication module
```

### File Search

```
Use opencode_file_search to find all uses of deprecated functions
```

## Available Tools

| Tool | Description |
|------|-------------|
| `opencode_run` | Execute a prompt through OpenCode |
| `opencode_session_create` | Create a new session |
| `opencode_session_prompt` | Send a prompt to a session |
| `opencode_session_list` | List all sessions |
| `opencode_file_read` | Read a file |
| `opencode_file_search` | Search text in files |
| `opencode_find_files` | Find files by name |
| `opencode_agent_list` | List available agents |
| `opencode_agent_delegate` | Delegate to a specific agent |
| `opencode_model_list` | List available models |
| `opencode_config_get` | Get configuration |

See [docs/api/TOOLS.md](docs/api/TOOLS.md) for complete tool reference.

## Development

```bash
# Clone the repository
git clone https://github.com/opencode-mcp/server.git
cd server

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run smoke tests
npm run test:smoke

# Build for production
npm run build
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and components
- [Getting Started](docs/GETTING_STARTED.md) - Detailed setup guide
- [API Reference](docs/api/TOOLS.md) - Complete tool documentation
- [Examples](docs/examples/) - Usage patterns and examples
- [Contributing](docs/development/CONTRIBUTING.md) - How to contribute

## Roadmap

- [x] Project structure and configuration
- [ ] MCP server foundation
- [ ] P0: Execution tools
- [ ] P0: File tools
- [ ] P1: Config and Model tools
- [ ] P1: Agent tools
- [ ] HTTP transport support
- [ ] Comprehensive documentation

## Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/development/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [OpenCode](https://opencode.ai) - The AI coding agent this server integrates
- [Model Context Protocol](https://modelcontextprotocol.io) - The protocol that makes this possible
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - The SDK used to build this server
