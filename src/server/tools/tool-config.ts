/**
 * Tool Configuration Tools
 * 
 * Tools for managing OpenCode tool access and permissions.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  ToolListInputSchema: {
    provider: z.string().optional().describe('Filter by provider'),
    model: z.string().optional().describe('Filter by model'),
  },
  
  EmptySchema: {},
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getToolConfigToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_tool_list',
      description: 'List all available tools (built-in and from MCP servers). Optionally filter by provider/model.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          model: { type: 'string' },
        },
      },
    },
  ];
}

// ============================================================================
// Built-in Tools List
// ============================================================================

const BUILTIN_TOOLS = [
  { name: 'bash', description: 'Execute shell commands' },
  { name: 'read', description: 'Read file contents' },
  { name: 'write', description: 'Create or overwrite files' },
  { name: 'edit', description: 'Edit files with string replacement' },
  { name: 'grep', description: 'Search file contents' },
  { name: 'glob', description: 'Find files by pattern' },
  { name: 'list', description: 'List directory contents' },
  { name: 'webfetch', description: 'Fetch web content' },
  { name: 'websearch', description: 'Search the web' },
  { name: 'skill', description: 'Load agent skills' },
  { name: 'todowrite', description: 'Manage todo lists' },
  { name: 'todoread', description: 'Read todo lists' },
  { name: 'question', description: 'Ask user questions' },
  { name: 'patch', description: 'Apply patch files' },
];

// ============================================================================
// Tool Handlers
// ============================================================================

export function createToolConfigHandlers(_client: OpenCodeClient) {
  return {
    async opencode_tool_list(params: { provider?: string; model?: string }) {
      try {
        // List built-in tools and note about MCP tools
        const tools = BUILTIN_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          source: 'builtin',
        }));
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              builtin: tools,
              note: 'MCP server tools are prefixed with the server name (e.g., myserver_toolname)',
              filter: params,
              total_builtin: tools.length,
              tip: 'Use opencode_mcp_list to see MCP server tools',
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing tools',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },
  };
}

export type ToolConfigHandlers = ReturnType<typeof createToolConfigHandlers>;
