/**
 * Output Schemas and Tool Annotations
 * 
 * Defines structured output schemas and MCP tool annotations for better
 * LLM discoverability and response handling.
 */

import { z } from 'zod';

// ============================================================================
// Pagination Schema
// ============================================================================

export const PaginationSchema = {
  limit: z.number().min(1).max(100).optional().describe('Maximum number of results to return (1-100, default: 20)'),
  offset: z.number().min(0).optional().describe('Number of results to skip (for pagination)'),
  cursor: z.string().optional().describe('Pagination cursor from previous response'),
};

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  hasMore: boolean;
  cursor?: string;
}

export function createPaginatedResponse<T>(
  items: T[],
  limit?: number,
  offset?: number,
  total?: number
): PaginatedResponse<T> {
  const effectiveLimit = limit ?? 20;
  const hasMore = total !== undefined ? offset !== undefined && offset + effectiveLimit < total : items.length === effectiveLimit;
  
  return {
    items,
    total,
    hasMore,
    cursor: hasMore ? String((offset ?? 0) + effectiveLimit) : undefined,
  };
}

// ============================================================================
// Tool Annotations (per MCP spec 2024-11-05)
// ============================================================================

export interface ToolAnnotations {
  /** If true, the tool does not modify its environment */
  readOnlyHint: boolean;
  /** If true, the tool may perform destructive updates */
  destructiveHint: boolean;
  /** If true, calling the tool repeatedly with the same arguments has no additional effect */
  idempotentHint: boolean;
  /** If true, this tool may interact with an "open world" of external entities */
  openWorldHint: boolean;
}

/**
 * Annotation presets for common tool categories
 */
export const ANNOTATIONS = {
  // Read-only tools that don't modify state
  readOnly: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  } satisfies ToolAnnotations,

  // Tools that read from external services
  readOnlyExternal: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  } satisfies ToolAnnotations,

  // Tools that modify local state
  writeLocal: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  } satisfies ToolAnnotations,

  // Tools that interact with external services and may modify state
  writeExternal: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  } satisfies ToolAnnotations,

  // Tools that create new resources (non-destructive)
  create: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  } satisfies ToolAnnotations,
} as const;

/**
 * Tool annotations by tool name
 */
export const TOOL_ANNOTATIONS: Record<string, ToolAnnotations> = {
  // Execution tools - interact with OpenCode server (external)
  opencode_run: ANNOTATIONS.writeExternal,
  opencode_session_create: ANNOTATIONS.create,
  opencode_session_prompt: ANNOTATIONS.writeExternal,
  opencode_session_list: ANNOTATIONS.readOnlyExternal,
  opencode_session_abort: ANNOTATIONS.writeExternal,

  // File tools - read operations
  opencode_file_read: ANNOTATIONS.readOnlyExternal,
  opencode_file_search: ANNOTATIONS.readOnlyExternal,
  opencode_find_files: ANNOTATIONS.readOnlyExternal,
  opencode_find_symbols: ANNOTATIONS.readOnlyExternal,

  // Config tools - read and modify configuration
  opencode_model_list: ANNOTATIONS.readOnlyExternal,
  opencode_model_configure: ANNOTATIONS.writeExternal,
  opencode_provider_list: ANNOTATIONS.readOnlyExternal,
  opencode_config_get: ANNOTATIONS.readOnlyExternal,
  opencode_config_update: ANNOTATIONS.writeExternal,

  // Agent tools
  opencode_agent_list: ANNOTATIONS.readOnlyExternal,
  opencode_agent_delegate: ANNOTATIONS.writeExternal,

  // Skill tools
  opencode_skill_list: ANNOTATIONS.readOnlyExternal,
  opencode_skill_create: ANNOTATIONS.create,

  // MCP management tools
  opencode_mcp_list: ANNOTATIONS.readOnlyExternal,
  opencode_mcp_enable: ANNOTATIONS.writeExternal,

  // Tool config tools
  opencode_tool_list: ANNOTATIONS.readOnlyExternal,
};

// ============================================================================
// Output Schemas
// ============================================================================

/**
 * Base response wrapper for all tools
 */
