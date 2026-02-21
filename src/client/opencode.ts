/**
 * OpenCode SDK Client Wrapper
 * 
 * Provides a type-safe interface to the OpenCode server with
 * connection management, error handling, and retry logic.
 */

import { createOpencodeClient } from '@opencode-ai/sdk';
import type {
  ServerConfig,
  Session,
  Agent,
  Provider,
  FileContent,
  SearchResult,
  Symbol,
  OpenCodeRunOutput,
  ModelRef,
} from '../utils/types.js';
import { OpenCodeMCPError, ErrorCodes, parseModelString } from '../utils/types.js';

export interface OpenCodeClient {
  isHealthy(): Promise<boolean>;
  listSessions(): Promise<Session[]>;
  createSession(title?: string, model?: ModelRef): Promise<Session>;
  getSession(id: string): Promise<Session>;
  abortSession(id: string): Promise<boolean>;
  shareSession(id: string): Promise<Session>;
  prompt(sessionId: string, prompt: string, options?: PromptOptions): Promise<OpenCodeRunOutput>;
  listAgents(): Promise<Agent[]>;
  listProviders(): Promise<{ providers: Provider[]; defaults: Record<string, string> }>;
  readFile(path: string): Promise<FileContent>;
  searchText(pattern: string, directory?: string): Promise<SearchResult[]>;
  findFiles(query: string, type?: 'file' | 'directory', limit?: number): Promise<string[]>;
  findSymbols(query: string): Promise<Symbol[]>;
  disconnect(): void;
}

export interface PromptOptions {
  model?: ModelRef;
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
      const result = await client.global.health();
      return result.data?.healthy === true;
    } catch {
      return false;
    }
  }

  async function listSessions(): Promise<Session[]> {
    await ensureConnected();
    const result = await client.session.list();
    return result.data as Session[];
  }

  async function createSession(title?: string, model?: ModelRef): Promise<Session> {
    await ensureConnected();
    const result = await client.session.create({
      body: {
        title,
        model,
      },
    });
    return result.data as Session;
  }

  async function getSession(id: string): Promise<Session> {
    await ensureConnected();
    const result = await client.session.get({ path: { id } });
    return result.data as Session;
  }

  async function abortSession(id: string): Promise<boolean> {
    await ensureConnected();
    const result = await client.session.abort({ path: { id } });
    return result.data === true;
  }

  async function shareSession(id: string): Promise<Session> {
    await ensureConnected();
    const result = await client.session.share({ path: { id } });
    return result.data as Session;
  }

  async function prompt(
    sessionId: string,
    promptText: string,
    options?: PromptOptions
  ): Promise<OpenCodeRunOutput> {
    await ensureConnected();
    
    const body: Record<string, unknown> = {
      parts: [{ type: 'text', text: promptText }],
    };

    if (options?.model) {
      body.model = options.model;
    }

    if (options?.agent) {
      body.agent = options.agent;
    }

    if (options?.files && options.files.length > 0) {
      body.files = options.files;
    }

    if (options?.noReply) {
      body.noReply = true;
    }

    if (options?.structuredOutput) {
      body.format = {
        type: 'json_schema',
        schema: options.structuredOutput.schema,
      };
    }

    const result = await client.session.prompt({
      path: { id: sessionId },
      body,
    });

    const response = result.data;
    
    // Extract content from parts
    let content = '';
    let structuredOutput: unknown;
    
    if (response.parts) {
      for (const part of response.parts) {
        if (part.type === 'text' && part.text) {
          content += part.text;
        }
      }
    }

    // Check for structured output
    if ('info' in response && response.info && 'structured_output' in response.info) {
      structuredOutput = (response.info as { structured_output?: unknown }).structured_output;
    }

    return {
      sessionId,
      messageId: response.info?.id ?? '',
      content,
      structuredOutput,
    };
  }

  async function listAgents(): Promise<Agent[]> {
    await ensureConnected();
    const result = await client.app.agents();
    return result.data as Agent[];
  }

  async function listProviders(): Promise<{ providers: Provider[]; defaults: Record<string, string> }> {
    await ensureConnected();
    const result = await client.config.providers();
    return result.data as { providers: Provider[]; defaults: Record<string, string> };
  }

  async function readFile(path: string): Promise<FileContent> {
    await ensureConnected();
    const result = await client.file.read({ query: { path } });
    return result.data as FileContent;
  }

  async function searchText(pattern: string, directory?: string): Promise<SearchResult[]> {
    await ensureConnected();
    const result = await client.find.text({
      query: {
        pattern,
        ...(directory && { directory }),
      },
    });
    return result.data as SearchResult[];
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
    return result.data as string[];
  }

  async function findSymbols(query: string): Promise<Symbol[]> {
    await ensureConnected();
    const result = await client.find.symbols({ query: { query } });
    return result.data as Symbol[];
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
export function resolveModel(modelStr: string | undefined, defaultModel?: string): ModelRef | undefined {
  const toUse = modelStr ?? defaultModel;
  if (!toUse) return undefined;
  
  const parsed = parseModelString(toUse);
  if (!parsed) return undefined;
  
  return { providerID: parsed.providerID, modelID: parsed.modelID };
}
