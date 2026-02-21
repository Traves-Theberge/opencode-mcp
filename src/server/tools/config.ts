/**
 * Config Tools
 * 
 * Tools for configuration and model management through OpenCode.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolResult } from '../../utils/types.js';
import type { OpenCodeClient } from '../../client/opencode.js';

// ============================================================================
// Input Schemas
// ============================================================================

const ModelListInputSchema = z.object({
  provider: z.string().optional().describe('Filter by provider ID'),
  refresh: z.boolean().optional().describe('Refresh cache from models.dev'),
});

const ProviderListInputSchema = z.object({});

const ConfigGetInputSchema = z.object({});

// ============================================================================
// Tool Definitions
// ============================================================================

export function getConfigToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'opencode_model_list',
      description: 'List all available models from configured providers. Optionally filter by provider or refresh the cache.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string', description: 'Filter by provider ID' },
          refresh: { type: 'boolean', description: 'Refresh cache from models.dev' },
        },
      },
    },
    {
      name: 'opencode_provider_list',
      description: 'List all providers and their connection status.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'opencode_config_get',
      description: 'Get current OpenCode configuration.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createConfigHandlers(client: OpenCodeClient) {
  return {
    async opencode_model_list(input: unknown): Promise<ToolResult> {
      const parsed = ModelListInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const { providers, defaults } = await client.listProviders();
        
        // Filter by provider if specified
        let filteredProviders = providers;
        if (parsed.data.provider) {
          filteredProviders = providers.filter(p => p.id === parsed.data.provider);
        }

        // Format output
        const output = filteredProviders.map(provider => ({
          provider: provider.id,
          name: provider.name,
          models: provider.models.map(m => ({
            id: m.id,
            name: m.name,
            default: defaults[provider.id] === m.id,
          })),
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing models: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_provider_list(): Promise<ToolResult> {
      try {
        const { providers, defaults } = await client.listProviders();
        
        const output = providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          modelCount: provider.models.length,
          defaultModel: defaults[provider.id],
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing providers: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_config_get(): Promise<ToolResult> {
      try {
        // Return the current configuration from environment
        const config = {
          serverUrl: process.env.OPENCODE_SERVER_URL || 'http://localhost:4096',
          autoStart: process.env.OPENCODE_AUTO_START !== 'false',
          timeout: parseInt(process.env.OPENCODE_TIMEOUT || '120000', 10),
          defaultModel: process.env.OPENCODE_DEFAULT_MODEL,
          transport: process.env.MCP_TRANSPORT || 'stdio',
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(config, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error getting config: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type ConfigHandlers = ReturnType<typeof createConfigHandlers>;
