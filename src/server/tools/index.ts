/**
 * Tool Registry
 * 
 * Central registration of all MCP tools using Zod schemas.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { OpenCodeClient } from '../../client/opencode.js';

// Import tool definitions
import { getExecutionToolDefinitions } from './execution.js';
import { getFileToolDefinitions } from './files.js';
import { getConfigToolDefinitions } from './config.js';
import { getAgentToolDefinitions } from './agents.js';

// Re-export for smoke tests
export { getExecutionToolDefinitions, getFileToolDefinitions, getConfigToolDefinitions, getAgentToolDefinitions };

/**
 * Tool definition for documentation purposes
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
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
  ];
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

/**
 * All tool handlers combined
 */
export interface AllHandlers {
  execution: ReturnType<typeof import('./execution.js').createExecutionHandlers>;
  files: ReturnType<typeof import('./files.js').createFileHandlers>;
  config: ReturnType<typeof import('./config.js').createConfigHandlers>;
  agents: ReturnType<typeof import('./agents.js').createAgentHandlers>;
}

/**
 * Register all tools with the MCP server
 */
export async function registerAllTools(
  server: McpServer, 
  client: OpenCodeClient, 
  defaultModel?: string
): Promise<void> {
  // Register execution tools
  const { createExecutionHandlers: createExec, INPUT_SCHEMAS: execSchemas } = await import('./execution.js');
  const execHandlers = createExec(client, defaultModel);
  
  server.tool('opencode_run', 'Execute a coding task through OpenCode AI agent. Use for implementing features, refactoring, debugging, explaining code, or any software engineering task.', execSchemas.RunInputSchema, execHandlers.opencode_run);
  
  server.tool('opencode_session_create', 'Create a new OpenCode session for multi-turn conversations.', execSchemas.SessionCreateInputSchema, execHandlers.opencode_session_create);
  
  server.tool('opencode_session_prompt', 'Send a prompt to an existing OpenCode session.', execSchemas.SessionPromptInputSchema, execHandlers.opencode_session_prompt);
  
  server.tool('opencode_session_list', 'List all OpenCode sessions.', execSchemas.EmptySchema, execHandlers.opencode_session_list);
  
  server.tool('opencode_session_abort', 'Abort a running OpenCode session.', execSchemas.SessionIdInputSchema, execHandlers.opencode_session_abort);
  
  server.tool('opencode_session_share', 'Share an OpenCode session.', execSchemas.SessionIdInputSchema, execHandlers.opencode_session_share);

  // Register file tools
  const { createFileHandlers: createFile, INPUT_SCHEMAS: fileSchemas } = await import('./files.js');
  const fileHandlers = createFile(client);
  
  server.tool('opencode_file_read', 'Read a file from the OpenCode project.', fileSchemas.FileReadInputSchema, fileHandlers.opencode_file_read);
  
  server.tool('opencode_file_search', 'Search for text pattern in project files.', fileSchemas.FileSearchInputSchema, fileHandlers.opencode_file_search);
  
  server.tool('opencode_find_files', 'Find files and directories by name pattern.', fileSchemas.FindFilesInputSchema, fileHandlers.opencode_find_files);
  
  server.tool('opencode_find_symbols', 'Find workspace symbols by name.', fileSchemas.FindSymbolsInputSchema, fileHandlers.opencode_find_symbols);
  
  server.tool('opencode_file_status', 'Get git status for tracked files.', fileSchemas.EmptySchema, fileHandlers.opencode_file_status);

  // Register config tools
  const { createConfigHandlers: createConfig, INPUT_SCHEMAS: configSchemas } = await import('./config.js');
  const configHandlers = createConfig(client);
  
  server.tool('opencode_model_list', 'List all available models from configured providers.', configSchemas.ModelListInputSchema, configHandlers.opencode_model_list);
  
  server.tool('opencode_provider_list', 'List all providers and their connection status.', configSchemas.EmptySchema, configHandlers.opencode_provider_list);
  
  server.tool('opencode_config_get', 'Get current OpenCode configuration.', configSchemas.EmptySchema, configHandlers.opencode_config_get);

  // Register agent tools
  const { createAgentHandlers: createAgent, INPUT_SCHEMAS: agentSchemas } = await import('./agents.js');
  const agentHandlers = createAgent(client, defaultModel);
  
  server.tool('opencode_agent_list', 'List all available agents.', agentSchemas.AgentListInputSchema, agentHandlers.opencode_agent_list);
  
  server.tool('opencode_agent_delegate', 'Delegate a task to a specific agent.', agentSchemas.AgentDelegateInputSchema, agentHandlers.opencode_agent_delegate);
}
