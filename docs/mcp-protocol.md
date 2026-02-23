# MCP Protocol Constraints

This document outlines the Model Context Protocol (MCP) constraints and formatting requirements for implementations in this repository.

## Protocol Overview

MCP (Model Context Protocol) is a protocol for connecting AI models to external tools and data sources. This server implements MCP to expose OpenCode capabilities as tools.

## Transport Modes

### stdio (Default)
- Communication over stdin/stdout
- Single client connection
- Best for local IDE integration
- No additional configuration needed

### HTTP
- Communication over HTTP
- Supports multiple clients
- Best for remote access
- Configure with `MCP_TRANSPORT=http` and `MCP_HTTP_PORT=3000`

## Tool Definition Format

### JSON Schema for Input
```json
{
  "name": "tool_name",
  "description": "Tool description for LLM discoverability",
  "inputSchema": {
    "type": "object",
    "properties": {
      "param": { "type": "string" }
    },
    "required": ["param"]
  }
}
```

### Tool Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "Response content as string (typically JSON)"
    }
  ],
  "isError": false
}
```

### Error Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":\"Error message\",\"suggestions\":[\"Suggestion 1\",\"Suggestion 2\"]}"
    }
  ],
  "isError": true
}
```

## Tool Annotations

MCP-compliant annotations for LLM discoverability:

| Annotation | Type | Description |
|------------|------|-------------|
| `readOnlyHint` | boolean | Tool only reads data, doesn't modify state |
| `destructiveHint` | boolean | Tool may perform destructive updates |
| `idempotentHint` | boolean | Multiple calls produce same result |
| `openWorldHint` | boolean | Tool interacts with external entities |

### Annotation Patterns
```typescript
// Read-only, no side effects
const readOnlyExternal = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

// Writes to external systems
const writeExternal = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
};

// Creates new resources
const create = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};
```

## Implementation Constraints

### 1. Content Type
- All responses must use `type: "text"`
- Text should be valid JSON for structured data
- Use `JSON.stringify(data, null, 2)` for formatting

### 2. Error Handling
- Use `isError: true` for error responses
- Include actionable suggestions
- Never throw unhandled exceptions

### 3. Async Operations
- All handlers must be async functions
- Handle timeouts gracefully
- Use `AbortController` for cancellation

### 4. State Management
- Server can be stateless (stdio) or stateful (HTTP)
- Sessions maintain state across requests
- Config changes persist to file system

## Tool Naming Convention

- Prefix: `opencode_`
- Category prefix: `opencode_{category}_`
- Examples:
  - `opencode_run` (execution)
  - `opencode_session_create` (execution/session)
  - `opencode_file_read` (files)
  - `opencode_model_configure` (config)

## Request/Response Flow

```
Client                 MCP Server              OpenCode Server
  |                        |                        |
  |--- tool call --------->|                        |
  |                        |--- API request ------->|
  |                        |<-- API response -------|
  |<-- tool response ------|                        |
  |                        |                        |
```

## Limitations

### 1. No Streaming
- MCP tools return complete responses
- No support for streaming output
- Long operations may timeout

### 2. No Binary Data
- Content must be text-based
- Binary files should be base64 encoded
- Prefer text file operations

### 3. Single Content Item
- Each response has one content item
- Array content not supported
- Use JSON for structured data

### 4. No Interactive Prompts
- Tools cannot prompt for user input
- All parameters must be provided upfront
- Use suggestions in error responses

## Versioning

- Protocol version: MCP 2024-11-05
- Breaking changes require major version bump
- New tools can be added in minor versions

## Testing MCP Compliance

Use the MCP Inspector for testing:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This validates:
- Tool schema compliance
- Response format correctness
- Error handling behavior
