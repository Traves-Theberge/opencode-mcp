# OpenCode MCP Server Instructions

Instructions for GitHub Copilot when working with the OpenCode MCP Server.

## Project Overview

MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients.

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

## Usage Patterns

### For coding tasks
Use `opencode_run` with a clear prompt and working directory.

### For analysis only
Use `opencode_agent_delegate` with `agent: "plan"` for reviews without changes.

### For exploration
Use `opencode_agent_delegate` with `agent: "explore"` for fast discovery.

### For configuration
Use `opencode_model_configure` to set model options like reasoningEffort.

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
