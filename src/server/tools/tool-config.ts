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
  
  ToolConfigureInputSchema: {
    tools: z.record(z.string(), z.boolean()).describe('Tool name patterns and enabled state (true/false)'),
    agent: z.string().optional().describe('Apply to specific agent (omit for global)'),
  },
  
  PermissionSetInputSchema: {
    tool: z.string().min(1, { error: 'Tool name is required' }).describe('Tool name or pattern'),
    permission: z.enum(['allow', 'ask', 'deny']).describe('Permission level'),
    agent: z.string().optional().describe('Apply to specific agent'),
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
    {
      name: 'opencode_tool_configure',
      description: 'Enable or disable tools globally or per-agent. Use wildcards like "mymcp_*" to control multiple tools.',
      inputSchema: {
        type: 'object',
        properties: {
          tools: { type: 'object' },
          agent: { type: 'string' },
        },
        required: ['tools'],
      },
    },
    {
      name: 'opencode_permission_set',
      description: 'Set permission level for a tool. Use "allow" (no approval), "ask" (prompt user), or "deny" (disable).',
      inputSchema: {
        type: 'object',
        properties: {
          tool: { type: 'string' },
          permission: { type: 'string', enum: ['allow', 'ask', 'deny'] },
          agent: { type: 'string' },
        },
        required: ['tool', 'permission'],
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

    async opencode_tool_configure(params: { tools: Record<string, unknown>; agent?: string }) {
      try {
        const scope = params.agent ? `agent "${params.agent}"` : 'globally';
        
        // Validate the tools parameter
        const validTools: Record<string, boolean> = {};
        for (const [tool, enabled] of Object.entries(params.tools)) {
          if (typeof enabled === 'boolean') {
            validTools[tool] = enabled;
          }
        }
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: `Configure tools ${scope} in opencode.json:`,
              config: params.agent 
                ? {
                    agent: {
                      [params.agent]: {
                        tools: validTools,
                      },
                    },
                  }
                : {
                    tools: validTools,
                  },
              examples: {
                disableAllMcp: { 'myserver_*': false },
                enableSpecific: { 'read': true, 'bash': false },
                disableDangerous: { 'bash': false, 'write': false },
              },
              wildcards: {
                'server_*': 'Match all tools from a specific MCP server',
                '*': 'Match all tools',
                'bash,write': 'Match specific tools (comma-separated)',
              },
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          'Configuring tools',
          error,
          ERROR_SUGGESTIONS.invalidInput
        );
      }
    },

    async opencode_permission_set(params: { tool: string; permission: 'allow' | 'ask' | 'deny'; agent?: string }) {
      try {
        const scope = params.agent ? `agent "${params.agent}"` : 'globally';
        
        const permissionDescriptions: Record<string, string> = {
          allow: 'Tool runs without user approval - use for safe, read-only tools',
          ask: 'User is prompted for approval before tool runs - recommended for modifications',
          deny: 'Tool is disabled and cannot be used - use for dangerous operations',
        };
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: `Set permission for "${params.tool}" to "${params.permission}" ${scope}`,
              config: params.agent
                ? {
                    agent: {
                      [params.agent]: {
                        permission: {
                          [params.tool]: params.permission,
                        },
                      },
                    },
                  }
                : {
                    permission: {
                      [params.tool]: params.permission,
                    },
                  },
              permission_descriptions: permissionDescriptions,
              current_permission: permissionDescriptions[params.permission],
              recommendations: {
                read_only_tools: 'Set to "allow" for better UX (e.g., read, glob, grep)',
                file_modification: 'Set to "ask" for safety (e.g., write, edit, bash)',
                dangerous_tools: 'Set to "deny" if not needed (e.g., bash rm commands)',
              },
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          'Setting permission',
          error,
          ERROR_SUGGESTIONS.invalidInput
        );
      }
    },
  };
}

export type ToolConfigHandlers = ReturnType<typeof createToolConfigHandlers>;
