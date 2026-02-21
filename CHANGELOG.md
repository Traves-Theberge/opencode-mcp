# Changelog

All notable changes to the OpenCode MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure and configuration
- TypeScript configuration with strict mode
- Vitest test framework setup with coverage thresholds (80%)
- ESLint configuration
- Package.json with latest dependencies:
  - @modelcontextprotocol/sdk v1.26.0
  - @opencode-ai/sdk v1.2.10
  - zod v4.3.6
  - vitest v4.0.18
  - typescript v5.9.3
- MIT LICENSE
- README with quick start guide
- Smoke tests for server, tools, and connection (18 tests passing)

### Changed
- Updated to use MCP SDK v1.26.0 API with Zod schemas
- Client wrapper now uses OpenCode SDK types directly

### Fixed
- Correct import paths in tool files
- Tool registration to use McpServer.tool() with Zod schemas

## [0.1.0] - TBD

### Added
- MCP server with stdio transport
- OpenCode SDK client wrapper with connection management
- P0 Execution tools:
  - `opencode_run` - Execute coding tasks through OpenCode
  - `opencode_session_create` - Create new sessions
  - `opencode_session_prompt` - Send prompts to sessions
  - `opencode_session_list` - List all sessions
  - `opencode_session_abort` - Abort running sessions
  - `opencode_session_share` - Share sessions
- P0 File tools:
  - `opencode_file_read` - Read project files
  - `opencode_file_search` - Search text in files
  - `opencode_find_files` - Find files by pattern
  - `opencode_find_symbols` - Find workspace symbols
  - `opencode_file_status` - Get git status
- P1 Config tools:
  - `opencode_model_list` - List available models
  - `opencode_provider_list` - List providers
  - `opencode_config_get` - Get configuration
- P1 Agent tools:
  - `opencode_agent_list` - List available agents
  - `opencode_agent_delegate` - Delegate tasks to agents
- Smoke tests for critical paths (18 tests)
- Documentation (README)

[Unreleased]: https://github.com/opencode-mcp/server/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/opencode-mcp/server/releases/tag/v0.1.0