export const BaseResponseSchema = z.object({
  success: z.boolean().describe('Whether the operation succeeded'),
  error: z.string().optional().describe('Error message if operation failed'),
  suggestion: z.string().optional().describe('Suggested action to resolve error'),
});

/**
 * Session reference schema
 */
export const SessionRefSchema = z.object({
  sessionId: z.string().describe('Unique session identifier'),
  title: z.string().optional().describe('Session title'),
});

/**
 * Message reference schema
 */
export const MessageRefSchema = z.object({
  messageId: z.string().describe('Unique message identifier'),
  sessionId: z.string().describe('Associated session ID'),
});

// Execution tool output schemas
export const RunOutputSchema = z.object({
  sessionId: z.string().describe('The session ID for this conversation'),
  messageId: z.string().describe('The message ID of the response'),
  content: z.string().describe('The response content from OpenCode'),
});

export const SessionCreateOutputSchema = z.object({
  sessionId: z.string().describe('The new session ID'),
  title: z.string().optional().describe('Session title if provided'),
});

export const SessionPromptOutputSchema = z.object({
  sessionId: z.string().describe('The session ID'),
  messageId: z.string().describe('The message ID'),
  content: z.string().describe('The response content'),
});

export const SessionListOutputSchema = z.array(z.object({
  id: z.string().describe('Session ID'),
  title: z.string().optional().describe('Session title'),
  createdAt: z.string().optional().describe('Creation timestamp'),
}));

export const SessionAbortOutputSchema = z.object({
  success: z.boolean().describe('Whether abort succeeded'),
});

export const SessionShareOutputSchema = z.object({
  shareUrl: z.string().url().describe('Shareable URL for the session'),
});

// File tool output schemas
export const FileReadOutputSchema = z.object({
  content: z.string().describe('File contents'),
  path: z.string().optional().describe('Resolved file path'),
});

export const FileSearchOutputSchema = z.array(z.object({
  path: z.string().describe('File path'),
  line: z.number().optional().describe('Line number'),
  content: z.string().optional().describe('Matched content'),
}));

export const FindFilesOutputSchema = z.array(z.string().describe('File path'));

export const FindSymbolsOutputSchema = z.array(z.object({
  name: z.string().describe('Symbol name'),
  kind: z.string().optional().describe('Symbol kind (function, class, etc.)'),
  path: z.string().optional().describe('File path containing symbol'),
  line: z.number().optional().describe('Line number'),
}));

// Config tool output schemas
export const ModelListOutputSchema = z.array(z.object({
  provider: z.string().describe('Provider ID'),
  name: z.string().describe('Provider display name'),
  models: z.array(z.object({
    id: z.string().describe('Model ID'),
    name: z.string().describe('Model display name'),
    default: z.boolean().optional().describe('Is default model'),
  })),
}));

export const ProviderListOutputSchema = z.array(z.object({
  id: z.string().describe('Provider ID'),
  name: z.string().describe('Provider display name'),
  modelCount: z.number().describe('Number of available models'),
  defaultModel: z.string().optional().describe('Default model ID'),
}));

export const ConfigGetOutputSchema = z.object({
  serverUrl: z.string().describe('OpenCode server URL'),
  autoStart: z.boolean().describe('Auto-start setting'),
  timeout: z.number().describe('Request timeout in ms'),
  defaultModel: z.string().optional().describe('Default model'),
  transport: z.enum(['stdio', 'http']).describe('Transport mode'),
});

// Agent tool output schemas
export const AgentListOutputSchema = z.object({
  primary: z.array(z.object({
    name: z.string().describe('Agent name'),
    description: z.string().describe('Agent description'),
    model: z.string().optional().describe('Model used by agent'),
  })),
  subagents: z.array(z.object({
    name: z.string().describe('Agent name'),
    description: z.string().describe('Agent description'),
    model: z.string().optional().describe('Model used by agent'),
  })),
});

export const AgentDelegateOutputSchema = z.object({
  agent: z.string().describe('Agent that handled the task'),
  sessionId: z.string().describe('Session ID'),
  messageId: z.string().describe('Message ID'),
  content: z.string().describe('Agent response'),
});

