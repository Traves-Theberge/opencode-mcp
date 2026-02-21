/**
 * HTTP Transport for OpenCode MCP Server
 * 
 * Provides Streamable HTTP transport for remote access to the MCP server.
 * 
 * ## Transport Modes
 * 
 * ### Stateless Mode (Default)
 * - No session state is maintained between requests
 * - Each request is independent and self-contained
 * - Suitable for simple request/response patterns
 * - Better for horizontal scaling and load balancing
 * 
 * ### Stateful Mode (with sessionId)
 * - Session state is maintained via sessionId in URL path
 * - Use `/mcp/:sessionId` endpoint for stateful sessions
 * - Required for multi-turn conversations with context
 * - Session management is handled by the client
 * 
 * ## Usage
 * 
 * ```bash
 * # Start HTTP server
 * MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npx @opencode-mcp/server
 * ```
 * 
 * ## Endpoints
 * 
 * - `GET /health` - Health check endpoint
 * - `POST /mcp` - Stateless MCP requests
 * - `GET /mcp` - SSE streaming for stateless mode
 * - `POST /mcp/:sessionId` - Stateful MCP requests
 * - `GET /mcp/:sessionId` - SSE streaming for stateful mode
 * - `DELETE /mcp/:sessionId` - Close a stateful session
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
  /** Maximum request body size (default: '1mb') */
  maxBodySize?: string;
  /** Request timeout in milliseconds (default: 30000) */
  requestTimeout?: number;
  onReady?: () => void;
}

/**
 * Session store for stateful HTTP connections
 * In production, consider using Redis or another distributed store
 */
const sessionTransports = new Map<string, StreamableHTTPServerTransport>();

/**
 * Security headers middleware
 */
function securityHeaders(_req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
}

/**
 * Create an HTTP server with MCP Streamable HTTP transport
 */
export async function createHTTPTransport(
  mcpServer: McpServer,
  options: HTTPTransportOptions
): Promise<express.Application> {
  const app = express();
  
  // Security headers
  app.use(securityHeaders);
  
  // CORS configuration
  app.use(cors({
    origin: options.corsOrigins ?? ['*'],
    credentials: true,
  }));
  
  // Request body limits (configurable, default 1MB)
  app.use(express.json({ limit: options.maxBodySize ?? '1mb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ 
      healthy: true, 
      version: process.env.npm_package_version ?? '0.1.0',
      transport: 'http',
      mode: 'stateless',
      activeSessions: sessionTransports.size,
    });
  });

  // MCP endpoint - STATELESS mode (handles all MCP communication)
  app.all('/mcp', async (req, res) => {
    // Create a new transport for each request (stateless)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode - no session ID
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
        res.status(405).json({ 
          error: 'Method not allowed',
          allowed_methods: ['GET', 'POST'],
        });
      }
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Check that the request body is valid JSON and follows MCP protocol',
        });
      }
    }
  });

  // MCP endpoint with session ID - STATEFUL mode
  app.all('/mcp/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    
    // Get or create transport for this session
    let transport = sessionTransports.get(sessionId);
    
    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });
      sessionTransports.set(sessionId, transport);
    }
    
    try {
      if (req.method === 'POST') {
        // Check if this is an initialize request
        const body = req.body;
        if (isInitializeRequest(body)) {
          await mcpServer.connect(transport);
        }
        await transport.handleRequest(req, res, body);
      } else if (req.method === 'GET') {
        // SSE support for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        await transport.handleRequest(req, res);
      } else if (req.method === 'DELETE') {
        // Close session
        await transport.close();
        sessionTransports.delete(sessionId);
        res.status(204).send();
      } else {
        res.status(405).json({ 
          error: 'Method not allowed',
          allowed_methods: ['GET', 'POST', 'DELETE'],
        });
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

  // API documentation endpoint
  app.get('/api', (_req, res) => {
    res.json({
      name: 'OpenCode MCP Server',
      version: process.env.npm_package_version ?? '0.1.0',
      description: 'MCP server that exposes OpenCode as a tool/subagent for IDEs and AI clients',
      transport: 'streamable-http',
      endpoints: {
        'GET /health': {
          description: 'Health check endpoint',
          response: { healthy: 'boolean', version: 'string', transport: 'string' },
        },
        'POST /mcp': {
          description: 'Stateless MCP requests',
          note: 'Each request is independent with no session state',
          content_type: 'application/json',
        },
        'GET /mcp': {
          description: 'SSE streaming for stateless mode',
          content_type: 'text/event-stream',
        },
        'POST /mcp/:sessionId': {
          description: 'Stateful MCP requests with session',
          note: 'Session state is maintained between requests',
        },
        'GET /mcp/:sessionId': {
          description: 'SSE streaming for stateful mode',
          content_type: 'text/event-stream',
        },
        'DELETE /mcp/:sessionId': {
          description: 'Close a stateful session',
        },
      },
      modes: {
        stateless: {
          description: 'No session state maintained between requests',
          use_case: 'Simple request/response patterns, horizontal scaling',
          endpoint: '/mcp',
        },
        stateful: {
          description: 'Session state maintained via sessionId',
          use_case: 'Multi-turn conversations with context',
          endpoint: '/mcp/:sessionId',
        },
      },
    });
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
      console.log(`API docs: http://${options.hostname}:${options.port}/api`);
      options.onReady?.();
      
      resolve({
        app,
        close: () => {
          // Clean up all session transports
          for (const [sessionId, transport] of sessionTransports) {
            transport.close().catch(err => {
              console.error(`Error closing session ${sessionId}:`, err);
            });
          }
          sessionTransports.clear();
          server.close();
        },
      });
    });
  });
}
