/**
 * OpenCode SDK Client Wrapper
 * 
 * Provides a type-safe interface to the OpenCode server with
 * connection management, error handling, and retry logic.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';
import type { ServerConfig } from '../utils/types.js';
import { OpenCodeMCPError, ErrorCodes } from '../utils/types.js';
import { parseModelString } from '../utils/config.js';

// Re-export types from SDK for convenience
export type { Session, Agent, Provider } from '@opencode-ai/sdk';

export interface OpenCodeClient {
  isHealthy(): Promise<boolean>;
  listSessions(): Promise<unknown[]>;
  createSession(title?: string, model?: { providerID: string; modelID: string }): Promise<{ id: string; title?: string }>;
  getSession(id: string): Promise<unknown>;
  abortSession(id: string): Promise<boolean>;
  shareSession(id: string): Promise<{ id: string; shareToken?: string }>;
  prompt(sessionId: string, promptText: string, options?: PromptOptions): Promise<{ sessionId: string; messageId: string; content: string }>;
  listAgents(): Promise<unknown[]>;
  listProviders(): Promise<{ providers: unknown[]; defaults: Record<string, string> }>;
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

export async function createClient(config: ServerConfig): Promise<OpenCodeClient> {
  const client = createOpencodeClient({
    baseUrl: config.serverUrl,
  });

  let connected = false;

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
      // Try a simple API call to check health
      await client.session.list();
      return true;
    } catch {
      return false;
    }
  }

  async function listSessions(): Promise<unknown[]> {
    await ensureConnected();
    const result = await client.session.list();
    return result.data ?? [];
  }

  async function createSession(
    title?: string, 
    _model?: { providerID: string; modelID: string }
  ): Promise<{ id: string; title?: string }> {
    await ensureConnected();
    const result = await client.session.create({
      body: { title },
    });
    const session = result.data;
    return { id: session?.id ?? '', title: session?.title };
  }

  async function getSession(id: string): Promise<unknown> {
    await ensureConnected();
    const result = await client.session.get({ path: { id } });
    return result.data;
  }

  async function abortSession(id: string): Promise<boolean> {
    await ensureConnected();
    const result = await client.session.abort({ path: { id } });
    return result.data === true;
  }

  async function shareSession(id: string): Promise<{ id: string; shareToken?: string }> {
    await ensureConnected();
    const result = await client.session.share({ path: { id } });
    const data = result.data;
    return { id: data?.id ?? '', shareToken: (data as { shareToken?: string })?.shareToken };
  }

  async function prompt(
    sessionId: string,
    promptText: string,
    options?: PromptOptions
  ): Promise<{ sessionId: string; messageId: string; content: string }> {
    await ensureConnected();
    
    const result = await client.session.prompt({
      path: { id: sessionId },
      body: {
        parts: [{ type: 'text', text: promptText }],
        ...(options?.model && { model: options.model }),
        ...(options?.agent && { agent: options.agent }),
        ...(options?.noReply && { noReply: true }),
      },
    });

    const response = result.data;
    
    // Extract content from parts
    let content = '';
    if (response?.parts) {
      for (const part of response.parts) {
        if (part.type === 'text' && 'text' in part) {
          content += part.text;
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
    const result = await client.app.agents();
    return result.data ?? [];
  }

  async function listProviders(): Promise<{ providers: unknown[]; defaults: Record<string, string> }> {
    await ensureConnected();
    const result = await client.config.providers();
    const data = result.data;
    return { 
      providers: data?.providers ?? [], 
      defaults: (data as { default?: Record<string, string> })?.default ?? {} 
    };
  }

  async function readFile(path: string): Promise<{ content: string }> {
    await ensureConnected();
    const result = await client.file.read({ query: { path } });
    const data = result.data;
    // Handle different content types
    if (data && 'content' in data) {
      return { content: String(data.content) };
    }
    return { content: '' };
  }

  async function searchText(pattern: string, directory?: string): Promise<unknown[]> {
    await ensureConnected();
    const result = await client.find.text({
      query: {
        pattern,
        ...(directory && { directory }),
      },
    });
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
    const result = await client.find.files({
      query: {
        query,
        ...(type && { type }),
        ...(limit && { limit }),
      },
    });
    return result.data ?? [];
  }

  async function findSymbols(query: string): Promise<unknown[]> {
    await ensureConnected();
    const result = await client.find.symbols({ query: { query } });
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
