# Logging Guide

OpenCode MCP Server provides structured logging for debugging and monitoring.

## Configuration

Set the log level via environment variable:

```bash
# Debug mode (most verbose)
OPENCODE_LOG_LEVEL=debug npx @opencode-mcp/server

# Info mode (default)
OPENCODE_LOG_LEVEL=info npx @opencode-mcp/server

# Warnings and errors only
OPENCODE_LOG_LEVEL=warn npx @opencode-mcp/server

# Errors only
OPENCODE_LOG_LEVEL=error npx @opencode-mcp/server

# Disable all logging
OPENCODE_LOG_LEVEL=none npx @opencode-mcp/server
```

## Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `debug` | Detailed debugging information | Troubleshooting, development |
| `info` | General information (default) | Normal operation monitoring |
| `warn` | Warning messages | Non-critical issues |
| `error` | Error messages only | Production monitoring |
| `none` | Disable all logging | Performance-critical scenarios |

## Timestamps

Enable timestamps in logs:

```bash
OPENCODE_LOG_TIMESTAMP=true npx @opencode-mcp/server
```

Output example:
```
[2025-02-21T14:30:00.000Z] [INFO] [opencode-mcp] Server started on port 3000
```

## Output Destination

All logs are written to **stderr**, not stdout. This ensures logs don't interfere with MCP stdio communication, which uses stdout for protocol messages.

## IDE Configuration

Add logging to your IDE's MCP configuration:

### Cursor

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "opencode": {
      "command": "npx",
      "args": ["-y", "@opencode-mcp/server"],
      "env": {
        "OPENCODE_SERVER_URL": "http://localhost:4096",
        "OPENCODE_LOG_LEVEL": "debug",
        "OPENCODE_LOG_TIMESTAMP": "true"
      }
    }
  }
}
```

## HTTP Transport Logs

When using HTTP transport, logs are still written to stderr of the server process:

```bash
MCP_TRANSPORT=http OPENCODE_LOG_LEVEL=debug npx @opencode-mcp/server
```

Server output:
```
[opencode-mcp] MCP HTTP server listening on http://127.0.0.1:3000
[opencode-mcp] MCP endpoint: http://127.0.0.1:3000/mcp
[DEBUG] [opencode-mcp] Tool registered: opencode_run
[DEBUG] [opencode-mcp] Tool registered: opencode_session_create
...
```

## Programmatic Usage

If using the server programmatically:

```typescript
import { createMCPServer } from '@opencode-mcp/server';
import { logger } from '@opencode-mcp/server/utils';

// Configure logging
process.env.OPENCODE_LOG_LEVEL = 'debug';

// Basic logging
logger.info('Server started');
logger.error('Connection failed');

// With metadata
logger.info('Tool called', { 
  tool: 'opencode_run', 
  model: 'claude-sonnet-4',
  duration: 150 
});

logger.error('Request failed', { 
  error: err.message, 
  stack: err.stack 
});

// Create child loggers for specific components
const toolLogger = logger.child('tools');
toolLogger.debug('Handler executed', { tool: 'opencode_run' });

const clientLogger = logger.child('client');
clientLogger.debug('Connecting to server', { url: serverUrl });
```

## Log Format

Logs follow this format:

```
[LEVEL] [prefix] message {"optional":"metadata"}
```

Examples:
```
[INFO] [opencode-mcp] Server started {"port":3000}
[DEBUG] [opencode-mcp:tools] Handler executed {"tool":"opencode_run","duration":150}
[ERROR] [opencode-mcp:client] Connection failed {"url":"http://localhost:4096"}
```

## Troubleshooting with Logs

### Connection Issues

Enable debug logging to see connection details:

```bash
OPENCODE_LOG_LEVEL=debug npx @opencode-mcp/server
```

Look for:
- `[opencode-mcp:client] Connecting to server`
- `[opencode-mcp:client] Connection failed` - Check server URL and status

### Tool Execution Issues

Debug logs show tool parameters and execution:

```
[DEBUG] [opencode-mcp:tools] Tool called {"tool":"opencode_run","prompt":"..."}
[DEBUG] [opencode-mcp:client] SDK response {"method":"session.create"}
```

### HTTP Transport Issues

Debug HTTP transport connections:

```bash
MCP_TRANSPORT=http OPENCODE_LOG_LEVEL=debug npx @opencode-mcp/server
```

Look for:
- `[opencode-mcp] MCP HTTP server listening`
- HTTP request/response details

## Environment Variables Summary

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_LOG_LEVEL` | `info` | Log level (debug, info, warn, error, none) |
| `OPENCODE_LOG_TIMESTAMP` | `false` | Include ISO timestamps in logs |
