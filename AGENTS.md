# OpenCode MCP Server

Agent instructions for working with this MCP server.

## Project Overview

This is an MCP (Model Context Protocol) server that exposes OpenCode as a tool/subagent for IDEs and AI clients. It provides 23 tools across 7 categories for coding tasks, file operations, configuration, and agent delegation.

## Tech Stack

- TypeScript (strict mode)
- Node.js 18+
- Vitest for testing
- Zod v4 for validation
- MCP Protocol

## Tool Categories

### Execution (5 tools)
- `opencode_run` - Execute coding tasks
- `opencode_session_create/prompt/list/abort` - Session management

### Files (4 tools)
- `opencode_file_read` - Read file contents
- `opencode_file_search` - Search text patterns
- `opencode_find_files` - Find by name/pattern
- `opencode_find_symbols` - Find symbols

### Config (5 tools)
- `opencode_model_list/configure` - Model management
- `opencode_provider_list` - Provider status
- `opencode_config_get/update` - Server config

### Agents (2 tools)
- `opencode_agent_list` - List agents
- `opencode_agent_delegate` - Delegate to agents (plan, explore, build)

### Skills (2 tools)
- `opencode_skill_list` - List skills
- `opencode_skill_create` - Create skills

### MCP (4 tools)
- `opencode_mcp_list/add/remove/enable` - MCP server management

### Tools (1 tool)
- `opencode_tool_list` - List all tools

## When to Use Each Tool

### Coding Tasks
```
opencode_run({ prompt: "Task description", workingDirectory: "/path" })
```

### Analysis Only (No Changes)
```
opencode_agent_delegate({ agent: "plan", prompt: "Review X" })
```

### Exploration
```
opencode_agent_delegate({ agent: "explore", prompt: "Find Y" })
```

### Configuration
```
opencode_model_configure({ provider, model, options: { reasoningEffort: "high" } })
```

## Agent Types

| Agent | Purpose |
|-------|---------|
| `build` | Implementation tasks |
| `plan` | Analysis without changes |
| `explore` | Fast codebase discovery |

## Model Options

```json
{
  "reasoningEffort": "low" | "medium" | "high",
  "maxTokens": 8192,
  "thinking": { "type": "enabled", "budgetTokens": 16000 }
}
```

## Decision Guide

| Need | Use |
|------|-----|
| Implement code | `opencode_run` |
| Analyze only | `agent_delegate(agent="plan")` |
| Explore codebase | `agent_delegate(agent="explore")` |
| Multi-step task | Create session |
| Read file | `file_read` |
| Search code | `file_search` |
| Configure | `model_configure` |
