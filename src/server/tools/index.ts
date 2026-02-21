/**
 * Tool Registry
 * 
 * Central registration of all MCP tools using Zod schemas.
 * Includes tool annotations for better LLM discoverability.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { OpenCodeClient } from '../../client/opencode.js';

// Import tool definitions
import { getExecutionToolDefinitions } from './execution.js';
import { getFileToolDefinitions } from './files.js';
import { getConfigToolDefinitions } from './config.js';
import { getAgentToolDefinitions } from './agents.js';
import { getSkillToolDefinitions } from './skills.js';
import { getMcpToolDefinitions } from './mcp.js';
import { getToolConfigToolDefinitions } from './tool-config.js';

// Import annotations and error helpers
import { TOOL_ANNOTATIONS } from './schemas.js';
export { TOOL_ANNOTATIONS, ANNOTATIONS, ERROR_SUGGESTIONS, createErrorResponse } from './schemas.js';
export type { ErrorResponse } from './schemas.js';
// Re-export ToolAnnotations from MCP types
export type { ToolAnnotations as MCPToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

// Re-export for smoke tests
export { 
  getExecutionToolDefinitions, 
  getFileToolDefinitions, 
  getConfigToolDefinitions, 
  getAgentToolDefinitions,
  getSkillToolDefinitions,
  getMcpToolDefinitions,
  getToolConfigToolDefinitions,
};

/**
 * Tool definition for documentation purposes
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: ToolAnnotations;
}

/**
 * Default annotations for tools without explicit definitions
 */
const DEFAULT_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
};

/**
 * Get annotations for a tool, with fallback to defaults
 */
function getAnnotations(name: string, annotations: Record<string, ToolAnnotations>): ToolAnnotations {
  return annotations[name] ?? DEFAULT_ANNOTATIONS;
}

/**
 * Get all tool definitions (for documentation/tests)
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return [
    ...getExecutionToolDefinitions(),
    ...getFileToolDefinitions(),
    ...getConfigToolDefinitions(),
    ...getAgentToolDefinitions(),
    ...getSkillToolDefinitions(),
    ...getMcpToolDefinitions(),
    ...getToolConfigToolDefinitions(),
  ].map(def => ({
    ...def,
    annotations: getAnnotations(def.name, TOOL_ANNOTATIONS),
  }));
}

/**
 * Registration functions for smoke tests
 */
export function registerExecutionTools(): ToolDefinition[] {
  return getExecutionToolDefinitions();
}

export function registerFileTools(): ToolDefinition[] {
  return getFileToolDefinitions();
}

export function registerConfigTools(): ToolDefinition[] {
  return getConfigToolDefinitions();
}

export function registerAgentTools(): ToolDefinition[] {
  return getAgentToolDefinitions();
}

export function registerSkillTools(): ToolDefinition[] {
  return getSkillToolDefinitions();
}

export function registerMcpTools(): ToolDefinition[] {
  return getMcpToolDefinitions();
}

export function registerToolConfigTools(): ToolDefinition[] {
  return getToolConfigToolDefinitions();
}

/**
 * All tool handlers combined
 */
export interface AllHandlers {
  execution: ReturnType<typeof import('./execution.js').createExecutionHandlers>;
  files: ReturnType<typeof import('./files.js').createFileHandlers>;
  config: ReturnType<typeof import('./config.js').createConfigHandlers>;
  agents: ReturnType<typeof import('./agents.js').createAgentHandlers>;
  skills: ReturnType<typeof import('./skills.js').createSkillHandlers>;
  mcp: ReturnType<typeof import('./mcp.js').createMcpHandlers>;
  toolConfig: ReturnType<typeof import('./tool-config.js').createToolConfigHandlers>;
}

/**
 * Register all tools with the MCP server
 * 
 * Uses MCP tool annotations for better LLM discoverability:
 * - readOnlyHint: Tool only reads data, doesn't modify state
 * - destructiveHint: Tool may perform destructive updates
 * - idempotentHint: Multiple calls produce same result
 * - openWorldHint: Tool interacts with external entities
 */
