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

// ============================================================================
// Client Interface
// ============================================================================

export interface OpenCodeClient {
  isHealthy(): Promise<boolean>;
  listSessions(): Promise<unknown[]>;
  createSession(title?: string, model?: { providerID: string; modelID: string }, directory?: string): Promise<{ id: string; title?: string; directory?: string }>;
  getSession(id: string): Promise<unknown>;
  getSessionMessage(sessionId: string, messageId: string): Promise<{ info?: unknown; parts?: unknown[] }>;
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

  // v2 API uses Basic auth: username "opencode", password from service.json / env
  const password = config.serverPassword ?? process.env.OPENCODE_PASSWORD;
  const authHeader = password
    ? `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}`
    : undefined;
  if (!authHeader) {
    console.error('[createClient] WARNING: no server password found (OPENCODE_PASSWORD / service.json) — requests may fail with 401');
  }

  const authFetch = authHeader
    ? (request: Request): ReturnType<typeof fetch> => {
        const headers = new Headers(request.headers);
        headers.set('authorization', authHeader);
        return fetch(new Request(request, { headers }));
      }
    : undefined;
  
  const client = createOpencodeClient({
    baseUrl: config.serverUrl,
    directory: defaultDirectory,
    responseStyle: 'data',
    ...(authFetch && { fetch: authFetch }),
  });

  let connected = false;
  const timeout = config.timeout ?? 120000;

  const apiHeaders: Record<string, string> = { accept: 'application/json' };
  if (authHeader) {
    apiHeaders.authorization = authHeader;
  }

  function unwrap<T>(body: unknown): T {
    if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
      return (body as Record<string, unknown>).data as T;
    }
    return body as T;
  }

  async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${config.serverUrl}${path}`, {
      method,
      headers: {
        ...apiHeaders,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`OpenCode API ${method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
    }
    if (!text) {
      return undefined as T;
    }
    return unwrap<T>(JSON.parse(text));
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  interface V2Message {
    id: string;
    time: { created: number };
    type: 'user' | 'assistant' | 'idle' | string;
    agent?: string;
    content?: Array<{ type: string; text?: string }>;
  }

  async function waitForIdle(sessionId: string, since: number): Promise<V2Message[]> {
    const deadline = Date.now() + timeout;
    for (;;) {
      await sleep(2000);
      const messages = await api<V2Message[]>(
        'GET',
        `/session/${encodeURIComponent(sessionId)}/message?limit=30`
      );
      const idle = Array.isArray(messages)
        ? messages.find((m) => m.type === 'idle' && m.time.created >= since)
        : undefined;
      if (idle) {
        return Array.isArray(messages) ? messages : [];
      }
      if (Date.now() >= deadline) {
        throw new OpenCodeMCPError(
          `Prompt timed out after ${timeout}ms (session ${sessionId}) — poll opencode_session_list / message API for the result`,
          ErrorCodes.TIMEOUT
        );
      }
    }
  }

  function extractAssistantText(messages: V2Message[], idleCreated: number): { id: string; text: string } {
    const assistants = messages.filter(
      (m) => m.type === 'assistant' && m.time.created <= idleCreated
    );
    assistants.sort((a, b) => b.time.created - a.time.created);
    const latest = assistants[0];
    if (!latest) {
      return { id: '', text: '' };
    }
    const text = (latest.content ?? [])
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text as string)
      .join('\n');
    return { id: latest.id, text };
  }

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
    model?: { providerID: string; modelID: string },
    directory?: string
  ): Promise<{ id: string; title?: string; directory?: string }> {
    await ensureConnected();

    // Use provided directory or default from env
    const effectiveDirectory = directory ?? process.env.OPENCODE_DEFAULT_PROJECT;

    // Debug logging
    console.error(`[createSession] Requested directory: ${directory ?? 'not specified'}`);
    console.error(`[createSession] Effective directory: ${effectiveDirectory ?? 'not specified'}`);

    // v2 API: directory goes in body.location (query param is ignored by the server)
    const created = await withTimeout(
      () => api<{ id: string; title?: string; location?: { directory?: string } }>(
        'POST',
        '/session',
        {
          ...(title ? { title } : {}),
          ...(effectiveDirectory ? { location: { directory: effectiveDirectory } } : {}),
          ...(model ? { model } : {}),
        }
      ),
      'Create session'
    );

    const session = validateWithSchema(created, SessionSchema, 'createSession');

    // Log what we got back
    console.error(`[createSession] Session response:`, JSON.stringify(session, null, 2));

    return {
      id: session?.id ?? '',
      title: session?.title,
      directory: (created as { location?: { directory?: string } })?.location?.directory ?? effectiveDirectory,
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

  async function getSessionMessage(sessionId: string, messageId: string): Promise<{ info?: unknown; parts?: unknown[] }> {
    await ensureConnected();
    const result = await withTimeout(
      () => client.session.message({ path: { id: sessionId, messageID: messageId } }),
      'Get session message'
    );
    return result.data ?? {};
  }

  async function abortSession(id: string): Promise<boolean> {
    await ensureConnected();
    // v2 API uses /interrupt (SDK's /abort does not exist on the v2 server)
    await withTimeout(
      () => api('POST', `/session/${encodeURIComponent(id)}/interrupt`, {}),
      'Abort session'
    );
    return true;
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

    // v2 API: POST /session/{id}/prompt with {text} (SDK's /message POST 404s on v2).
    // The call only queues the turn — poll messages until the idle marker appears.
    const since = Date.now();
    const posted = await withTimeout(
      () =>
        api<{ id: string }>('POST', `/session/${encodeURIComponent(sessionId)}/prompt`, {
          text: promptText,
          ...(options?.model && { model: options.model }),
          ...(options?.agent && { agent: options.agent }),
          ...(options?.noReply && { noReply: true }),
        }),
      'Send prompt'
    );

    if (options?.noReply) {
      return { sessionId, messageId: posted?.id ?? '', content: '' };
    }

    const messages = await waitForIdle(sessionId, since);
    const idleCreated = Math.max(
      ...messages
        .filter((m) => m.type === 'idle' && m.time.created >= since)
        .map((m) => m.time.created)
    );
    const { id, text } = extractAssistantText(messages, idleCreated);

    return {
      sessionId,
      messageId: id || posted?.id || '',
      content: text,
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
    // v2 server dropped /config/providers — join /provider with /model (grouped by providerID)
    const [providers, models] = await withTimeout(async () => {
      const [p, m] = await Promise.all([
        api<unknown[]>('GET', '/provider'),
        api<Array<{ id?: string; modelID?: string; providerID?: string; name?: string }>>('GET', '/model'),
      ]);
      return [Array.isArray(p) ? p : [], Array.isArray(m) ? m : []] as const;
    }, 'List providers');
    const byProvider = new Map<string, Array<{ id: string; name: string }>>();
    for (const m of models) {
      const pid = m.providerID ?? '';
      const entry = { id: m.modelID ?? m.id ?? '', name: m.name ?? m.modelID ?? m.id ?? '' };
      if (!entry.id) {
        continue;
      }
      const list = byProvider.get(pid) ?? [];
      list.push(entry);
      byProvider.set(pid, list);
    }
    const enriched = (providers as Array<{ id?: string } & Record<string, unknown>>).map((p) => ({
      ...p,
      models: byProvider.get(p.id ?? '') ?? [],
    }));
    const validated = enriched.map(
      (p) => validateWithSchema(p, ProviderSchema, 'listProviders')
    );
    return { providers: validated, defaults: {} };
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
    getSessionMessage,
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
