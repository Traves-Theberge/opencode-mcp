---
name: opencode-mcp-tools
description: Skills for using the OpenCode MCP Server tools. Use when working with OpenCode MCP tools for coding tasks, file operations, configuration, or agent delegation.
license: MIT
metadata:
  author: Traves-Theberge
  version: "1.0"
---

# OpenCode MCP Server Skills

Skills for using the OpenCode MCP Server to accomplish coding tasks through OpenCode.

## Available Tools

### Execution Tools
- `opencode_run` - Execute coding tasks through OpenCode
- `opencode_session_create` - Create a new multi-turn session
- `opencode_session_prompt` - Send a prompt to a session
- `opencode_session_list` - List all sessions
- `opencode_session_abort` - Abort a running session

### File Tools
- `opencode_file_read` - Read a file from the project
- `opencode_file_search` - Search text in files (regex support)
- `opencode_find_files` - Find files by name/pattern
- `opencode_find_symbols` - Find workspace symbols

### Config Tools
- `opencode_model_list` - List available models
- `opencode_model_configure` - Configure model options
- `opencode_provider_list` - List providers
- `opencode_config_get` - Get configuration
- `opencode_config_update` - Update configuration

### Agent Tools
- `opencode_agent_list` - List available agents
- `opencode_agent_delegate` - Delegate to an agent

### Skill Tools
- `opencode_skill_list` - List available skills
- `opencode_skill_create` - Create a skill

### MCP Tools
- `opencode_mcp_list` - List MCP servers
- `opencode_mcp_add` - Add an MCP server
- `opencode_mcp_remove` - Remove an MCP server
- `opencode_mcp_enable` - Enable/disable MCP server

### Tool Config
- `opencode_tool_list` - List all tools

## When to Use

### Use `opencode_run` when:
- Implementing features or refactoring
- Debugging code
- Code explanation
- Any coding task

### Use sessions when:
- Task requires multiple steps with context retention
- Iterative refinement needed
- Complex workflows

### Use `opencode_agent_delegate` when:
- `agent="plan"` - Analysis only, no code changes
- `agent="explore"` - Fast codebase exploration
- `agent="build"` - Implementation tasks

### Use config tools when:
- Checking available models
- Setting model options (reasoningEffort, maxTokens)
- Viewing or updating configuration

## Model Options

Common options for `opencode_model_configure`:

```json
{
  "reasoningEffort": "low" | "medium" | "high",
  "maxTokens": 8192,
  "thinking": { "type": "enabled", "budgetTokens": 16000 }
}
```

## Examples

### Run a coding task:
```json
opencode_run({
  "prompt": "Implement user authentication with JWT",
  "workingDirectory": "/project/path"
})
```

### Configure a model:
```json
opencode_model_configure({
  "provider": "opencode",
  "model": "big-pickle",
  "options": { "reasoningEffort": "high" }
})
```

### Delegate to plan agent:
```json
opencode_agent_delegate({
  "agent": "plan",
  "prompt": "Review the auth module for security issues",
  "workingDirectory": "/project/path"
})
```

## Decision Guide

| Task | Tool |
|------|------|
| Implement code | `opencode_run` |
| Analyze without changes | `opencode_agent_delegate(agent="plan")` |
| Explore codebase | `opencode_agent_delegate(agent="explore")` |
| Multi-step task | Create session |
| Read file | `opencode_file_read` |
| Search code | `opencode_file_search` |
| Find files | `opencode_find_files` |
| Configure model | `opencode_model_configure` |
