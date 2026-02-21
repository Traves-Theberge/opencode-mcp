# Contributing to OpenCode MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Be respectful and inclusive. We welcome contributions from everyone.

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+
- OpenCode installed (for integration testing)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/opencode-mcp/server.git
cd server

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables as needed

3. Ensure OpenCode server is running for integration tests:
   ```bash
   opencode serve
   ```

## Project Structure

```
opencode-mcp/
├── src/
│   ├── index.ts              # Entry point
│   ├── client/               # OpenCode SDK client wrapper
│   ├── server/
│   │   ├── mcp.ts            # MCP server implementation
│   │   ├── tools/            # Tool implementations
│   │   └── transports/       # Transport implementations
│   └── utils/                # Utilities and types
├── tests/
│   ├── smoke/                # Critical path tests
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docs/                     # Documentation
└── dist/                     # Compiled output
```

## Making Changes

### Adding a New Tool

1. Create a new file in `src/server/tools/` or add to an existing category
2. Define the input schema with Zod
3. Create the tool handler
4. Add tool definition for documentation
5. Register the tool in `src/server/tools/index.ts`
6. Add tests in `tests/smoke/tools.test.ts`
7. Document in `docs/api/TOOLS.md`

Example:

```typescript
// src/server/tools/my-tool.ts
import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';

export const INPUT_SCHEMAS = {
  MyToolInputSchema: {
    param: z.string().describe('Parameter description'),
  },
};

export function getMyToolDefinitions() {
  return [{
    name: 'opencode_my_tool',
    description: 'What this tool does',
    inputSchema: { type: 'object', properties: { param: { type: 'string' } } },
  }];
}

export function createMyToolHandlers(client: OpenCodeClient) {
  return {
    async opencode_my_tool(params: { param: string }) {
      try {
        const result = await client.doSomething(params.param);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}
```

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Linting

```bash
# Check for issues
npm run lint

# TypeScript check
npm run typecheck
```

## Testing

### Test Categories

| Category | Purpose | Command |
|----------|---------|---------|
| Smoke | Critical path validation | `npm run test:smoke` |
| Unit | Individual function tests | `npm run test:unit` |
| Integration | Real server tests | `npm run test:integration` |
| Coverage | Coverage report | `npm run test:coverage` |

### Writing Tests

```typescript
import { describe, test, expect } from 'vitest';

describe('My Tool', () => {
  test('should handle valid input', async () => {
    // Arrange
    const input = { param: 'test' };
    
    // Act
    const result = await handler.opencode_my_tool(input);
    
    // Assert
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeUndefined();
  });
  
  test('should handle errors gracefully', async () => {
    const result = await handler.opencode_my_tool({ param: '' });
    expect(result.isError).toBe(true);
  });
});
```

### Test Requirements

- All new features must have tests
- Smoke tests must pass for any release
- Aim for 80%+ code coverage
- Mock external dependencies in unit tests

## Commit Guidelines

### Commit Format

```
type(scope): description

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Build, config, dependencies |
| `perf` | Performance improvement |

### Examples

```
feat(tools): add opencode_skill_create tool

- Validates skill name format
- Creates SKILL.md file with frontmatter
- Supports global and project-local skills

Closes #42
```

## Pull Request Process

1. **Fork and Branch**
   - Fork the repository
   - Create a feature branch from `main`
   - Use descriptive branch names: `feat/add-skill-tools`

2. **Make Changes**
   - Follow code style guidelines
   - Add/update tests
   - Update documentation
   - Update CHANGELOG.md

3. **Verify**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

4. **Submit PR**
   - Provide clear description
   - Reference related issues
   - Ensure CI passes

5. **Review**
   - Respond to feedback
   - Make requested changes
   - Keep commits clean

### PR Checklist

- [ ] Code follows project style
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Commit messages follow guidelines
- [ ] No new TypeScript errors
- [ ] Build succeeds

## Questions?

- Open an issue for bugs or feature requests
- Join our [Discord](https://opencode.ai/discord) for discussions
- Check existing issues before creating new ones

Thank you for contributing! 🎉
