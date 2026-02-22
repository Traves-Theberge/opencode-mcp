# Changelog

All notable changes to the OpenCode MCP Server project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-02-22

### Added
- **Hybrid Config Persistence**: Config tools now use a hybrid approach for updates
  - API update for immediate runtime effect
  - File persistence to `opencode.json` for changes that survive server restart
  - Deep merge preserves existing config when adding new settings
- **Config Path Auto-Detection**: Automatically finds the correct `opencode.json` location
  - Priority: `OPENCODE_CONFIG_PATH` env > project local > global
  - Project local: `{workingDirectory}/.opencode/opencode.json`
  - Global: `~/.config/opencode/opencode.json`
- **New Environment Variable**: `OPENCODE_CONFIG_PATH` for explicit config file path override

### Changed
- `opencode_model_configure`: Now persists model options to both runtime and config file
- `opencode_config_update`: Now persists settings to both runtime and config file
- `opencode_config_get`: Now reads from config file (API doesn't return model/provider settings)
  - Returns only MCP-relevant config (no TUI keybinds, agent prompts, etc.)
  - Filters to: `model`, `small_model`, `default_agent`, `provider`
- Tool responses now include detailed info about both API and file persistence results

### Removed
- `opencode_file_status`: Removed (redundant - IDEs have built-in git integration)
- Removed TUI-specific options from config tools:
  - `opencode_config_update`: Removed `theme` and `autoupdate` parameters (TUI-only)
  - `opencode_config_get`: No longer returns TUI settings (keybinds, agent definitions, etc.)
- Removed `temperature` from examples (not a relevant model option for OpenCode)
- Tool count reduced from 29 to 28

### Documentation
- Updated README with hybrid config persistence feature
- Updated environment variables table with `OPENCODE_CONFIG_PATH`
- Added config path detection section
- Updated API docs for config tools with new response formats

## [0.2.1] - 2025-02-22

### Fixed
- **Project Directory Handling**: Files are now created in the correct project directory
  - Added `OPENCODE_DEFAULT_PROJECT` environment variable support
  - Directory is now set at SDK client level (not just session level)
  - This fixes the issue where files were created in MCP server directory instead of project

### Added
- **Project Directory Auto-Detection**: Automatically finds project root by searching for `.git`, `package.json`, etc.
- **Directory Source Reporting**: Tool responses now show where the directory came from (`explicit`, `env`, `detected`, `fallback`)
- **Session Directory Logging**: Debug logs show requested vs actual session directory

### Changed
- `workingDirectory` parameter is now optional (auto-detected if not specified)
- Updated MCP config examples to include `OPENCODE_DEFAULT_PROJECT`
- Improved Antigravity setup guide with correct config path (`~/.gemini/antigravity/mcp_config.json`)

## [0.2.0] - 2025-02-21

### Added
- **Tool Annotations**: MCP-compliant annotations for all 29 tools
  - `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
  - Presets: `readOnly`, `readOnlyExternal`, `writeLocal`, `writeExternal`, `create`
  - See `src/server/tools/schemas.ts` for definitions
- **Actionable Error Messages**: All errors now include specific suggestions
  - `createErrorResponse()` helper function with formatted output
  - 9 error suggestion categories: connection, session, file, skill, agent, auth, timeout, input, mcp
  - Errors guide users toward resolution with numbered steps
- **Output Schema Definitions**: Zod schemas for all tool responses
  - `RunOutputSchema`, `SessionCreateOutputSchema`, `AgentListOutputSchema`, etc.
  - Ready for future MCP output schema validation
- **Pagination Support**: Schema and helper for paginated list operations
  - `PaginationSchema` with limit, offset, cursor
  - `createPaginatedResponse()` helper function
- **Structured Logging**: Configurable log levels via environment variable
  - Levels: `debug`, `info`, `warn`, `error`, `none`
  - Timestamp support via `OPENCODE_LOG_TIMESTAMP`
  - All logs to stderr (doesn't interfere with MCP stdio)
  - See `src/utils/logger.ts` and [Logging Guide](docs/guides/LOGGING.md)
- **SDK Response Validation**: Zod validation for all OpenCode SDK responses
  - `validateWithSchema()` helper with graceful fallback
  - Validates sessions, agents, providers, files, prompts
- **Request Timeout Handling**: Configurable timeouts with proper cleanup
  - `withTimeout()` wrapper using AbortController
  - Configurable via `OPENCODE_TIMEOUT` environment variable
- **HTTP Transport Improvements**:
  - New `/api` endpoint with complete API documentation
  - Stateful session support via `/mcp/:sessionId`
  - `DELETE /mcp/:sessionId` for closing sessions
  - Session store with proper cleanup on server shutdown
  - Comprehensive JSDoc documentation for stateless vs stateful modes
- **Integration Tests**: 10 new tests for schemas and error handling
  - Tests for `createErrorResponse()` function
  - Tests for all 29 tool annotations
  - Tests for annotation presets

### Changed
- Improved all error messages to include actionable suggestions
- HTTP transport now properly manages session state with cleanup
- Client wrapper validates SDK responses with Zod (graceful fallback on validation failure)
- All tool handlers use new error response format with suggestions
- Updated tool registration to include annotations

### Fixed
- Import paths in integration tests
- Type safety in tool registration (using proper type assertions)

### Documentation
- Updated README with new features, environment variables, HTTP endpoints
- Added Tool Annotations Reference to API docs
- Added Error Response Format to API docs
- Added Logging Guide ([docs/guides/LOGGING.md](docs/guides/LOGGING.md))
- Added Error Handling Guide ([docs/guides/ERRORS.md](docs/guides/ERRORS.md))
- Updated Architecture docs with annotations and logging sections

## [0.1.0] - 2025-02-21

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
- Smoke tests for all tool categories (23 tests passing)
- Integration tests scaffold
- `.env.example` for environment configuration template
- `CONTRIBUTING.md` with development and contribution guidelines
- GitHub Actions CI/CD workflow with:
  - Build matrix for Node.js 18, 20, 22
  - TypeScript check, linting, smoke tests
  - Coverage report generation
  - Automated npm publish on version tags
  - GitHub release creation

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
- Contributing guidelines (docs/development/CONTRIBUTING.md)

### Changed
- Updated to use MCP SDK v1.26.0 API with Zod schemas
- Client wrapper now uses OpenCode SDK types directly
- Improved smoke tests to cover all 7 tool categories

### Fixed
- Correct import paths in tool files
- Tool registration to use McpServer.tool() with Zod schemas
- Removed TODO comment in files.ts, replaced with helpful guidance
- Added missing smoke tests for Skills, MCP, and ToolConfig categories

[0.2.0]: https://github.com/opencode-mcp/server/releases/tag/v0.2.0
[0.1.0]: https://github.com/opencode-mcp/server/releases/tag/v0.1.0
