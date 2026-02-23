# OpenCode MCP Server Configuration Files

This directory contains configuration files for various AI coding agents and IDEs.

## Root-Level Config Files

These files are automatically loaded by their respective tools:

| File | Format | Used By |
|------|--------|---------|
| `AGENTS.md` | Universal | Codex, Cursor, Gemini CLI, Claude Code, Windsurf, Zed, Cline, Roo Code |
| `CLAUDE.md` | Markdown | Claude Code |
| `.cursorrules` | Plain text | Cursor |
| `.windsurfrules` | Plain text | Windsurf |
| `.rules` | Plain text | Zed |
| `.clinerules/rules.md` | Markdown | Cline, Roo Code |
| `.continue/rules/opencode.md` | YAML+Markdown | Continue.dev |
| `.github/copilot-instructions.md` | Markdown | GitHub Copilot |
| `.claude/skills/opencode-mcp/SKILL.md` | Agent Skills | Claude Code, OpenCode |
| `skills/opencode-mcp/SKILL.md` | Agent Skills | OpenCode |

## Directory Structure

```
configs/
├── agents/
│   ├── AGENTS.md      # Universal agent format
│   └── CLAUDE.md      # Claude Code specific
├── skills/
│   └── opencode-mcp/SKILL.md       # Agent Skills format (agentskills.io spec)
├── rules/
│   ├── cursor.md      # Cursor/Windsurf/Zed rules
│   ├── continue.md    # Continue rules (YAML frontmatter)
│   ├── copilot-instructions.md  # GitHub Copilot
│   └── opencode.md    # OpenCode-specific rules
├── mcp/
│   ├── templates.md   # MCP config templates for all IDEs
│   ├── codex.toml     # Codex CLI config template
│   └── gemini.json    # Gemini CLI config template
└── README.md          # This file
```

## Supported IDEs/Tools

| Tool | Config File(s) | Notes |
|------|----------------|-------|
| **Codex CLI** | `~/.codex/config.toml`, `AGENTS.md` | Uses TOML format for MCP |
| **Gemini CLI** | `~/.gemini/settings.json`, `AGENTS.md` | JSON format, supports stdio/HTTP |
| **Cursor** | `.cursorrules`, `AGENTS.md` | Reads both |
| **Windsurf** | `.windsurfrules`, `AGENTS.md` | Reads both |
| **Claude Code** | `CLAUDE.md`, `.claude/skills/`, `AGENTS.md` | Skills in `.claude/skills/` |
| **OpenCode** | `AGENTS.md`, `skills/` | Skills in project or `~/.opencode/skills/` |
| **Zed** | `.rules`, `AGENTS.md` | Reads multiple formats |
| **Cline** | `.clinerules/`, `AGENTS.md` | Reads both |
| **Roo Code** | `.clinerules/`, `AGENTS.md` | Cline-compatible |
| **Continue.dev** | `.continue/rules/` | YAML frontmatter format |
| **GitHub Copilot** | `.github/copilot-instructions.md` | In `.github/` |
| **Antigravity** | `~/.gemini/antigravity/mcp_config.json` | JSON format |

## File Formats

### SKILL.md (agentskills.io)

YAML frontmatter + Markdown body:

```yaml
---
name: skill-name
description: When to use this skill (1-1024 chars)
license: MIT
metadata:
  author: your-name
  version: "1.0"
---

# Instructions...

## When to Use
- Task matching description

## How to Use
1. Step one
2. Step two
```

**Required fields:**
- `name` - 1-64 chars, lowercase, hyphens only, matches directory name
- `description` - 1-1024 chars, describes when to use

**Optional fields:**
- `license`
- `compatibility`
- `metadata`
- `allowed-tools`

### AGENTS.md

Universal format for AI agents. Plain markdown, no frontmatter.

```markdown
# Project Name

## Overview
Brief description...

## Tools
Tool usage instructions...

## Guidelines
Coding guidelines...
```

### CLAUDE.md

Claude Code specific format. Plain markdown.

```markdown
# Project Name

## Commands
- npm run dev
- npm test

## Code Style
Guidelines...
```

### .cursorrules / .windsurfrules / .rules

Plain text/markdown rules file at project root.

```markdown
# Project Rules

## Tech Stack
- TypeScript
- Node.js

## Guidelines
- Use strict mode
- Run tests before commit
```

### Continue Rules (.continue/rules/)

YAML frontmatter + Markdown:

```yaml
---
name: Rule Name
globs: "**/*.{ts,js}"
description: When to use
---

# Instructions...
```

## Installation

### Quick Install (All Files)

```bash
# Copy all root-level config files
cp configs/rules/cursor.md .cursorrules
cp configs/rules/cursor.md .windsurfrules
cp configs/rules/cursor.md .rules
cp configs/agents/AGENTS.md ./AGENTS.md
cp configs/agents/CLAUDE.md ./CLAUDE.md

# Create directories
mkdir -p .clinerules
mkdir -p .continue/rules
mkdir -p .github
mkdir -p .claude/skills/opencode-mcp
mkdir -p skills/opencode-mcp

# Copy files
cp configs/rules/cursor.md .clinerules/rules.md
cp configs/rules/continue.md .continue/rules/opencode.md
cp configs/rules/copilot-instructions.md .github/copilot-instructions.md
cp configs/skills/SKILL.md .claude/skills/opencode-mcp/
cp configs/skills/SKILL.md skills/opencode-mcp/
```

### Global Installation

For personal preferences across all projects:

```bash
# Claude Code global
mkdir -p ~/.claude/skills/opencode-mcp
cp configs/skills/SKILL.md ~/.claude/skills/opencode-mcp/

# Cline global
mkdir -p ~/.clinerules
cp configs/rules/cursor.md ~/.clinerules/rules.md

# Claude Code global CLAUDE.md
cp configs/agents/CLAUDE.md ~/.claude/CLAUDE.md
```

## Validation

Validate SKILL.md files:

```bash
npx skills-ref validate ./skills/opencode-mcp
```

## Resources

- [Agent Skills Spec](https://agentskills.io/specification)
- [CLAUDE.md Guide](https://www.claudedirectory.org/blog/claude-md-guide)
- [AGENTS.md Spec](https://github.com/agentskills/AGENTS.md)
- [Continue Rules](https://docs.continue.dev/customize/rules)
- [Cline Rules](https://docs.cline.bot/customization/cline-rules)
- [Zed Rules](https://zed.dev/docs/ai/rules)
- [GitHub Copilot Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)
