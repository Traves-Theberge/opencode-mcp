# Agent Guidelines for OpenCode MCP Server

This document provides guidelines for AI agents (Claude, Cursor, Windsurf, etc.) on how to effectively use the MCP tools provided by this server.

## Tool Categories

### Execution Tools (5)

#### `opencode_run`
The primary tool for coding tasks. Use for:
- Implementing features
- Refactoring code
- Debugging
- Code explanation
- Any software engineering task

**Best Practices:**
- Provide clear, specific prompts
- Include context about the codebase
- Specify the working directory when relevant
- Use `agent` parameter for specialized tasks (e.g., "plan" for analysis-only)

```json
{
  "prompt": "Implement a rate limiter middleware for Express.js with configurable window and limit",
  "workingDirectory": "/path/to/project",
  "agent": "build"
}
```

#### Session Tools
For multi-turn conversations:
- `opencode_session_create` - Start a new session
- `opencode_session_prompt` - Continue a session
- `opencode_session_list` - View active sessions
- `opencode_session_abort` - Stop a running session

**Use Cases:**
- Iterative development requiring context retention
- Complex refactoring with multiple steps
- Code review with follow-up questions

### File Tools (4)

#### `opencode_file_read`
Read file contents. Use for:
- Viewing source code
- Reading configuration files
- Checking documentation

#### `opencode_file_search`
Search text patterns in files (supports regex). Use for:
- Finding usages of functions/classes
- Searching for patterns across codebase
- Locating configuration values

#### `opencode_find_files`
Find files by name/pattern (fuzzy matching). Use for:
- Locating specific files
- Finding files by extension
- Discovering related files

#### `opencode_find_symbols`
Find workspace symbols (functions, classes, variables). Use for:
- Locating function definitions
- Finding class implementations
- Discovering variable declarations

### Config Tools (5)

#### `opencode_model_list`
List available models from configured providers.

#### `opencode_model_configure`
Configure model options. Persists to both runtime and config file.

**Common Options:**
- `reasoningEffort`: "low" | "medium" | "high"
- `maxTokens`: number
- `thinking`: { type: "enabled", budgetTokens: number }

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4",
  "options": {
    "reasoningEffort": "high",
    "maxTokens": 8192
  }
}
```

#### `opencode_provider_list`
List providers and their connection status.

#### `opencode_config_get`
Get current configuration (MCP-relevant settings only).

#### `opencode_config_update`
Update configuration settings. Persists to both runtime and config file.

```json
{
  "model": "anthropic/claude-sonnet-4",
  "smallModel": "anthropic/claude-3-5-haiku",
  "defaultAgent": "build"
}
```

### Agent Tools (2)

#### `opencode_agent_list`
List available agents (primary and subagents).

#### `opencode_agent_delegate`
Delegate a task to a specific agent. Use specialized agents for:
- `plan`: Analysis without changes, architecture review
- `explore`: Fast codebase exploration
- `build`: Implementation tasks

```json
{
  "agent": "plan",
  "prompt": "Review the authentication module for security issues",
  "workingDirectory": "/path/to/project"
}
```

### Skill Tools (2)

#### `opencode_skill_list`
List available skills from SKILL.md files.

#### `opencode_skill_create`
Create a new skill definition.

```json
{
  "name": "database-migrations",
  "description": "Patterns for creating database migrations",
  "content": "Guidelines for writing safe, reversible migrations...",
  "global": false
}
```

### MCP Management Tools (4)

#### `opencode_mcp_list`
List configured MCP servers and their status.

#### `opencode_mcp_add`
Add a new MCP server.

#### `opencode_mcp_remove`
Remove an MCP server.

#### `opencode_mcp_enable`
Enable or disable an MCP server.

### Tool Config (1)

#### `opencode_tool_list`
List all available tools (built-in and from MCP servers).

## Workflow Patterns

### 1. Code Implementation
```
1. Use opencode_find_files to locate relevant files
2. Use opencode_file_read to understand existing code
3. Use opencode_run to implement changes
4. Verify with opencode_file_read if needed
```

### 2. Codebase Exploration
```
1. Use opencode_agent_delegate with "explore" agent
2. Or use opencode_file_search to find patterns
3. Use opencode_find_symbols for specific definitions
```

### 3. Configuration Setup
```
1. Use opencode_provider_list to check providers
2. Use opencode_model_list to see available models
3. Use opencode_model_configure to set options
4. Use opencode_config_update to set defaults
```

### 4. Multi-step Refactoring
```
1. Use opencode_session_create to start a session
2. Use opencode_session_prompt for each step
3. Use opencode_session_abort if needed to stop
4. Sessions maintain context between prompts
```

## Error Handling

Tools return errors with actionable suggestions:

```json
{
  "error": "Session not found",
  "suggestions": [
    "Check that the session ID is correct",
    "Use opencode_session_list to see active sessions"
  ]
}
```

Always check the `suggestions` array for resolution steps.

## Best Practices

1. **Be Specific**: Provide clear, detailed prompts
2. **Use Working Directory**: Specify project path for file operations
3. **Choose Right Agent**: Use specialized agents for specific tasks
4. **Check Config First**: Use `opencode_config_get` to understand current state
5. **Handle Sessions**: Abort sessions that are no longer needed
6. **Persist Changes**: Config changes auto-persist, but verify with `opencode_config_get`
