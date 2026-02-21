# Architecture

Understanding the OpenCode MCP Server architecture.

## Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MCP Client (IDE/AI)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                       │
│  │   Cursor    │  │  Windsurf   │  │   Claude    │  ...                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                       │
└─────────┼────────────────┼────────────────┼──────────────────────────────┘
          │                │                │
          │    MCP Protocol (stdio / HTTP)  │
          └────────────────┼────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      OpenCode MCP Server                                  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      Transport Layer                                │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────────────┐   │  │
│  │  │   stdio         │  │   Streamable HTTP                      │   │  │
│  │  │   Transport     │  │   Transport                            │   │  │
│  │  └─────────────────┘  └────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      MCP Server (McpServer)                         │  │
│  │  - Tool registration with Zod schemas                               │  │
│  │  - Tool annotations for LLM discoverability                         │  │
│  │  - Request routing and validation                                    │  │
│  │  - Response formatting                                               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      Tool Registry (29 tools)                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │Execution │ │  Files   │ │  Config  │ │  Agents  │ │  Skills  │ │  │
│  │  │  (6)     │ │  (5)     │ │  (6)     │ │  (2)     │ │  (3)     │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐                                           │  │
│  │  │   MCP    │ │   Tool   │                                           │  │
│  │  │  (4)     │ │ Config(3)│                                           │  │
│  │  └──────────┘ └──────────┘                                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                   OpenCode SDK Client                                │  │
│  │  - Connection management with health checking                        │  │
│  │  - Zod validation for SDK responses                                  │  │
│  │  - Request timeout handling with AbortController                     │  │
│  │  - Error translation to MCP format                                   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────────────┘
                            │ @opencode-ai/sdk
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      OpenCode Server                                      │
│  - Session Management                                                     │
│  - Agent Orchestration                                                    │
│  - File Operations                                                        │
│  - Model Configuration                                                    │
│  - MCP Server Management                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Transport Layer

Handles communication between MCP clients and the server.

**stdio Transport**:
- Used for local IDE integration
- Communicates via stdin/stdout
- Single client connection

**HTTP Transport**:
- Used for remote access
- Express.js server with Streamable HTTP
- Supports stateless and stateful sessions
- CORS configurable
- Endpoints: `/health`, `/api`, `/mcp`, `/mcp/:sessionId`

### 2. MCP Server

The core MCP protocol implementation using `@modelcontextprotocol/sdk`.

**Responsibilities**:
- Tool registration with Zod schemas
- Tool annotations for LLM discoverability
- Request routing and validation
- Response formatting per MCP spec
- Error handling with actionable suggestions

### 3. Tool Registry

Organized collection of 29 tools across 7 categories:

| Category | Tools | Purpose |
|----------|-------|---------|
| Execution | 6 | Run prompts, manage sessions |
| Files | 5 | File operations and search |
| Config | 6 | Model/provider configuration |
| Agents | 2 | Agent listing and delegation |
| Skills | 3 | Skill discovery and creation |
| MCP | 4 | Sub-MCP server management |
| Tools | 3 | Tool configuration |

### 4. OpenCode Client

SDK wrapper for communicating with OpenCode server.

**Features**:
- Connection health checking
- Zod validation for SDK responses
- Request timeout handling with AbortController
- Type-safe API surface
- Error translation to MCP format

## Tool Handler Pattern

Each tool follows this pattern:

```typescript
// 1. Define Zod schema for input
const INPUT_SCHEMAS = {
  MyToolInputSchema: {
    param: z.string().describe('Description'),
  },
};

// 2. Create handler function with error handling
function createMyToolHandlers(client: OpenCodeClient) {
  return {
    async opencode_my_tool(params: { param: string }) {
      try {
        const result = await client.doSomething(params.param);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Doing something',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },
  };
}

// 3. Register with server (includes annotations)
server.tool('opencode_my_tool', 'Description', schema, annotations, handler);
```

## Tool Annotations

All 29 tools include MCP-compliant annotations for better LLM discoverability:

