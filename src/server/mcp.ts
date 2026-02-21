/**
 * MCP Server Implementation
 * 
 * Creates and manages the Model Context Protocol server that exposes
 * OpenCode tools to MCP-compatible clients. Supports both stdio and HTTP transports.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from '../utils/config.js';
import { createClient } from '../client/opencode.js';
import { registerAllTools } from './tools/index.js';
import { startHTTPServer } from './transports/http.js';

export interface MCPServerInstance {
  connect: () => Promise<void>;
  isConnected: () => boolean;
  close: () => Promise<void>;
}

export interface CreateServerOptions {
  name?: string;
  version?: string;
  transport?: 'stdio' | 'http';
  httpPort?: number;
  httpHostname?: string;
  corsOrigins?: string[];
}

/**
 * Create an MCP server instance
 */
export async function createMCPServer(options?: CreateServerOptions): Promise<MCPServerInstance> {
  const config = loadConfig();
  const serverName = options?.name ?? 'opencode-mcp';
  const serverVersion = options?.version ?? '0.1.0';
  const transport = options?.transport ?? config.transport;

  let connected = false;
  let httpServer: { close: () => void } | undefined;

  // Create MCP server
  const mcpServer = new McpServer({
    name: serverName,
    version: serverVersion,
  });

  // Create OpenCode client
  const client = await createClient(config);

  // Register all tools
  await registerAllTools(mcpServer, client, config.defaultModel);

  return {
    async connect() {
      if (connected) return;
      
      if (transport === 'http') {
        // Start HTTP server
        const port = options?.httpPort ?? config.httpPort ?? 3000;
        const hostname = options?.httpHostname ?? '127.0.0.1';
        
        httpServer = await startHTTPServer(mcpServer, {
          port,
          hostname,
          corsOrigins: options?.corsOrigins,
        });
        
        connected = true;
      } else {
        // Use stdio transport (default)
        const stdioTransport = new StdioServerTransport();
        await mcpServer.connect(stdioTransport);
        connected = true;
      }
    },

    isConnected() {
      return connected;
    },

    async close() {
      client.disconnect();
      if (httpServer) {
        httpServer.close();
      }
      connected = false;
    },
  };
}

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  const transport = process.env.MCP_TRANSPORT ?? 'stdio';
  
  const server = await createMCPServer({
    transport: transport as 'stdio' | 'http',
    httpPort: process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : undefined,
    corsOrigins: process.env.MCP_CORS_ORIGINS?.split(','),
  });
  
  await server.connect();
  
  // For stdio, keep the process alive
  if (transport === 'stdio') {
    process.stdin.resume();
  }
}

// Export for programmatic use
export { loadConfig };
