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
  - express v5.0.0
  - cors v2.8.5
- MIT LICENSE
- README with quick start guide
- Smoke tests for server, tools, and connection (18 tests passing)
- Integration tests scaffold

### Added - Tools (29 total)
- **Execution Tools (6)**:
  - `opencode_run` - Execute coding tasks
  - `opencode_session_create` - Create sessions
  - `opencode_session_prompt` - Send prompts
  - `opencode_session_list` - List sessions
  - `opencode_session_abort` - Abort sessions
  - `opencode_session_share` - Share sessions
- **File Tools (5)**:
  - `opencode_file_read` - Read files
  - `opencode_file_search` - Search text in files
  - `opencode_find_files` - Find files by pattern
  - `opencode_find_symbols` - Find workspace symbols
  - `opencode_file_status` - Git status
- **Config Tools (6)**:
  - `opencode_model_list` - List models
  - `opencode_model_configure` - Configure models
  - `opencode_provider_list` - List providers
  - `opencode_config_get` - Get config
  - `opencode_config_update` - Update config
  - `opencode_auth_set` - Set authentication
- **Agent Tools (2)**:
  - `opencode_agent_list` - List agents
  - `opencode_agent_delegate` - Delegate to agents
- **Skill Tools (3)**:
  - `opencode_skill_list` - List skills
  - `opencode_skill_load` - Load skills
  - `opencode_skill_create` - Create skills
- **MCP Tools (4)**:
  - `opencode_mcp_list` - List MCP servers
  - `opencode_mcp_add` - Add MCP servers
  - `opencode_mcp_remove` - Remove MCP servers
  - `opencode_mcp_enable` - Enable/disable MCP servers
- **Tool Config Tools (3)**:
  - `opencode_tool_list` - List tools
  - `opencode_tool_configure` - Configure tools
  - `opencode_permission_set` - Set permissions

### Added - Transports
- stdio transport (default) for local IDE integration
- HTTP transport with Streamable HTTP for remote access
- SSE support for streaming responses
- CORS configuration

### Added - Documentation
- API reference (docs/api/TOOLS.md)
- IDE setup guide (docs/guides/IDE_SETUP.md)
- Architecture documentation (docs/ARCHITECTURE.md)

### Changed
- Updated to use MCP SDK v1.26.0 API with Zod schemas
- Client wrapper now uses OpenCode SDK types directly

### Fixed
- Correct import paths in tool files
- Tool registration to use McpServer.tool() with Zod schemas

## [0.1.0] - TBD

First stable release.

[Unreleased]: https://github.com/opencode-mcp/server/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/opencode-mcp/server/releases/tag/v0.1.0
