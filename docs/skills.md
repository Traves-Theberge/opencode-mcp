# Skills Reference for OpenCode MCP Server

This document defines the skills (capabilities) expected in this codebase and how agents should approach tasks.

## Core Skills

### 1. TypeScript/Node.js Development

**When to use:** Any code implementation, refactoring, or debugging in this project.

**Guidelines:**
- Use TypeScript strict mode semantics
- Prefer explicit types over inference for public APIs
- Use Zod v4 for runtime validation
- Follow ESM module format with `.js` extensions in imports
- Handle errors with `createErrorResponse()` helper

**Example Patterns:**
```typescript
// Input schema with Zod v4
export const INPUT_SCHEMAS = {
  MyToolInputSchema: {
    path: z.string().min(1).describe('File path'),
    options: z.record(z.string(), z.unknown()).optional(),
  },
};

// Error handling pattern
try {
  // operation
} catch (error) {
  return createErrorResponse('Operation name', error, ERROR_SUGGESTIONS.connectionFailed);
}
```

### 2. MCP Tool Development

**When to use:** Adding new tools or modifying existing tool behavior.

**Guidelines:**
1. Define input schema in `INPUT_SCHEMAS` object
2. Add tool definition in `get*ToolDefinitions()` function
3. Add annotations in `TOOL_ANNOTATIONS` object
4. Implement handler in `create*Handlers()` function
5. Register tool in `src/server/tools/index.ts`
6. Update tests and documentation

**Tool Structure:**
```typescript
// 1. Schema
MyToolInputSchema: {
  param: z.string().describe('Description'),
},

// 2. Definition
{
  name: 'opencode_my_tool',
  description: 'What the tool does',
  inputSchema: { type: 'object', properties: { ... } },
},

// 3. Annotations
opencode_my_tool: ANNOTATIONS.readOnlyExternal,

// 4. Handler
async opencode_my_tool(params: { param: string }) {
  try {
    // Implementation
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return createErrorResponse('My tool', error, suggestions);
  }
},
```

### 3. Config Management

**When to use:** Managing configuration persistence and retrieval.

**Guidelines:**
- Use hybrid persistence: API update + file write
- Deep merge with existing config
- Auto-detect config path (env > project local > global)
- Only persist MCP-relevant settings

**Key Functions:**
- `detectConfigPath()` - Find opencode.json location
- `readOpenCodeConfig()` - Read existing config
- `writeOpenCodeConfig()` - Write with deep merge

### 4. Testing

**When to use:** Writing or modifying tests.

**Guidelines:**
- Smoke tests for basic functionality
- Integration tests for API interactions
- Update tool counts when adding/removing tools
- Mock external dependencies

**Test Structure:**
```typescript
describe('Tool Category', () => {
  test('tool has correct definition', async () => {
    const { getToolDefinitions } = await import('../../src/server/tools/category.js');
    const definitions = getToolDefinitions();
    expect(definitions.length).toBe(N);
    
    const tool = definitions.find(t => t.name === 'opencode_tool_name');
    expect(tool).toBeDefined();
  });
});
```

### 5. Documentation

**When to use:** Updating docs for new features or changes.

**Guidelines:**
- Update README.md tool tables and counts
- Update docs/api/TOOLS.md with new tools
- Update CHANGELOG.md with changes
- Keep descriptions concise but informative

## Task Breakdown Patterns

### Adding a New Tool

1. **Plan**: Define tool purpose, inputs, outputs
2. **Schema**: Create Zod input schema
3. **Definition**: Add tool definition with description
4. **Annotations**: Set appropriate MCP annotations
5. **Handler**: Implement the tool logic
6. **Register**: Add to index.ts
7. **Test**: Add tests in appropriate test file
8. **Document**: Update README, TOOLS.md, CHANGELOG
9. **Verify**: Run `npm run lint && npm run build && npm run test:smoke`

### Modifying Existing Tool

1. **Understand**: Read existing implementation
2. **Plan**: Define changes needed
3. **Implement**: Make changes preserving backward compatibility
4. **Test**: Update or add tests
5. **Document**: Update documentation
6. **Verify**: Run full test suite

### Refactoring Code

1. **Analyze**: Understand current structure
2. **Plan**: Define refactoring goals
3. **Incremental**: Make small, testable changes
4. **Verify**: Run tests after each change
5. **Document**: Update comments/docs if behavior changes

## Code Quality Standards

### Linting Rules
- No unused variables
- Preserve caught errors with `{ cause: error }`
- Use const for non-reassigned variables
- Prefer arrow functions for callbacks

### Type Safety
- Avoid `any` - use `unknown` with type guards
- Define explicit return types for functions
- Use Zod for runtime validation
- Enable strict mode

### Error Messages
- Include operation name in error
- Provide actionable suggestions
- Use consistent error format via `createErrorResponse()`

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `OPENCODE_SERVER_URL` | OpenCode server URL | `http://localhost:4096` |
| `OPENCODE_AUTO_START` | Auto-start OpenCode | `true` |
| `OPENCODE_DEFAULT_MODEL` | Default model | - |
| `OPENCODE_DEFAULT_PROJECT` | Project directory | - |
| `OPENCODE_CONFIG_PATH` | Config file path | auto-detected |
| `OPENCODE_TIMEOUT` | Request timeout (ms) | `120000` |
| `OPENCODE_LOG_LEVEL` | Log level | `info` |
| `MCP_TRANSPORT` | Transport mode | `stdio` |
| `MCP_HTTP_PORT` | HTTP port | `3000` |
