/**
 * Config Tools
 * 
 * Tools for configuration and model management through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  ModelListInputSchema: {
    provider: z.string().optional().describe('Filter by provider ID'),
    refresh: z.boolean().optional().describe('Refresh cache from models.dev'),
  },
  
  EmptySchema: {},
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getConfigToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_model_list',
      description: 'List all available models from configured providers. Optionally filter by provider or refresh the cache.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          refresh: { type: 'boolean' },
        },
      },
    },
    {
      name: 'opencode_provider_list',
      description: 'List all providers and their connection status.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'opencode_config_get',
      description: 'Get current OpenCode configuration.',
      inputSchema: { type: 'object', properties: {} },
    },
  ];
}

// ============================================================================
// Types for API responses
// ============================================================================

interface ProviderData {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createConfigHandlers(client: OpenCodeClient) {
  return {
    async opencode_model_list(params: { provider?: string; refresh?: boolean }) {
      try {
        const { providers, defaults } = await client.listProviders();
        
        // Type assert providers
        const typedProviders = providers as ProviderData[];
        
        // Filter by provider if specified
        let filteredProviders = typedProviders;
        if (params.provider) {
          filteredProviders = typedProviders.filter((p: ProviderData) => p.id === params.provider);
        }

        // Format output
        const output = filteredProviders.map((provider: ProviderData) => ({
          provider: provider.id,
          name: provider.name,
          models: provider.models.map((m: { id: string; name: string }) => ({
            id: m.id,
            name: m.name,
            default: defaults[provider.id] === m.id,
          })),
        }));

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing models: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_provider_list() {
      try {
        const { providers, defaults } = await client.listProviders();
        
        // Type assert providers
        const typedProviders = providers as ProviderData[];
        
        const output = typedProviders.map((provider: ProviderData) => ({
          id: provider.id,
          name: provider.name,
          modelCount: provider.models.length,
          defaultModel: defaults[provider.id],
        }));

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing providers: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_config_get() {
      try {
        const config = {
          serverUrl: process.env.OPENCODE_SERVER_URL || 'http://localhost:4096',
          autoStart: process.env.OPENCODE_AUTO_START !== 'false',
          timeout: parseInt(process.env.OPENCODE_TIMEOUT || '120000', 10),
          defaultModel: process.env.OPENCODE_DEFAULT_MODEL,
          transport: process.env.MCP_TRANSPORT || 'stdio',
        };

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(config, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting config: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type ConfigHandlers = ReturnType<typeof createConfigHandlers>;
