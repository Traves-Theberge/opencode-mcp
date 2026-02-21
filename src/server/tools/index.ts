/**
 * Tool Registry
 * 
 * Central registration of all MCP tools.
 */

import type { ToolDefinition } from '../utils/types.js';
import { getExecutionToolDefinitions } from './execution.js';
import { getFileToolDefinitions } from './files.js';
import { getConfigToolDefinitions } from './config.js';
import { getAgentToolDefinitions } from './agents.js';
import type { OpenCodeClient } from '../../client/opencode.js';
import { createExecutionHandlers } from './execution.js';
import { createFileHandlers } from './files.js';
import { createConfigHandlers } from './config.js';
import { createAgentHandlers } from './agents.js';

// Re-export for convenience
export { getExecutionToolDefinitions, createExecutionHandlers } from './execution.js';
export { getFileToolDefinitions, createFileHandlers } from './files.js';
export { getConfigToolDefinitions, createConfigHandlers } from './config.js';
export { getAgentToolDefinitions, createAgentHandlers } from './agents.js';

/**
 * Get all tool definitions
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
 * Tool registration functions for the MCP server
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
  execution: ReturnType<typeof createExecutionHandlers>;
  files: ReturnType<typeof createFileHandlers>;
  config: ReturnType<typeof createConfigHandlers>;
  agents: ReturnType<typeof createAgentHandlers>;
}

export function createAllHandlers(client: OpenCodeClient, defaultModel?: string): AllHandlers {
  return {
    execution: createExecutionHandlers(client, defaultModel),
    files: createFileHandlers(client),
    config: createConfigHandlers(client),
    agents: createAgentHandlers(client, defaultModel),
  };
}

/**
 * Tool name to handler mapping
 */
export function getToolHandlerMap(handlers: AllHandlers): Record<string, (input: unknown) => Promise<import('../utils/types.js').ToolResult>> {
  return {
    // Execution tools
    opencode_run: handlers.execution.opencode_run,
    opencode_session_create: handlers.execution.opencode_session_create,
    opencode_session_prompt: handlers.execution.opencode_session_prompt,
    opencode_session_list: handlers.execution.opencode_session_list,
    opencode_session_abort: handlers.execution.opencode_session_abort,
    opencode_session_share: handlers.execution.opencode_session_share,
    
    // File tools
    opencode_file_read: handlers.files.opencode_file_read,
    opencode_file_search: handlers.files.opencode_file_search,
    opencode_find_files: handlers.files.opencode_find_files,
    opencode_find_symbols: handlers.files.opencode_find_symbols,
    opencode_file_status: handlers.files.opencode_file_status,
    
    // Config tools
    opencode_model_list: handlers.config.opencode_model_list,
    opencode_provider_list: handlers.config.opencode_provider_list,
    opencode_config_get: handlers.config.opencode_config_get,
    
    // Agent tools
    opencode_agent_list: handlers.agents.opencode_agent_list,
    opencode_agent_delegate: handlers.agents.opencode_agent_delegate,
  };
}
