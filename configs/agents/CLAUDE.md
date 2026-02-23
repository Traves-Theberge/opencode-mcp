# OpenCode MCP Server

This is an MCP (Model Context Protocol) server that exposes OpenCode as a tool/subagent for IDEs and AI clients.

## Tech Stack

- TypeScript (strict mode enabled)
- Node.js 18+
- Vitest for testing
- Zod v4 for validation
- MCP Protocol

## Commands

```bash
npm run build       # Compile TypeScript
npm run lint        # Run ESLint
npm run typecheck   # Type check
npm run test:smoke  # Run smoke tests
npm run clean       # Remove dist/
```

## Available Tools (23)

### Execution
- `opencode_run` - Execute coding tasks
- `opencode_session_create/prompt/list/abort` - Session management

### Files
- `opencode_file_read/search` - Read & search files
- `opencode_find_files/symbols` - Find by name/symbol

### Config
- `opencode_model_list/configure` - Model management
- `opencode_provider_list` - Provider status
- `opencode_config_get/update` - Server config

### Agents
- `opencode_agent_list` - List agents
- `opencode_agent_delegate` - Delegate to agents

### Skills
- `opencode_skill_list/create` - Manage skills

### MCP
- `opencode_mcp_list/add/remove/enable` - MCP management

### Tools
- `opencode_tool_list` - List tools

## Tool Usage

### Run coding tasks
```
opencode_run({ prompt: "Implement X", workingDirectory: "/path" })
```

### Analyze without changes
```
opencode_agent_delegate({ agent: "plan", prompt: "Review X" })
```

### Explore codebase
```
opencode_agent_delegate({ agent: "explore", prompt: "Find Y" })
```

### Configure model
```
opencode_model_configure({ 
  provider: "opencode", 
  model: "big-pickle", 
  options: { reasoningEffort: "high" } 
})
```

## Agents

| Agent | Purpose |
|-------|---------|
| `build` | Implementation |
| `plan` | Analysis only |
| `explore` | Discovery |

## Model Options

- `reasoningEffort`: "low" | "medium" | "high"
- `maxTokens`: number
- `thinking`: { type: "enabled", budgetTokens: number }

## Decision Guide

| Need | Tool |
|------|------|
| Code | `opencode_run` |
| Analyze | `agent_delegate(agent="plan")` |
| Explore | `agent_delegate(agent="explore")` |
| Multi-step | Create session |
| Read | `file_read` |
| Search | `file_search` |
| Configure | `model_configure` |
