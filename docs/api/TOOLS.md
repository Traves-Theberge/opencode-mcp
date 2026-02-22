# API Reference - Tools

Complete reference for all OpenCode MCP Server tools.

## Tool Summary

| Category | Count | Tools |
|----------|-------|-------|
| Execution | 6 | `opencode_run`, `opencode_session_*` |
| Files | 5 | `opencode_file_*`, `opencode_find_*` |
| Config | 6 | `opencode_model_*`, `opencode_config_*`, `opencode_auth_*` |
| Agents | 2 | `opencode_agent_*` |
| Skills | 3 | `opencode_skill_*` |
| MCP | 4 | `opencode_mcp_*` |
| Tools | 3 | `opencode_tool_*`, `opencode_permission_*` |
| **Total** | **29** | |

---

## Tool Annotations Reference

All tools include MCP-compliant annotations for LLM discoverability:

| Annotation | Description |
|------------|-------------|
| `readOnlyHint` | Tool only reads data, doesn't modify state |
| `destructiveHint` | Tool may perform destructive updates |
| `idempotentHint` | Multiple calls produce same result |
| `openWorldHint` | Tool interacts with external entities |

### Read-Only Tools (safe to call without side effects)

| Tool | readOnly | idempotent | openWorld |
|------|----------|------------|-----------|
| `opencode_session_list` | ✓ | ✓ | ✓ |
| `opencode_file_read` | ✓ | ✓ | ✓ |
| `opencode_file_search` | ✓ | ✓ | ✓ |
| `opencode_find_files` | ✓ | ✓ | ✓ |
| `opencode_find_symbols` | ✓ | ✓ | ✓ |
| `opencode_file_status` | ✓ | ✓ | ✓ |
| `opencode_model_list` | ✓ | ✓ | ✓ |
| `opencode_provider_list` | ✓ | ✓ | ✓ |
| `opencode_config_get` | ✓ | ✓ | ✓ |
| `opencode_agent_list` | ✓ | ✓ | ✓ |
| `opencode_skill_list` | ✓ | ✓ | ✓ |
| `opencode_skill_load` | ✓ | ✓ | ✓ |
| `opencode_mcp_list` | ✓ | ✓ | ✓ |
| `opencode_tool_list` | ✓ | ✓ | ✓ |

### Write Tools (modify state)

| Tool | destructive | openWorld | Notes |
|------|-------------|-----------|-------|
| `opencode_run` | ✓ | ✓ | Executes code changes |
| `opencode_session_create` | ✗ | ✓ | Creates new resource |
| `opencode_session_prompt` | ✓ | ✓ | May modify files |
| `opencode_session_abort` | ✓ | ✓ | Stops running session |
| `opencode_session_share` | ✗ | ✓ | Creates share link |
| `opencode_model_configure` | ✓ | ✓ | Changes model settings |
| `opencode_config_update` | ✓ | ✓ | Changes configuration |
| `opencode_auth_set` | ✓ | ✓ | Sets credentials |
| `opencode_agent_delegate` | ✓ | ✓ | May execute changes |
| `opencode_skill_create` | ✗ | ✓ | Creates new skill |
| `opencode_mcp_add` | ✗ | ✓ | Adds MCP server |
| `opencode_mcp_remove` | ✓ | ✓ | Removes MCP server |
| `opencode_mcp_enable` | ✓ | ✓ | Changes server state |
| `opencode_tool_configure` | ✓ | ✓ | Changes tool settings |
| `opencode_permission_set` | ✓ | ✓ | Changes permissions |

---

## Config Persistence

Config tools (`opencode_model_configure`, `opencode_config_update`) use a **hybrid persistence approach**:

### How It Works

1. **API Update** - Changes are sent to the OpenCode server for immediate effect
2. **File Persistence** - Changes are saved to `opencode.json` to survive server restarts

### Config Path Detection

The config file location is detected in this priority:

| Priority | Location | Description |
|----------|----------|-------------|
| 1 | `OPENCODE_CONFIG_PATH` env | Explicit override |
| 2 | `{workingDirectory}/.opencode/opencode.json` | Project local |
| 3 | `~/.config/opencode/opencode.json` | Global (default) |

### Deep Merge Behavior

Changes are deep-merged with existing config:

```json
// Existing config
{
  "model": "anthropic/claude-4",
  "provider": { "anthropic": { "models": { "claude-4": { "options": { "maxTokens": 2048 } } } } }
}

// After opencode_model_configure({ provider: "anthropic", model: "claude-4", options: { "reasoningEffort": "high" } })
{
  "model": "anthropic/claude-4",
  "provider": { "anthropic": { "models": { "claude-4": { "options": { "maxTokens": 2048, "reasoningEffort": "high" } } } } }
}
```

---

## Error Response Format

