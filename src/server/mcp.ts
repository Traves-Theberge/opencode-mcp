/**
 * MCP Server Implementation
 * 
 * Creates and manages the Model Context Protocol server that exposes
 * OpenCode tools to MCP-compatible clients.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServerConfig, ToolResult } from '../utils/types.js';
import { DEFAULT_CONFIG } from '../utils/types.js';
import { loadConfig } from '../utils/config.js';
import { createClient } from '../client/opencode.js';
import { getAllToolDefinitions, createAllHandlers, getToolHandlerMap } from './tools/index.js';

export interface MCPServerInstance {
  connect: () => Promise<void>;
  registerTool: (name: string, description: string, schema: unknown, handler: unknown) => void;
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
  const handlers = createAllHandlers(client, config.defaultModel);
  const handlerMap = getToolHandlerMap(handlers);

  // Register all tools
  const toolDefinitions = getAllToolDefinitions();
  for (const tool of toolDefinitions) {
    const handler = handlerMap[tool.name];
    if (handler) {
      server.tool(
        tool.name,
        tool.description,
        tool.inputSchema,
        async (params: unknown) => {
          return handler(params) as Promise<ToolResult>;
        }
      );
    }
  }

  return {
    async connect() {
      if (connected) return;
      
      const transport = new StdioServerTransport();
      await server.connect(transport);
      connected = true;
    },

    registerTool(name: string, description: string, schema: unknown, handler: unknown) {
      server.tool(name, description, schema as Record<string, unknown>, handler as () => Promise<ToolResult>);
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
export { loadConfig, getAllToolDefinitions, createAllHandlers, getToolHandlerMap };