| Annotation | Description |
|------------|-------------|
| `readOnlyHint` | Tool only reads data, doesn't modify state |
| `destructiveHint` | Tool may perform destructive updates |
| `idempotentHint` | Multiple calls produce same result |
| `openWorldHint` | Tool interacts with external entities |

**Presets**:
| Preset | readOnly | destructive | idempotent | openWorld | Use Case |
|--------|----------|-------------|------------|-----------|----------|
| readOnly | ✓ | ✗ | ✓ | ✗ | Read operations |
| readOnlyExternal | ✓ | ✗ | ✗ | ✓ | Read from external services |
| writeLocal | ✗ | ✓ | ✗ | ✗ | Modify local state |
| writeExternal | ✗ | ✓ | ✗ | ✓ | Modify external services |
| create | ✗ | ✗ | ✗ | ✓ | Create new resources |

See `src/server/tools/schemas.ts` for annotation definitions.

## Error Handling

Errors use a structured format with actionable suggestions:

```typescript
{
  content: [{ 
    type: 'text', 
    text: 'Error: <operation> failed.\n\nDetails: <message>\n\nSuggestions:\n  1. <suggestion1>\n  2. <suggestion2>'
  }],
  isError: true
}
```

**Error Categories**:
| Category | Suggestions |
|----------|-------------|
| connectionFailed | Start server, check URL, verify accessibility |
| sessionNotFound | List sessions, create new, check ID |
| invalidInput | Check types, required fields, schema |
| timeout | Break into smaller tasks, increase timeout |
| unauthorized | Check API keys, run auth login |
| fileNotFound | Verify path, use find_files |
| skillNotFound | List skills, check spelling |
| agentNotFound | List agents, check spelling |
| mcpError | Check config, verify command/URL |

See `src/server/tools/schemas.ts` for `ERROR_SUGGESTIONS` constant.

## Logging

Structured logging via `src/utils/logger.ts`:

```typescript
import { logger } from './utils/logger.js';

logger.info('Server started', { port: 3000 });
logger.error('Connection failed', { url: serverUrl });
logger.debug('Tool called', { tool: 'opencode_run', params });
```

**Configuration**:
- `OPENCODE_LOG_LEVEL`: debug, info, warn, error, none (default: info)
- `OPENCODE_LOG_TIMESTAMP`: true/false (default: false)

**Output**: All logs go to stderr to avoid interfering with MCP stdio communication.

See [Logging Guide](guides/LOGGING.md) for details.

## Configuration

Configuration is loaded from:

1. **Environment Variables** (highest priority)
2. **OpenCode config** (`opencode.json`)
3. **Defaults**

Key settings:
- `OPENCODE_SERVER_URL`: OpenCode server endpoint
- `OPENCODE_TIMEOUT`: Request timeout in ms
- `OPENCODE_LOG_LEVEL`: Logging verbosity
- `MCP_TRANSPORT`: stdio or http
- `MCP_HTTP_PORT`: HTTP port for http transport

## Data Flow

### Request Flow (stdio)

```
IDE → stdin → MCP Server → Tool Handler → OpenCode SDK → OpenCode Server
                                                            ↓
IDE ← stdout ← MCP Server ← Tool Handler ← OpenCode SDK ← Response
```

### Request Flow (HTTP)

```
Client → HTTP POST /mcp → Transport → MCP Server → Tool Handler → OpenCode SDK
                                                                       ↓
Client ← HTTP Response ← Transport ← MCP Server ← Tool Handler ← Response
```

## Security Considerations

1. **Local by default**: stdio transport only accepts local connections
2. **No credential storage**: API keys managed by OpenCode, not MCP server
3. **CORS configurable**: HTTP transport allows restricting origins
4. **No authentication**: Relies on OpenCode server's authentication

## Performance

- **Connection pooling**: SDK client reuses connections
- **Streaming support**: HTTP transport supports SSE for streaming
- **Lazy loading**: Tools registered on server start, not import
- **Timeout handling**: Configurable timeouts prevent hanging requests
