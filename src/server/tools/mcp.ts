/**
 * MCP Server Management Tools
 * 
 * Tools for managing sub-MCP servers through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  McpListInputSchema: {},

  McpEnableInputSchema: {
    name: z.string().min(1, { error: 'Server name is required' }).describe('Server name'),
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
              cli_commands: {
                list: 'opencode mcp list',
              },
              config_location: '~/.config/opencode/opencode.json or .opencode/opencode.json in project',
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing MCP servers',
          error,
          ERROR_SUGGESTIONS.mcpError
        );
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
              config_path: `opencode.json → mcp → ${params.name} → enabled: ${params.enabled}`,
              note: params.enabled 
                ? 'The server will connect on next OpenCode restart'
                : 'The server will be disconnected on next OpenCode restart',
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          `Updating MCP server "${params.name}"`,
          error,
          ERROR_SUGGESTIONS.mcpError
        );
      }
    },
  };
}

export type McpHandlers = ReturnType<typeof createMcpHandlers>;
