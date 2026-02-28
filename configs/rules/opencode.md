---
name: OpenCode MCP Server Rules
globs: "**/*"
description: Rules for using OpenCode MCP Server tools for coding tasks
---

# OpenCode MCP Server Rules

Rules for AI coding agents using the OpenCode MCP Server.

## Project Overview

MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients.

## Available Tools (21)

| Category | Tools |
|----------|-------|
| Execution | opencode_run, session_create, session_prompt, session_list, session_abort |
| Files | file_read, file_search, find_files, find_symbols |
| Config | model_list, model_configure, provider_list, config_get, config_update |
| Agents | agent_list, agent_delegate |
| Skills | skill_list, skill_create |
| MCP | mcp_list, mcp_enable |
| Tools | tool_list |

## Tool Usage

### Implementation
```
opencode_run({ prompt: "Task", workingDirectory: "/path" })
```

### Analysis Only
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

## Agents

- `build`: Implementation tasks
- `plan`: Analysis without changes
- `explore`: Fast discovery

## Model Options

- `reasoningEffort`: low | medium | high
- `maxTokens`: number
- `thinking`: { type: "enabled", budgetTokens: number }

## Decision Guide

```
Coding? → opencode_run
Analyzing? → agent_delegate(agent="plan")
Exploring? → agent_delegate(agent="explore")
Multi-step? → Create session
Complex? → reasoningEffort="high"
```
