#!/usr/bin/env node
/**
 * OpenCode MCP Server
 * 
 * MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients.
 * 
 * Usage:
 *   # stdio transport (default - for IDE integration)
 *   npx @opencode-mcp/server
 *   
 *   # HTTP transport (for remote access)
 *   MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npx @opencode-mcp/server
 *   
 * Or configure in your MCP client:
 *   {
 *     "mcpServers": {
 *       "opencode": {
 *         "command": "npx",
 *         "args": ["-y", "@opencode-mcp/server"]
 *       }
 *     }
 *   }
 */

import { startServer } from './server/mcp.js';

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Log startup info
const transport = process.env.MCP_TRANSPORT ?? 'stdio';
console.error(`Starting OpenCode MCP Server (${transport} transport)...`);

if (transport === 'http') {
  console.error(`HTTP endpoint: http://127.0.0.1:${process.env.MCP_HTTP_PORT ?? 3000}/mcp`);
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
