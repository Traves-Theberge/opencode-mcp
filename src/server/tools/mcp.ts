/**
 * MCP Server Management Tools
 * 
 * Tools for managing sub-MCP servers through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  McpListInputSchema: {},
  
  McpAddInputSchema: {
    name: z.string().min(1).describe('Unique server name'),
    type: z.enum(['local', 'remote']).describe('Server type'),
    command: z.array(z.string()).optional().describe('Command to run (for local)'),
    environment: z.record(z.string(), z.string()).optional().describe('Environment variables (for local)'),
    url: z.string().optional().describe('Server URL (for remote)'),
    headers: z.record(z.string(), z.string()).optional().describe('Headers (for remote)'),
    enabled: z.boolean().optional().describe('Enable on startup'),
    timeout: z.number().optional().describe('Connection timeout in ms'),
  },
  
  McpRemoveInputSchema: {
    name: z.string().min(1).describe('Server name to remove'),
  },
  
  McpEnableInputSchema: {
    name: z.string().min(1).describe('Server name'),
    enabled: z.boolean().describe('Enable or disable'),
  },
  
  EmptySchema: {},
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getMcpToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_mcp_list',
      description: 'List all configured MCP servers and their connection status.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'opencode_mcp_add',
      description: 'Add a new MCP server to OpenCode. Supports local (stdio) and remote (HTTP) servers.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['local', 'remote'] },
          command: { type: 'array', items: { type: 'string' } },
          environment: { type: 'object' },
          url: { type: 'string' },
          headers: { type: 'object' },
          enabled: { type: 'boolean' },
          timeout: { type: 'number' },
        },
        required: ['name', 'type'],
      },
    },
    {
      name: 'opencode_mcp_remove',
      description: 'Remove an MCP server from OpenCode configuration.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
    {
      name: 'opencode_mcp_enable',
      description: 'Enable or disable an MCP server.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          enabled: { type: 'boolean' },
        },
        required: ['name', 'enabled'],
      },
    },
  ];
}

// ============================================================================
// MCP Server Types
// ============================================================================

interface McpServerConfig {
  name: string;
  type: 'local' | 'remote';
  enabled: boolean;
  status?: 'connected' | 'disconnected' | 'error';
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createMcpHandlers(_client: OpenCodeClient & { getMcpStatus?: () => Promise<Record<string, unknown>> }) {
  return {
    async opencode_mcp_list() {
      try {
        // MCP servers are configured in opencode.json
        // For now, return a message about how to view MCP servers
        const mcpServers: McpServerConfig[] = [];
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: 'MCP servers are configured in opencode.json under the "mcp" key.',
              servers: mcpServers,
              note: 'Use "opencode mcp list" CLI command for full status details.',
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing MCP servers: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_mcp_add(params: { 
      name: string; 
      type: 'local' | 'remote';
      command?: string[];
      environment?: Record<string, unknown>;
      url?: string;
      headers?: Record<string, unknown>;
      enabled?: boolean;
      timeout?: number;
    }) {
      try {
        // Build the MCP configuration
        const mcpConfig: Record<string, unknown> = {
          type: params.type,
          enabled: params.enabled ?? true,
        };
        
        if (params.type === 'local') {
          mcpConfig.command = params.command;
          if (params.environment) {
            mcpConfig.environment = params.environment;
          }
        } else {
          mcpConfig.url = params.url;
          if (params.headers) {
            mcpConfig.headers = params.headers;
          }
        }
        
        if (params.timeout) {
          mcpConfig.timeout = params.timeout;
        }
        
        // Return instructions for adding to config
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: 'Add this configuration to your opencode.json:',
              config: {
                mcp: {
                  [params.name]: mcpConfig,
                },
              },
              example: `{
  "mcp": {
    "${params.name}": ${JSON.stringify(mcpConfig, null, 4)}
  }
}`,
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error adding MCP server: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_mcp_remove(params: { name: string }) {
      try {
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: `Remove "${params.name}" from the "mcp" section in your opencode.json`,
              instruction: `Delete the "${params.name}" key from the mcp object in your configuration file.`,
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error removing MCP server: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_mcp_enable(params: { name: string; enabled: boolean }) {
      try {
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: `Set "enabled" to ${params.enabled} for "${params.name}" in your opencode.json`,
              instruction: `Update the mcp.${params.name}.enabled property in your configuration file.`,
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating MCP server: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type McpHandlers = ReturnType<typeof createMcpHandlers>;
