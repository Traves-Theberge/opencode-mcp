/**
 * HTTP Transport for OpenCode MCP Server
 * 
 * Provides Streamable HTTP transport for remote access to the MCP server.
 */

import express from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface HTTPTransportOptions {
  port: number;
  hostname: string;
  corsOrigins?: string[];
  onReady?: () => void;
}

/**
 * Create an HTTP server with MCP Streamable HTTP transport
 */
export async function createHTTPTransport(
  mcpServer: McpServer,
  options: HTTPTransportOptions
): Promise<express.Application> {
  const app = express();
  
  // CORS configuration
  app.use(cors({
    origin: options.corsOrigins ?? ['*'],
    credentials: true,
  }));
  
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ 
      healthy: true, 
      version: process.env.npm_package_version ?? '0.1.0',
      transport: 'http',
    });
  });

  // MCP endpoint - handles all MCP communication
  app.all('/mcp', async (req, res) => {
    // Create a new transport for each request (stateless)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });
    
    try {
      // Handle the request
      if (req.method === 'POST') {
        // Check if this is an initialize request
        const body = req.body;
        if (isInitializeRequest(body)) {
          // Connect the server to the transport
          await mcpServer.connect(transport);
        }
        
        // Handle the request through the transport
        await transport.handleRequest(req, res, body);
      } else if (req.method === 'GET') {
        // SSE support for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // For GET requests, we need to establish SSE connection
        await transport.handleRequest(req, res);
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  // MCP endpoint with session ID (for stateful sessions)
  app.all('/mcp/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });
    
    try {
      if (req.method === 'POST') {
        await transport.handleRequest(req, res, req.body);
      } else if (req.method === 'DELETE') {
        // Close session
        await transport.close();
        res.status(204).send();
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Error handling MCP session request:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  return app;
}

/**
 * Start the HTTP server
 */
export async function startHTTPServer(
  mcpServer: McpServer,
  options: HTTPTransportOptions
): Promise<{ app: express.Application; close: () => void }> {
  const app = await createHTTPTransport(mcpServer, options);
  
  return new Promise((resolve) => {
    const server = app.listen(options.port, options.hostname, () => {
      console.log(`MCP HTTP server listening on http://${options.hostname}:${options.port}`);
      console.log(`MCP endpoint: http://${options.hostname}:${options.port}/mcp`);
      console.log(`Health check: http://${options.hostname}:${options.port}/health`);
      options.onReady?.();
      
      resolve({
        app,
        close: () => {
          server.close();
        },
      });
    });
  });
}
