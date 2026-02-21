#!/usr/bin/env node
/**
 * OpenCode MCP Server
 * 
 * MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients.
 * 
 * Usage:
 *   npx @opencode-mcp/server
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

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
