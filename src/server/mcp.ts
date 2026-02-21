/**
 * MCP Server Implementation
 * 
 * Creates and manages the Model Context Protocol server that exposes
 * OpenCode tools to MCP-compatible clients.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from '../utils/config.js';
import { createClient } from '../client/opencode.js';
import { registerAllTools } from './tools/index.js';

export interface MCPServerInstance {
  connect: () => Promise<void>;
  isConnected: () => boolean;
  close: () => Promise<void>;
}

export interface CreateServerOptions {
  name?: string;
  version?: string;
}

/**
 * Create an MCP server instance
 */
export async function createMCPServer(options?: CreateServerOptions): Promise<MCPServerInstance> {
  const config = loadConfig();
  const serverName = options?.name ?? 'opencode-mcp';
  const serverVersion = options?.version ?? '0.1.0';

  let connected = false;

  // Create MCP server
  const server = new McpServer({
    name: serverName,
    version: serverVersion,
  });

  // Create OpenCode client
  const client = await createClient(config);

  // Register all tools
  registerAllTools(server, client, config.defaultModel);

  return {
    async connect() {
      if (connected) return;
      
      const transport = new StdioServerTransport();
      await server.connect(transport);
      connected = true;
    },

    isConnected() {
      return connected;
    },

    async close() {
      client.disconnect();
      connected = false;
    },
  };
}

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  const server = await createMCPServer();
  await server.connect();
  
  // Keep the process alive
  process.stdin.resume();
}

// Export for programmatic use
export { loadConfig };
