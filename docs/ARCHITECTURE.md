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
│  │  - Connection management                                             │  │
│  │  - Request/response handling                                         │  │
│  │  - Error translation                                                 │  │
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

### 2. MCP Server

The core MCP protocol implementation using `@modelcontextprotocol/sdk`.

**Responsibilities**:
- Tool registration with Zod schemas
- Request routing and validation
- Response formatting per MCP spec
- Error handling

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
- Automatic retry logic
- Type-safe API surface
- Error translation to MCP format

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

## Tool Handler Pattern

Each tool follows this pattern:

```typescript
// 1. Define Zod schema for input
const INPUT_SCHEMAS = {
  MyToolInputSchema: {
    param: z.string().describe('Description'),
  },
};

// 2. Create handler function
function createMyToolHandlers(client: OpenCodeClient) {
  return {
    async opencode_my_tool(params: { param: string }) {
      try {
        const result = await client.doSomething(params.param);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    },
  };
}

// 3. Register with server
server.tool('opencode_my_tool', 'Description', INPUT_SCHEMAS.MyToolInputSchema, handler);
```

## Configuration

Configuration is loaded from:

1. **Environment Variables** (highest priority)
2. **OpenCode config** (`opencode.json`)
3. **Defaults**

Key settings:
- `OPENCODE_SERVER_URL`: OpenCode server endpoint
- `MCP_TRANSPORT`: stdio or http
- `MCP_HTTP_PORT`: HTTP port for http transport

## Error Handling

Errors are translated to MCP format:

```typescript
{
  content: [{ type: 'text', text: 'Error: <message>' }],
  isError: true
}
```

Error categories:
- `CONNECTION_FAILED`: Cannot reach OpenCode server
- `SESSION_NOT_FOUND`: Invalid session ID
- `INVALID_INPUT`: Zod validation failed
- `TOOL_EXECUTION_FAILED`: OpenCode returned error
- `TIMEOUT`: Operation timed out

## Security Considerations

1. **Local by default**: stdio transport only accepts local connections
2. **No credential storage**: API keys managed by OpenCode, not MCP server
3. **CORS configurable**: HTTP transport allows restricting origins
4. **No authentication**: Relies on OpenCode server's authentication

## Performance

- **Connection pooling**: SDK client reuses connections
- **Streaming support**: HTTP transport supports SSE for streaming
- **Lazy loading**: Tools registered on server start, not import
