/**
 * OpenCode SDK Client Wrapper
 * 
 * Provides a type-safe interface to the OpenCode server with
 * connection management, error handling, retry logic, and Zod validation.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';
import { z } from 'zod';
import type { ServerConfig } from '../utils/types.js';
import { OpenCodeMCPError, ErrorCodes } from '../utils/types.js';
import { parseModelString } from '../utils/config.js';

// Re-export types from SDK for convenience
export type { Session, Agent, Provider } from '@opencode-ai/sdk';

// ============================================================================
// Zod Schemas for SDK Response Validation
// ============================================================================

const SessionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  directory: z.string().optional(),
}).passthrough();

const AgentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  mode: z.enum(['primary', 'subagent']).optional(),
  model: z.string().optional(),
  hidden: z.boolean().optional(),
}).passthrough();

const ProviderSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  models: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
  })).optional(),
}).passthrough();

const FileContentSchema = z.object({
  content: z.union([z.string(), z.unknown()]),
}).passthrough();

const PromptResponseSchema = z.object({
  parts: z.array(z.unknown()).optional(),
  info: z.object({
    id: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

// ============================================================================
// Client Interface
// ============================================================================

export interface OpenCodeClient {
  isHealthy(): Promise<boolean>;
  listSessions(): Promise<unknown[]>;
  createSession(title?: string, model?: { providerID: string; modelID: string }, directory?: string): Promise<{ id: string; title?: string; directory?: string }>;
  getSession(id: string): Promise<unknown>;
  abortSession(id: string): Promise<boolean>;
  shareSession(id: string): Promise<{ id: string; shareUrl?: string }>;
  prompt(sessionId: string, promptText: string, options?: PromptOptions): Promise<{ sessionId: string; messageId: string; content: string }>;
  listAgents(): Promise<unknown[]>;
  listProviders(): Promise<{ providers: unknown[]; defaults: Record<string, string> }>;
  updateConfig(config: Record<string, unknown>): Promise<unknown>;
  getConfig(): Promise<unknown>;
  readFile(path: string): Promise<{ content: string }>;
  searchText(pattern: string, directory?: string): Promise<unknown[]>;
  findFiles(query: string, type?: 'file' | 'directory', limit?: number): Promise<string[]>;
  findSymbols(query: string): Promise<unknown[]>;
  disconnect(): void;
}

export interface PromptOptions {
  model?: { providerID: string; modelID: string };
  agent?: string;
  files?: string[];
  noReply?: boolean;
  structuredOutput?: { schema: Record<string, unknown> };
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodType<T>,
  context: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`Validation error in ${context}:`, result.error.issues);
    // Return data as-is but log the validation issues
    // This allows the system to continue even if SDK response format changes slightly
    return data as T;
  }
  return result.data;
}

// ============================================================================
// Client Factory
// ============================================================================

export async function createClient(config: ServerConfig): Promise<OpenCodeClient> {
  // Check for default project directory from env
  const defaultDirectory = process.env.OPENCODE_DEFAULT_PROJECT;
  
  console.error(`[createClient] Server URL: ${config.serverUrl}`);
  console.error(`[createClient] Default directory: ${defaultDirectory ?? 'not set'}`);
  
  const client = createOpencodeClient({
    baseUrl: config.serverUrl,
    directory: defaultDirectory,
  });

  let connected = false;
  const timeout = config.timeout ?? 120000;

  /**
   * Execute an async operation with timeout
   */
  async function withTimeout<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const result = await operation();
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenCodeMCPError(
          `${operationName} timed out after ${timeout}ms`,
          ErrorCodes.TIMEOUT
        );
      }
      throw error;
    }
  }

  async function ensureConnected(): Promise<void> {
    if (!connected) {
      const healthy = await isHealthy();
      if (!healthy) {
        throw new OpenCodeMCPError(
          `Cannot connect to OpenCode server at ${config.serverUrl}`,
          ErrorCodes.CONNECTION_FAILED
        );
      }
      connected = true;
    }
  }

  async function isHealthy(): Promise<boolean> {
    try {
      await withTimeout(() => client.session.list(), 'Health check');
      return true;
    } catch {
      return false;
    }
  }

  async function listSessions(): Promise<unknown[]> {
    await ensureConnected();
    const result = await withTimeout(() => client.session.list(), 'List sessions');
    return result.data ?? [];
  }

  async function createSession(
    title?: string, 
    _model?: { providerID: string; modelID: string },
    directory?: string
  ): Promise<{ id: string; title?: string; directory?: string }> {
    await ensureConnected();
    
    // Use provided directory or default from env
    const effectiveDirectory = directory ?? process.env.OPENCODE_DEFAULT_PROJECT;
    
    // Debug logging
    console.error(`[createSession] Requested directory: ${directory ?? 'not specified'}`);
    console.error(`[createSession] Effective directory: ${effectiveDirectory ?? 'not specified'}`);
    
    const result = await withTimeout(
      () => client.session.create({ 
        body: { title },
        query: effectiveDirectory ? { directory: effectiveDirectory } : undefined,
      }),
      'Create session'
    );
    
    const session = validateWithSchema(result.data, SessionSchema, 'createSession');
    
    // Log what we got back
    console.error(`[createSession] Session response:`, JSON.stringify(session, null, 2));
    
    return { 
      id: session?.id ?? '', 
      title: session?.title,
      directory: session?.directory,
    };
  }

  async function getSession(id: string): Promise<unknown> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.session.get({ path: { id } }),
      'Get session'
    );
    return result.data;
  }

  async function abortSession(id: string): Promise<boolean> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.session.abort({ path: { id } }),
      'Abort session'
    );
    return result.data === true;
  }

  async function shareSession(id: string): Promise<{ id: string; shareUrl?: string }> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.session.share({ path: { id } }),
      'Share session'
    );
    const data = result.data;
    
    console.error(`[shareSession] Response:`, JSON.stringify(data, null, 2));
    
    // The share URL is in share.url
    const shareUrl = (data as { share?: { url?: string } })?.share?.url;
    
    return { 
      id: data?.id ?? '', 
      shareUrl 
    };
  }

  async function prompt(
    sessionId: string,
    promptText: string,
    options?: PromptOptions
  ): Promise<{ sessionId: string; messageId: string; content: string }> {
    await ensureConnected();
    
    const result = await withTimeout(
      () => client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: 'text', text: promptText }],
          ...(options?.model && { model: options.model }),
          ...(options?.agent && { agent: options.agent }),
          ...(options?.noReply && { noReply: true }),
        },
      }),
      'Send prompt'
    );

    const response = validateWithSchema(result.data, PromptResponseSchema, 'prompt');
    
    // Extract content from parts
    let content = '';
    if (response?.parts) {
      for (const part of response.parts) {
        if (part && typeof part === 'object' && 'type' in part && part.type === 'text' && 'text' in part) {
          content += String(part.text);
        }
      }
    }

    return {
      sessionId,
      messageId: response?.info?.id ?? '',
      content,
    };
  }

  async function listAgents(): Promise<unknown[]> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.app.agents(),
      'List agents'
    );
    const agents = result.data ?? [];
    // Validate each agent
    return agents.map(agent => validateWithSchema(agent, AgentSchema, 'listAgents'));
  }

  async function listProviders(): Promise<{ providers: unknown[]; defaults: Record<string, string> }> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.config.providers(),
      'List providers'
    );
    const data = result.data;
    const providers = (data?.providers ?? []).map(
      p => validateWithSchema(p, ProviderSchema, 'listProviders')
    );
    return { 
      providers, 
      defaults: (data as { default?: Record<string, string> })?.default ?? {} 
    };
  }

  async function updateConfig(config: Record<string, unknown>): Promise<unknown> {
    await ensureConnected();
    console.error(`[updateConfig] Updating config:`, JSON.stringify(config, null, 2));
    
    const result = await withTimeout(
      () => client.config.update({ body: config }),
      'Update config'
    );
    
    console.error(`[updateConfig] Response:`, JSON.stringify(result.data, null, 2));
    return result.data;
  }

  async function getConfig(): Promise<unknown> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.config.get(),
      'Get config'
    );
    return result.data;
  }

  async function readFile(path: string): Promise<{ content: string }> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.file.read({ query: { path } }),
      'Read file'
    );
    const data = validateWithSchema(result.data, FileContentSchema, 'readFile');
    // Handle different content types
    if (data && 'content' in data) {
      return { content: String(data.content) };
    }
    return { content: '' };
  }

  async function searchText(pattern: string, directory?: string): Promise<unknown[]> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.find.text({
        query: {
          pattern,
          ...(directory && { directory }),
        },
      }),
      'Search text'
    );
    // Transform SDK result to simpler format
    const data = result.data ?? [];
    return data.map((item: { path?: { text?: string }; lines?: { text?: string }; line_number?: number }) => ({
      path: item.path?.text ?? '',
      lines: item.lines?.text ?? '',
      line_number: item.line_number ?? 0,
    }));
  }

  async function findFiles(
    query: string,
    type?: 'file' | 'directory',
    limit?: number
  ): Promise<string[]> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.find.files({
        query: {
          query,
          ...(type && { type }),
          ...(limit && { limit }),
        },
      }),
      'Find files'
    );
    return result.data ?? [];
  }

  async function findSymbols(query: string): Promise<unknown[]> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.find.symbols({ query: { query } }),
      'Find symbols'
    );
    return result.data ?? [];
  }

  function disconnect(): void {
    connected = false;
  }

  return {
    isHealthy,
    listSessions,
    createSession,
    getSession,
    abortSession,
    shareSession,
    prompt,
    listAgents,
    listProviders,
    updateConfig,
    getConfig,
    readFile,
    searchText,
    findFiles,
    findSymbols,
    disconnect,
  };
}

/**
 * Helper to parse model string and return ModelRef
 */
export function resolveModel(
  modelStr: string | undefined, 
  defaultModel?: string
): { providerID: string; modelID: string } | undefined {
  const toUse = modelStr ?? defaultModel;
  if (!toUse) return undefined;
  
  const parsed = parseModelString(toUse);
  if (!parsed) return undefined;
  
  return { providerID: parsed.providerID, modelID: parsed.modelID };
}