export async function registerAllTools(
  server: McpServer, 
  client: OpenCodeClient, 
  defaultModel?: string
): Promise<void> {
  // Import annotations
  const { TOOL_ANNOTATIONS } = await import('./schemas.js');

  // Register execution tools (6 tools)
  const { createExecutionHandlers: createExec, INPUT_SCHEMAS: execSchemas } = await import('./execution.js');
  const execHandlers = createExec(client, defaultModel);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = server as any;
  
  s.tool('opencode_run', 'Execute a coding task through OpenCode AI agent. Use for implementing features, refactoring, debugging, explaining code, or any software engineering task.', execSchemas.RunInputSchema, TOOL_ANNOTATIONS.opencode_run, execHandlers.opencode_run);
  s.tool('opencode_session_create', 'Create a new OpenCode session for multi-turn conversations. Returns a session ID that can be used for subsequent prompts.', execSchemas.SessionCreateInputSchema, TOOL_ANNOTATIONS.opencode_session_create, execHandlers.opencode_session_create);
  s.tool('opencode_session_prompt', 'Send a prompt to an existing OpenCode session.', execSchemas.SessionPromptInputSchema, TOOL_ANNOTATIONS.opencode_session_prompt, execHandlers.opencode_session_prompt);
  s.tool('opencode_session_list', 'List all OpenCode sessions.', execSchemas.EmptySchema, TOOL_ANNOTATIONS.opencode_session_list, execHandlers.opencode_session_list);
  s.tool('opencode_session_abort', 'Abort a running OpenCode session.', execSchemas.SessionIdInputSchema, TOOL_ANNOTATIONS.opencode_session_abort, execHandlers.opencode_session_abort);
  s.tool('opencode_session_share', 'Share an OpenCode session. Returns a shareable link.', execSchemas.SessionIdInputSchema, TOOL_ANNOTATIONS.opencode_session_share, execHandlers.opencode_session_share);

  // Register file tools (5 tools)
  const { createFileHandlers: createFile, INPUT_SCHEMAS: fileSchemas } = await import('./files.js');
  const fileHandlers = createFile(client);
  
  s.tool('opencode_file_read', 'Read a file from the OpenCode project. Returns the file content as text.', fileSchemas.FileReadInputSchema, TOOL_ANNOTATIONS.opencode_file_read, fileHandlers.opencode_file_read);
  s.tool('opencode_file_search', 'Search for text pattern in project files. Supports regex patterns.', fileSchemas.FileSearchInputSchema, TOOL_ANNOTATIONS.opencode_file_search, fileHandlers.opencode_file_search);
  s.tool('opencode_find_files', 'Find files and directories by name pattern using fuzzy matching.', fileSchemas.FindFilesInputSchema, TOOL_ANNOTATIONS.opencode_find_files, fileHandlers.opencode_find_files);
  s.tool('opencode_find_symbols', 'Find workspace symbols (functions, classes, variables) by name.', fileSchemas.FindSymbolsInputSchema, TOOL_ANNOTATIONS.opencode_find_symbols, fileHandlers.opencode_find_symbols);
  s.tool('opencode_file_status', 'Get git status for tracked files.', fileSchemas.EmptySchema, TOOL_ANNOTATIONS.opencode_file_status, fileHandlers.opencode_file_status);

  // Register config tools (6 tools)
  const { createConfigHandlers: createConfig, INPUT_SCHEMAS: configSchemas } = await import('./config.js');
  const configHandlers = createConfig(client);
  
  s.tool('opencode_model_list', 'List all available models from configured providers. Optionally filter by provider or refresh the cache.', configSchemas.ModelListInputSchema, TOOL_ANNOTATIONS.opencode_model_list, configHandlers.opencode_model_list);
  s.tool('opencode_model_configure', 'Configure model options (temperature, reasoning effort, thinking budget, etc.). Returns configuration instructions.', configSchemas.ModelConfigureInputSchema, TOOL_ANNOTATIONS.opencode_model_configure, configHandlers.opencode_model_configure);
  s.tool('opencode_provider_list', 'List all providers and their connection status.', configSchemas.EmptySchema, TOOL_ANNOTATIONS.opencode_provider_list, configHandlers.opencode_provider_list);
  s.tool('opencode_config_get', 'Get current OpenCode MCP server configuration.', configSchemas.EmptySchema, TOOL_ANNOTATIONS.opencode_config_get, configHandlers.opencode_config_get);
  s.tool('opencode_config_update', 'Update OpenCode configuration settings. Returns configuration instructions to apply manually.', configSchemas.ConfigUpdateInputSchema, TOOL_ANNOTATIONS.opencode_config_update, configHandlers.opencode_config_update);
  s.tool('opencode_auth_set', 'Set authentication credentials for a provider. Supports API keys and OAuth tokens.', configSchemas.AuthSetInputSchema, TOOL_ANNOTATIONS.opencode_auth_set, configHandlers.opencode_auth_set);

  // Register agent tools (2 tools)
  const { createAgentHandlers: createAgent, INPUT_SCHEMAS: agentSchemas } = await import('./agents.js');
  const agentHandlers = createAgent(client, defaultModel);
  
  s.tool('opencode_agent_list', 'List all available agents (primary and subagents). Primary agents are used for main conversations, subagents are specialized assistants that can be invoked for specific tasks.', agentSchemas.AgentListInputSchema, TOOL_ANNOTATIONS.opencode_agent_list, agentHandlers.opencode_agent_list);
  s.tool('opencode_agent_delegate', 'Delegate a task to a specific agent. Use to invoke specialized agents like "plan" for analysis without changes, "explore" for fast codebase exploration, or custom agents for specific workflows.', agentSchemas.AgentDelegateInputSchema, TOOL_ANNOTATIONS.opencode_agent_delegate, agentHandlers.opencode_agent_delegate);

  // Register skill tools (3 tools)
  const { createSkillHandlers: createSkill, INPUT_SCHEMAS: skillSchemas } = await import('./skills.js');
  const skillHandlers = createSkill(client);
  
  s.tool('opencode_skill_list', 'List all available skills from SKILL.md files. Skills are reusable behavior definitions that can be loaded on-demand.', skillSchemas.EmptySchema, TOOL_ANNOTATIONS.opencode_skill_list, skillHandlers.opencode_skill_list);
  s.tool('opencode_skill_load', 'Load a skill and return its content. Skills provide specialized instructions for specific tasks.', skillSchemas.SkillLoadInputSchema, TOOL_ANNOTATIONS.opencode_skill_load, skillHandlers.opencode_skill_load);
  s.tool('opencode_skill_create', 'Create a new skill (SKILL.md file). Skills are reusable prompt templates for specialized tasks. Returns the skill content to save manually.', skillSchemas.SkillCreateInputSchema, TOOL_ANNOTATIONS.opencode_skill_create, skillHandlers.opencode_skill_create);

  // Register MCP management tools (4 tools)
  const { createMcpHandlers: createMcp, INPUT_SCHEMAS: mcpSchemas } = await import('./mcp.js');
  const mcpHandlers = createMcp(client);
  
  s.tool('opencode_mcp_list', 'List all configured MCP servers and their connection status.', mcpSchemas.EmptySchema, TOOL_ANNOTATIONS.opencode_mcp_list, mcpHandlers.opencode_mcp_list);
  s.tool('opencode_mcp_add', 'Add a new MCP server to OpenCode. Supports local (stdio) and remote (HTTP) servers. Returns configuration to add manually.', mcpSchemas.McpAddInputSchema, TOOL_ANNOTATIONS.opencode_mcp_add, mcpHandlers.opencode_mcp_add);
  s.tool('opencode_mcp_remove', 'Remove an MCP server from OpenCode configuration.', mcpSchemas.McpRemoveInputSchema, TOOL_ANNOTATIONS.opencode_mcp_remove, mcpHandlers.opencode_mcp_remove);
  s.tool('opencode_mcp_enable', 'Enable or disable an MCP server.', mcpSchemas.McpEnableInputSchema, TOOL_ANNOTATIONS.opencode_mcp_enable, mcpHandlers.opencode_mcp_enable);

  // Register tool config tools (3 tools)
  const { createToolConfigHandlers: createToolConfig, INPUT_SCHEMAS: toolConfigSchemas } = await import('./tool-config.js');
  const toolConfigHandlers = createToolConfig(client);
  
  s.tool('opencode_tool_list', 'List all available tools (built-in and from MCP servers). Optionally filter by provider/model.', toolConfigSchemas.ToolListInputSchema, TOOL_ANNOTATIONS.opencode_tool_list, toolConfigHandlers.opencode_tool_list);
  s.tool('opencode_tool_configure', 'Enable or disable tools globally or per-agent. Use wildcards like "mymcp_*" to control multiple tools.', toolConfigSchemas.ToolConfigureInputSchema, TOOL_ANNOTATIONS.opencode_tool_configure, toolConfigHandlers.opencode_tool_configure);
  s.tool('opencode_permission_set', 'Set permission level for a tool. Use "allow" (no approval), "ask" (prompt user), or "deny" (disable).', toolConfigSchemas.PermissionSetInputSchema, TOOL_ANNOTATIONS.opencode_permission_set, toolConfigHandlers.opencode_permission_set);
}
