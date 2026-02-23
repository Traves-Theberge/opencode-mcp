# MCP Configuration Templates

Templates for configuring the OpenCode MCP Server in various IDEs.

## Antigravity

Location: `~/.gemini/antigravity/mcp_config.json`

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/project"
      }
    }
  }
}
```

## Cursor

Location: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/project"
      }
    }
  }
}
```

## Windsurf

Location: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/project"
      }
    }
  }
}
```

## Claude Desktop

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "opencode": {
      "command": "node",
      "args": ["/path/to/opencode-mcp/dist/index.js"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_DEFAULT_PROJECT": "/path/to/project"
      }
    }
  }
}
```

## Cline

Cline reads from multiple locations automatically:
- `.clinerules/` in project
- `.cursorrules` (compatible)
- `AGENTS.md` (compatible)

## Zed

Zed reads from multiple locations automatically:
- `.rules` in project
- `.cursorrules` (compatible)
- `AGENTS.md` (compatible)
- `CLAUDE.md` (compatible)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_SERVER_URL` | `http://localhost:4096` | OpenCode server URL |
| `OPENCODE_AUTO_START` | `true` | Auto-start OpenCode |
| `OPENCODE_DEFAULT_MODEL` | - | Default model |
| `OPENCODE_DEFAULT_PROJECT` | - | Project directory |
| `OPENCODE_CONFIG_PATH` | auto | Config file path |
| `OPENCODE_TIMEOUT` | `120000` | Request timeout (ms) |
| `OPENCODE_LOG_LEVEL` | `info` | Log level |
| `MCP_TRANSPORT` | `stdio` | Transport mode |
| `MCP_HTTP_PORT` | `3000` | HTTP port |