All tools return errors in a consistent format:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: <operation> failed.\n\nDetails: <error message>\n\nSuggestions:\n  1. <actionable suggestion>\n  2. <another suggestion>"
  }],
  "isError": true
}
```

This format helps LLMs understand what went wrong and how to fix it.

### Error Categories

| Category | When It Occurs | Example Suggestions |
|----------|----------------|---------------------|
| `connectionFailed` | Cannot reach OpenCode server | Start server, check URL |
| `sessionNotFound` | Invalid session ID | List sessions, create new |
| `fileNotFound` | File doesn't exist | Verify path, use find_files |
| `skillNotFound` | Skill doesn't exist | List skills, check spelling |
| `agentNotFound` | Agent doesn't exist | List agents, check spelling |
| `unauthorized` | Invalid credentials | Check API keys, run auth login |
| `timeout` | Operation took too long | Break into smaller tasks |
| `invalidInput` | Validation failed | Check types, required fields |
| `mcpError` | MCP server config issue | Check config, verify command |

---

## Execution Tools

### `opencode_run`

Execute a coding task through OpenCode AI agent.

**When to use**: Implementing features, refactoring, debugging, explaining code, or any software engineering task.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "prompt": "string (required) - The task or question for OpenCode",
  "workingDirectory": "string (required) - Project directory path (where files will be created/modified)",
  "model": "string (optional) - Model in format provider/model",
  "agent": "string (optional) - Agent to use: build, plan, or custom agent name",
  "files": "string[] (optional) - File paths to attach as context",
  "noReply": "boolean (optional) - Add context without triggering AI response"
}
```

**Example**:
```json
{
  "prompt": "Implement a React hook for fetching data with loading and error states",
  "workingDirectory": "/home/user/projects/my-app",
  "model": "anthropic/claude-sonnet-4",
  "files": ["src/hooks/useUser.ts"]
}
```

---

### `opencode_session_create`

Create a new OpenCode session for multi-turn conversations.

**Annotations**: `destructiveHint: false`, `openWorldHint: true`

**Input Schema**:
```json
{
  "workingDirectory": "string (required) - Project directory path",
  "title": "string (optional) - Session title",
  "model": "string (optional) - Model in format provider/model",
  "agent": "string (optional) - Agent to use"
}
```

**Returns**: `{ sessionId: string, title: string, workingDirectory: string }`

---

### `opencode_session_prompt`

Send a prompt to an existing session.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "sessionId": "string (required) - Session ID",
  "prompt": "string (required) - The message to send",
  "files": "string[] (optional) - File paths to attach",
  "noReply": "boolean (optional) - Add context without AI response"
}
```

---

### `opencode_session_list`

List all OpenCode sessions.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}` (no parameters)

---

### `opencode_session_abort`

Abort a running session.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "sessionId": "string (required) - Session ID"
}
```

---

### `opencode_session_share`

Share a session. Returns a shareable link.

**Annotations**: `destructiveHint: false`, `openWorldHint: true`

**Input Schema**:
```json
{
  "sessionId": "string (required) - Session ID"
}
```

**Returns**: `{ shareUrl: string }`

---

## File Tools

### `opencode_file_read`

Read a file from the project.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "path": "string (required) - File path relative to project root"
}
```

---

### `opencode_file_search`

Search for text pattern in project files.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "pattern": "string (required) - Search pattern (regex supported)",
  "directory": "string (optional) - Limit to directory"
}
```

---

### `opencode_find_files`

Find files and directories by name pattern.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "query": "string (required) - File name pattern (fuzzy match)",
  "type": "string (optional) - 'file' or 'directory'",
  "limit": "number (optional) - Max results (1-200)"
}
```

---

### `opencode_find_symbols`

Find workspace symbols (functions, classes, variables).

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "query": "string (required) - Symbol name to search for"
}
```

---

### `opencode_file_status`

Get git status for tracked files.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}` (no parameters)

---

## Config Tools

### `opencode_model_list`

List all available models from configured providers.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "provider": "string (optional) - Filter by provider ID",
  "refresh": "boolean (optional) - Refresh cache from models.dev"
}
```

---

### `opencode_model_configure`

Configure model options (reasoningEffort, maxTokens, thinking, etc.).

**Uses Hybrid Persistence**: Changes apply immediately to runtime AND are saved to `opencode.json`.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "provider": "string (required) - Provider ID",
  "model": "string (required) - Model ID",
  "options": "object (required) - Model options"
}
```

**Example**:
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4",
  "options": {
    "reasoningEffort": "high",
    "thinking": { "type": "enabled", "budgetTokens": 16000 }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Model claude-sonnet-4 configured for provider anthropic",
  "provider": "anthropic",
  "model": "claude-sonnet-4",
  "options": { "reasoningEffort": "high" },
  "api": { "updated": true },
  "file": {
    "path": "/home/user/.config/opencode/opencode.json",
    "persisted": true
  }
}
```

---

### `opencode_provider_list`

List all providers and their connection status.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}`

