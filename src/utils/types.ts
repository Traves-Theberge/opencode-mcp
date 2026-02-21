/**
 * OpenCode MCP Server - Type Definitions
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  /** OpenCode server URL */
  serverUrl: string;
  /** Auto-start OpenCode server if not running */
  autoStart: boolean;
  /** Default timeout for operations in ms */
  timeout: number;
  /** Default model to use (provider/model format) */
  defaultModel?: string;
  /** MCP transport mode */
  transport: 'stdio' | 'http';
  /** HTTP port for HTTP transport */
  httpPort?: number;
}

export const DEFAULT_CONFIG: ServerConfig = {
  serverUrl: 'http://localhost:4096',
  autoStart: true,
  timeout: 120000,
  transport: 'stdio',
};

// ============================================================================
// OpenCode SDK Types
// ============================================================================

export interface ModelRef {
  providerID: string;
  modelID: string;
}

export interface Session {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  parentID?: string;
  shareToken?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  createdAt: string;
  sessionID: string;
}

export interface Part {
  type: 'text' | 'image' | 'code' | 'tool_call' | 'tool_result';
  text?: string;
  data?: string;
  mimeType?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
}

export interface Agent {
  name: string;
  description: string;
  mode: 'primary' | 'subagent';
  model?: string;
  hidden?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  models: ProviderModel[];
}

export interface ProviderModel {
  id: string;
  name: string;
  options?: Record<string, unknown>;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface FileContent {
  type: 'raw' | 'patch';
  content: string;
}

export interface SearchResult {
  path: string;
  lines: string;
  line_number: number;
  absolute_offset: number;
  submatches: Array<{
    match: string;
    start: number;
    end: number;
  }>;
}

export interface Symbol {
  name: string;
  kind: string;
  path: string;
  line?: number;
}

// ============================================================================
// Tool Input/Output Types
// ============================================================================

// Execution Tools
export interface OpenCodeRunInput {
  prompt: string;
  model?: string;
  agent?: string;
  workingDirectory?: string;
  files?: string[];
  noReply?: boolean;
  structuredOutput?: {
    schema: Record<string, unknown>;
  };
}

export interface OpenCodeRunOutput {
  sessionId: string;
  messageId: string;
  content: string;
  structuredOutput?: unknown;
}

export interface SessionCreateInput {
  title?: string;
  model?: string;
  agent?: string;
  workingDirectory?: string;
}

export interface SessionPromptInput {
  sessionId: string;
  prompt: string;
  files?: string[];
  noReply?: boolean;
}

// File Tools
export interface FileReadInput {
  path: string;
}

export interface FileSearchInput {
  pattern: string;
  directory?: string;
}

export interface FindFilesInput {
  query: string;
  type?: 'file' | 'directory';
  limit?: number;
}

// Agent Tools
export interface AgentDelegateInput {
  agent: string;
  prompt: string;
  sessionId?: string;
}

// ============================================================================
// MCP Types
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class OpenCodeMCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'OpenCodeMCPError';
  }
}

export const ErrorCodes = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
