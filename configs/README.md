# OpenCode MCP Server Configuration Files

This directory contains configuration files for various AI coding agents and IDEs.

## Directory Structure

```
configs/
├── agents/
│   ├── AGENTS.md      # Universal agent format (Codex, Cursor, Gemini CLI, etc.)
│   └── CLAUDE.md      # Claude Code specific
├── skills/
│   └── SKILL.md       # Agent Skills format (agentskills.io spec)
├── rules/
│   ├── cursor.md      # Cursor rules
│   ├── continue.md    # Continue.dev rules
│   └── copilot-instructions.md  # GitHub Copilot
└── mcp/
    └── templates.md   # MCP config templates for IDEs
```

## File Formats

### SKILL.md (agentskills.io)

YAML frontmatter + Markdown body:

```yaml
---
name: skill-name
description: When to use this skill
---

# Instructions...
```

**Required fields:**
- `name` - 1-64 chars, lowercase, hyphens only
- `description` - 1-1024 chars, describes when to use

**Optional fields:**
- `license`
- `compatibility`
- `metadata`
- `allowed-tools`

### AGENTS.md

Universal format for AI agents. Plain markdown, no frontmatter.

Supported by: Codex, Cursor, Gemini CLI, Claude Code, Windsurf, Zed, Cline, etc.

### CLAUDE.md

Claude Code specific format. Plain markdown, no frontmatter.

Locations:
- `~/.claude/CLAUDE.md` - Global
- `./CLAUDE.md` - Project
- `.claude/rules/` - Modular rules

### .cursorrules

Cursor rules file. Plain text/markdown at project root.

### .clinerules/

Cline rules directory. Supports:
- `.clinerules/rules.md`
- `.clinerules/` directory with .md files

Also reads: `.cursorrules`, `.windsurfrules`, `AGENTS.md`

### .continue/rules/

Continue rules with YAML frontmatter:

```yaml
---
name: Rule Name
globs: "**/*.{ts,js}"
description: When to use
---

# Instructions...
```

### .github/copilot-instructions.md

GitHub Copilot instructions. Plain markdown in `.github/` directory.

## Installation

### Copy to Project Root

```bash
# AGENTS.md (universal)
cp configs/agents/AGENTS.md ./

# CLAUDE.md (Claude Code)
cp configs/agents/CLAUDE.md ./

# .cursorrules (Cursor)
cp configs/rules/cursor.md .cursorrules

# Continue rules
mkdir -p .continue/rules
cp configs/rules/continue.md .continue/rules/opencode.md

# Copilot instructions
mkdir -p .github
cp configs/rules/copilot-instructions.md .github/copilot-instructions.md
```

### Copy Skills

```bash
# Project skills
mkdir -p .claude/skills/opencode-mcp
cp configs/skills/SKILL.md .claude/skills/opencode-mcp/

# Or global skills
mkdir -p ~/.claude/skills/opencode-mcp
cp configs/skills/SKILL.md ~/.claude/skills/opencode-mcp/
```

## Validation

Validate SKILL.md files:

```bash
npx skills-ref validate ./configs/sills
```

## Resources

- [Agent Skills Spec](https://agentskills.io/specification)
- [CLAUDE.md Guide](https://www.claudedirectory.org/blog/claude-md-guide)
- [AGENTS.md Spec](https://github.com/agentskills/AGENTS.md)
- [Continue Rules](https://docs.continue.dev/customize/rules)
- [Cline Rules](https://docs.cline.bot/customization/cline-rules)
