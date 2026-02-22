/**
 * Config Tools
 * 
 * Tools for configuration and model management through OpenCode.
 * Uses hybrid approach: API update for immediate effect + file persistence.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';
import { 
  detectConfigPath, 
  readOpenCodeConfig,
  writeOpenCodeConfig 
} from '../../utils/config.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  ModelListInputSchema: {
    provider: z.string().optional().describe('Filter by provider ID'),
    refresh: z.boolean().optional().describe('Refresh cache from models.dev'),
  },
  
  ModelConfigureInputSchema: {
    provider: z.string().min(1, { error: 'Provider ID is required' }).describe('Provider ID'),
    model: z.string().min(1, { error: 'Model ID is required' }).describe('Model ID'),
    options: z.record(z.string(), z.unknown()).describe('Model options (reasoningEffort, maxTokens, thinking, etc.)'),
  },
  
  ConfigUpdateInputSchema: {
    model: z.string().optional().describe('Default model (provider/model format)'),
    smallModel: z.string().optional().describe('Small model for lightweight tasks'),
    defaultAgent: z.string().optional().describe('Default agent name'),
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
      description: 'Configure model options (reasoningEffort, maxTokens, thinking, etc.). Updates both runtime config and persists to opencode.json.',
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
      description: 'Update OpenCode configuration settings. Updates both runtime config and persists to opencode.json.',
      inputSchema: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          smallModel: { type: 'string' },
          defaultAgent: { type: 'string' },
        },
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
  models?: Array<{ id: string; name?: string }> | Record<string, { id?: string; name?: string }>;
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createConfigHandlers(client: OpenCodeClient) {
  return {
    async opencode_model_list(params: { provider?: string; refresh?: boolean }) {
      try {
        const { providers, defaults } = await client.listProviders();
        
        // Log raw response for debugging
        console.error(`[model_list] Providers response:`, JSON.stringify(providers, null, 2).slice(0, 1000));
        
        // Handle different response formats safely
        // models can be: undefined, array, or object (dictionary)
        const output = (providers as ProviderData[]).map((provider: ProviderData) => {
          let models: Array<{ id: string; name: string; default: boolean }> = [];
          
          if (provider.models) {
            if (Array.isArray(provider.models)) {
              // Handle array format
              models = provider.models.map((m: { id: string; name?: string }) => ({
                id: m.id,
                name: m.name ?? m.id,
                default: defaults[provider.id] === m.id,
              }));
            } else if (typeof provider.models === 'object') {
              // Handle object/dictionary format: { "gpt-4": { name: "GPT-4", ... }, ... }
              const modelsObj = provider.models as Record<string, { id?: string; name?: string }>;
              models = Object.entries(modelsObj).map(([modelId, modelData]) => ({
                id: modelId,
                name: modelData?.name ?? modelId,
                default: defaults[provider.id] === modelId,
              }));
            }
          }
          
          return {
            provider: provider.id,
            name: provider.name ?? provider.id,
            models,
          };
        });
        
        // Filter if provider specified
        const filteredOutput = params.provider 
          ? output.filter(p => p.provider === params.provider)
          : output;

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(filteredOutput, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing models',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_model_configure(params: { provider: string; model: string; options: Record<string, unknown> }) {
      try {
        // Build the config update
        const configUpdate = {
          provider: {
            [params.provider]: {
              models: {
                [params.model]: {
                  options: params.options,
                },
              },
            },
          },
        };
        
        // 1. Update runtime config via API (immediate effect)
        const apiResult = await client.updateConfig(configUpdate);
        
        // 2. Persist to opencode.json file
        const configPath = detectConfigPath(process.env.OPENCODE_DEFAULT_PROJECT);
        let persistResult: { success: boolean; error?: string } = { success: false, error: 'Config path not detected' };
        
        if (configPath) {
          persistResult = writeOpenCodeConfig(configPath, configUpdate);
        }
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              success: true,
              message: `Model ${params.model} configured for provider ${params.provider}`,
              provider: params.provider,
              model: params.model,
              options: params.options,
              api: {
                updated: true,
                result: apiResult,
              },
              file: {
                path: configPath,
                persisted: persistResult.success,
                error: persistResult.error,
              },
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          'Configuring model',
          error,
          ERROR_SUGGESTIONS.invalidInput
        );
      }
    },

    async opencode_provider_list() {
      try {
        const { providers, defaults } = await client.listProviders();
        
        const typedProviders = providers as ProviderData[];
        
        const output = typedProviders.map((provider: ProviderData) => {
          let modelCount = 0;
          if (provider.models) {
            modelCount = Array.isArray(provider.models) 
              ? provider.models.length 
              : Object.keys(provider.models).length;
          }
          
          return {
            id: provider.id,
            name: provider.name,
            modelCount,
            defaultModel: defaults[provider.id],
          };
        });

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing providers',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_config_get() {
      try {
        // Detect config file path
        const configPath = detectConfigPath(process.env.OPENCODE_DEFAULT_PROJECT);
        
        // Read from config file (this is where we persist settings)
        let openCodeConfig: Record<string, unknown> = {};
        if (configPath) {
          openCodeConfig = readOpenCodeConfig(configPath);
        }
        
        // Extract only MCP-relevant settings
        const relevantKeys = ['model', 'small_model', 'default_agent', 'provider'];
        const filteredConfig = Object.fromEntries(
          Object.entries(openCodeConfig)
            .filter(([k]) => relevantKeys.includes(k))
            .filter(([, v]) => v !== undefined && v !== null)
        );
        
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            mcpServer: {
              serverUrl: process.env.OPENCODE_SERVER_URL || 'http://localhost:4096',
              autoStart: process.env.OPENCODE_AUTO_START !== 'false',
              timeout: parseInt(process.env.OPENCODE_TIMEOUT || '120000', 10),
              transport: process.env.MCP_TRANSPORT || 'stdio',
              defaultProject: process.env.OPENCODE_DEFAULT_PROJECT,
              configPath: configPath,
            },
            openCode: filteredConfig,
          }, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Getting configuration',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_config_update(params: { 
      model?: string; 
      smallModel?: string; 
      defaultAgent?: string;
    }) {
      try {
        // Build config updates (convert to opencode.json format)
        const updates: Record<string, unknown> = {};
        if (params.model) updates.model = params.model;
        if (params.smallModel) updates.small_model = params.smallModel;
        if (params.defaultAgent) updates.default_agent = params.defaultAgent;
        
        // 1. Update runtime config via API
        const apiResult = await client.updateConfig(updates);
        
        // 2. Persist to opencode.json file
        const configPath = detectConfigPath(process.env.OPENCODE_DEFAULT_PROJECT);
        let persistResult: { success: boolean; error?: string } = { success: false, error: 'Config path not detected' };
        
        if (configPath) {
          persistResult = writeOpenCodeConfig(configPath, updates);
        }
        
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              success: true,
              message: 'Configuration updated',
              updates,
              api: {
                updated: true,
                result: apiResult,
              },
              file: {
                path: configPath,
                persisted: persistResult.success,
                error: persistResult.error,
              },
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          'Updating configuration',
          error,
          ERROR_SUGGESTIONS.invalidInput
        );
      }
    },
  };
}

export type ConfigHandlers = ReturnType<typeof createConfigHandlers>;