---

### `opencode_config_get`

Get current OpenCode configuration (MCP-relevant settings only).

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}`

**Response**:
```json
{
  "mcpServer": {
    "serverUrl": "http://localhost:4096",
    "autoStart": true,
    "timeout": 120000,
    "transport": "stdio",
    "defaultProject": "/path/to/project",
    "configPath": "/home/user/.config/opencode/opencode.json"
  },
  "openCode": {
    "model": "anthropic/claude-sonnet-4",
    "provider": { "anthropic": { "models": { ... } } }
  }
}
```

---

### `opencode_config_update`

Update OpenCode configuration settings.

**Uses Hybrid Persistence**: Changes apply immediately to runtime AND are saved to `opencode.json`.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "model": "string (optional) - Default model (provider/model format)",
  "smallModel": "string (optional) - Small model for lightweight tasks",
  "defaultAgent": "string (optional) - Default agent name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Configuration updated",
  "updates": { "model": "anthropic/claude-sonnet-4" },
  "api": { "updated": true },
  "file": {
    "path": "/home/user/.config/opencode/opencode.json",
    "persisted": true
  }
}
```

---

### `opencode_auth_set`

Set authentication credentials for a provider.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "provider": "string (required) - Provider ID",
  "type": "string (required) - 'api' or 'oauth'",
  "key": "string (optional) - API key (for api type)",
  "token": "string (optional) - OAuth token (for oauth type)"
}
```

---

## Agent Tools

### `opencode_agent_list`

List all available agents (primary and subagents).

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}`

**Returns**:
```json
{
  "primary": [{ "name": "build", "description": "...", "model": "..." }],
  "subagents": [{ "name": "explore", "description": "...", "model": "..." }]
}
```

---

### `opencode_agent_delegate`

Delegate a task to a specific agent.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "agent": "string (required) - Agent name (build, plan, explore, etc.)",
  "prompt": "string (required) - Task for the agent",
  "sessionId": "string (optional) - Session ID (creates new if not provided)",
  "model": "string (optional) - Model to use"
}
```

---

## Skill Tools

### `opencode_skill_list`

List all available skills from SKILL.md files.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}`

---

### `opencode_skill_load`

Load a skill and return its content.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "name": "string (required) - Skill name to load"
}
```

---

### `opencode_skill_create`

Create a new skill (SKILL.md file).

**Annotations**: `destructiveHint: false`, `openWorldHint: true`

**Input Schema**:
```json
{
  "name": "string (required) - Skill name (lowercase, hyphens only)",
  "description": "string (required) - When to use this skill",
  "content": "string (required) - Skill content/instructions",
  "global": "boolean (optional) - Create globally (default: project-local)"
}
```

---

## MCP Server Management Tools

### `opencode_mcp_list`

List all configured MCP servers.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**: `{}`

---

### `opencode_mcp_add`

Add a new MCP server.

**Annotations**: `destructiveHint: false`, `openWorldHint: true`

**Input Schema**:
```json
{
  "name": "string (required) - Unique server name",
  "type": "string (required) - 'local' or 'remote'",
  "command": "string[] (optional) - Command for local servers",
  "environment": "object (optional) - Environment variables",
  "url": "string (optional) - URL for remote servers",
  "headers": "object (optional) - Headers for remote servers",
  "enabled": "boolean (optional) - Enable on startup",
  "timeout": "number (optional) - Connection timeout in ms"
}
```

---

### `opencode_mcp_remove`

Remove an MCP server.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "name": "string (required) - Server name to remove"
}
```

---

### `opencode_mcp_enable`

Enable or disable an MCP server.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "name": "string (required) - Server name",
  "enabled": "boolean (required) - Enable or disable"
}
```

---

## Tool Configuration Tools

### `opencode_tool_list`

List all available tools.

**Annotations**: `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "provider": "string (optional) - Filter by provider",
  "model": "string (optional) - Filter by model"
}
```

---

### `opencode_tool_configure`

Enable or disable tools.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "tools": "object (required) - Tool name patterns and enabled state",
  "agent": "string (optional) - Apply to specific agent"
}
```

**Example**:
```json
{
  "tools": {
    "mymcp_*": false,
    "read": true,
    "bash": false
  }
}
```

---

### `opencode_permission_set`

Set permission level for a tool.

**Annotations**: `destructiveHint: true`, `openWorldHint: true`

**Input Schema**:
```json
{
  "tool": "string (required) - Tool name or pattern",
  "permission": "string (required) - 'allow', 'ask', or 'deny'",
  "agent": "string (optional) - Apply to specific agent"
}
```

**Permission Levels**:
- `allow`: Tool runs without user approval
- `ask`: User is prompted for approval before tool runs
- `deny`: Tool is disabled and cannot be used
