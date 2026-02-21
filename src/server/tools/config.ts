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
  
  ModelConfigureInputSchema: {
    provider: z.string().min(1).describe('Provider ID'),
    model: z.string().min(1).describe('Model ID'),
    options: z.record(z.string(), z.any()).describe('Model options (temperature, reasoningEffort, etc.)'),
  },
  
  ConfigUpdateInputSchema: {
    model: z.string().optional().describe('Default model (provider/model format)'),
    smallModel: z.string().optional().describe('Small model for lightweight tasks'),
    autoupdate: z.boolean().optional().describe('Auto-update setting'),
    theme: z.string().optional().describe('Theme name'),
    defaultAgent: z.string().optional().describe('Default agent name'),
  },
  
  AuthSetInputSchema: {
    provider: z.string().min(1).describe('Provider ID (e.g., anthropic, openai)'),
    type: z.enum(['api', 'oauth']).describe('Authentication type'),
    key: z.string().optional().describe('API key (for api type)'),
    token: z.string().optional().describe('OAuth token (for oauth type)'),
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
      name: 'opencode_model_configure',
      description: 'Configure model options (temperature, reasoning effort, thinking budget, etc.).',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          model: { type: 'string' },
          options: { type: 'object' },
        },
        required: ['provider', 'model', 'options'],
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
    {
      name: 'opencode_config_update',
      description: 'Update OpenCode configuration settings.',
      inputSchema: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          smallModel: { type: 'string' },
          autoupdate: { type: 'boolean' },
          theme: { type: 'string' },
          defaultAgent: { type: 'string' },
        },
      },
    },
    {
      name: 'opencode_auth_set',
      description: 'Set authentication credentials for a provider. Supports API keys and OAuth tokens.',
      inputSchema: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          type: { type: 'string', enum: ['api', 'oauth'] },
          key: { type: 'string' },
          token: { type: 'string' },
        },
        required: ['provider', 'type'],
      },
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
        
        const typedProviders = providers as ProviderData[];
        
        let filteredProviders = typedProviders;
        if (params.provider) {
          filteredProviders = typedProviders.filter((p: ProviderData) => p.id === params.provider);
        }

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

    async opencode_model_configure(params: { provider: string; model: string; options: Record<string, unknown> }) {
      try {
        // Return config instructions - actual update requires SDK support
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: 'Add this model configuration to your opencode.json:',
              config: {
                provider: {
                  [params.provider]: {
                    models: {
                      [params.model]: {
                        options: params.options,
                      },
                    },
                  },
                },
              },
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error configuring model: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_provider_list() {
      try {
        const { providers, defaults } = await client.listProviders();
        
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

    async opencode_config_update(params: { 
      model?: string; 
      smallModel?: string; 
      autoupdate?: boolean;
      theme?: string;
      defaultAgent?: string;
    }) {
      try {
        // Build config update instructions
        const updates: Record<string, unknown> = {};
        if (params.model) updates.model = params.model;
        if (params.smallModel) updates.small_model = params.smallModel;
        if (params.autoupdate !== undefined) updates.autoupdate = params.autoupdate;
        if (params.theme) updates.theme = params.theme;
        if (params.defaultAgent) updates.default_agent = params.defaultAgent;
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: 'Add these settings to your opencode.json:',
              config: updates,
              note: 'Environment variables can also be used to override these settings.',
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error updating config: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_auth_set(params: { provider: string; type: 'api' | 'oauth'; key?: string; token?: string }) {
      try {
        if (params.type === 'api' && !params.key) {
          return {
            content: [{ type: 'text' as const, text: 'Error: API key is required for api authentication type' }],
            isError: true,
          };
        }
        
        // Return instructions for setting auth
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: 'Set authentication for provider:',
              provider: params.provider,
              instructions: params.type === 'api' 
                ? [
                    `Set environment variable: ${params.provider.toUpperCase().replace(/-/g, '_')}_API_KEY=${params.key}`,
                    `Or run: opencode auth login ${params.provider}`,
                  ]
                : [
                    `Run: opencode auth login ${params.provider}`,
                    'This will open a browser for OAuth authentication.',
                  ],
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error setting auth: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type ConfigHandlers = ReturnType<typeof createConfigHandlers>;
