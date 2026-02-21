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
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Correct import paths in tool files

## [0.1.0] - TBD

### Added
- MCP server with stdio transport
- OpenCode SDK client wrapper
- P0 Execution tools (`opencode_run`, session tools)
- P0 File tools (read, search, find)
- P1 Config and Model tools
- P1 Agent tools (list, delegate)
- Smoke tests for critical paths
- Unit and integration tests
- Documentation (README, API reference, setup guides)

[Unreleased]: https://github.com/opencode-mcp/server/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/opencode-mcp/server/releases/tag/v0.1.0