// Skill tool output schemas
export const SkillListOutputSchema = z.array(z.object({
  name: z.string().describe('Skill name'),
  description: z.string().optional().describe('Skill description'),
  location: z.enum(['project', 'global']).describe('Where skill is defined'),
}));

export const SkillLoadOutputSchema = z.object({
  name: z.string().describe('Skill name'),
  content: z.string().describe('Skill content/instructions'),
});

export const SkillCreateOutputSchema = z.object({
  message: z.string().describe('Status message'),
  path: z.string().describe('Where to save the skill'),
  content: z.string().describe('Generated skill content'),
});

// MCP tool output schemas
export const McpListOutputSchema = z.object({
  servers: z.array(z.object({
    name: z.string().describe('Server name'),
    type: z.enum(['local', 'remote']).describe('Server type'),
    enabled: z.boolean().describe('Is server enabled'),
    status: z.enum(['connected', 'disconnected', 'error']).optional(),
  })),
  note: z.string().optional(),
});

export const McpAddOutputSchema = z.object({
  message: z.string().describe('Status message'),
  config: z.record(z.string(), z.unknown()).describe('Configuration to add'),
});

// Tool config output schemas
export const ToolListOutputSchema = z.object({
  builtin: z.array(z.object({
    name: z.string().describe('Tool name'),
    description: z.string().describe('Tool description'),
    source: z.literal('builtin'),
  })),
  note: z.string().optional(),
});

export const ToolConfigureOutputSchema = z.object({
  message: z.string().describe('Status message'),
  config: z.record(z.string(), z.unknown()).describe('Configuration'),
});

export const PermissionSetOutputSchema = z.object({
  message: z.string().describe('Status message'),
  config: z.record(z.string(), z.unknown()).describe('Permission configuration'),
  permissionDescriptions: z.record(z.string(), z.string()).optional(),
});

// ============================================================================
// Error Response Helpers
// ============================================================================

export interface ErrorResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

/**
 * Create a standardized error response with actionable suggestions
 */
export function createErrorResponse(
  operation: string,
  error: unknown,
  suggestions?: readonly string[]
): ErrorResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let text = `Error: ${operation} failed.\n\n`;
  text += `Details: ${errorMessage}\n\n`;
  
  if (suggestions && suggestions.length > 0) {
    text += `Suggestions:\n`;
    suggestions.forEach((s, i) => {
      text += `  ${i + 1}. ${s}\n`;
    });
  }
  
  return {
    content: [{ type: 'text', text }],
    isError: true,
  };
}

/**
 * Common error suggestions by error type
 */
export const ERROR_SUGGESTIONS = {
  connectionFailed: [
    'Ensure OpenCode server is running: opencode serve',
    'Check OPENCODE_SERVER_URL environment variable',
    'Verify the server is accessible at the configured URL',
    'Try restarting OpenCode: opencode restart',
  ],
  sessionNotFound: [
    'Use opencode_session_list to see available sessions',
    'Create a new session with opencode_session_create',
    'Check if the session ID is correct',
  ],
  invalidInput: [
    'Check the input parameter types and formats',
    'Ensure required fields are provided',
    'Refer to the tool schema for valid inputs',
  ],
  timeout: [
    'The operation took too long to complete',
    'Try breaking the task into smaller parts',
    'Increase timeout with OPENCODE_TIMEOUT environment variable',
  ],
  unauthorized: [
    'Check your API key configuration',
    'Run: opencode auth login <provider>',
    'Verify the provider credentials in opencode.json',
  ],
  fileNotFound: [
    'Verify the file path is correct',
    'Use opencode_find_files to search for the file',
    'Check if the file exists in the project',
  ],
  skillNotFound: [
    'Use opencode_skill_list to see available skills',
    'Check the skill name spelling',
    'Skills are stored in .opencode/skills/ or .claude/skills/',
  ],
  agentNotFound: [
    'Use opencode_agent_list to see available agents',
    'Check the agent name spelling',
    'Common agents: build, plan, explore',
  ],
  mcpError: [
    'Check the MCP server configuration in opencode.json',
    'Verify the server command or URL is correct',
    'Check server logs for errors',
  ],
} as const;
