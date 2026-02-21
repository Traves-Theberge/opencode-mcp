/**
 * Smoke Tests - Tools
 * 
 * Critical path tests to ensure all tools can be registered.
 * These tests MUST pass for any release.
 */

import { describe, test, expect, beforeAll } from 'vitest';

describe('Smoke Tests - Tools', () => {
  describe('Tool Registration', () => {
    test('all P0 tools are exported', async () => {
      const tools = await import('../../src/server/tools/index.js');
      
      // Execution tools
      expect(tools.registerExecutionTools).toBeDefined();
      
      // File tools
      expect(tools.registerFileTools).toBeDefined();
      
      // Config tools
      expect(tools.registerConfigTools).toBeDefined();
      
      // Agent tools
      expect(tools.registerAgentTools).toBeDefined();
    });

    test('execution tools have correct definitions', async () => {
      const { getExecutionToolDefinitions } = await import('../../src/server/tools/execution.js');
      const definitions = getExecutionToolDefinitions();
      
      expect(definitions.length).toBeGreaterThan(0);
      
      // Check opencode_run tool
      const runTool = definitions.find(t => t.name === 'opencode_run');
      expect(runTool).toBeDefined();
      expect(runTool?.description).toBeTruthy();
      expect(runTool?.inputSchema).toBeDefined();
      
      // Check session tools
      const createSession = definitions.find(t => t.name === 'opencode_session_create');
      expect(createSession).toBeDefined();
      
      const listSessions = definitions.find(t => t.name === 'opencode_session_list');
      expect(listSessions).toBeDefined();
    });

    test('file tools have correct definitions', async () => {
      const { getFileToolDefinitions } = await import('../../src/server/tools/files.js');
      const definitions = getFileToolDefinitions();
      
      expect(definitions.length).toBeGreaterThan(0);
      
      // Check file tools exist
      const readFile = definitions.find(t => t.name === 'opencode_file_read');
      expect(readFile).toBeDefined();
      
      const searchFile = definitions.find(t => t.name === 'opencode_file_search');
      expect(searchFile).toBeDefined();
      
      const findFiles = definitions.find(t => t.name === 'opencode_find_files');
      expect(findFiles).toBeDefined();
    });

    test('config tools have correct definitions', async () => {
      const { getConfigToolDefinitions } = await import('../../src/server/tools/config.js');
      const definitions = getConfigToolDefinitions();
      
      expect(definitions.length).toBeGreaterThan(0);
      
      const configGet = definitions.find(t => t.name === 'opencode_config_get');
      expect(configGet).toBeDefined();
      
      const modelList = definitions.find(t => t.name === 'opencode_model_list');
      expect(modelList).toBeDefined();
    });

    test('agent tools have correct definitions', async () => {
      const { getAgentToolDefinitions } = await import('../../src/server/tools/agents.js');
      const definitions = getAgentToolDefinitions();
      
      expect(definitions.length).toBeGreaterThan(0);
      
      const listAgents = definitions.find(t => t.name === 'opencode_agent_list');
      expect(listAgents).toBeDefined();
      
      const delegate = definitions.find(t => t.name === 'opencode_agent_delegate');
      expect(delegate).toBeDefined();
    });
  });

  describe('Tool Schema Validation', () => {
    test('all tool definitions have required properties', async () => {
      const { getAllToolDefinitions } = await import('../../src/server/tools/index.js');
      const definitions = getAllToolDefinitions();
      
      for (const tool of definitions) {
        expect(tool.name).toBeTruthy();
        expect(typeof tool.name).toBe('string');
        expect(tool.description).toBeTruthy();
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.inputSchema).toBe('object');
      }
    });

    test('tool names follow naming convention', async () => {
      const { getAllToolDefinitions } = await import('../../src/server/tools/index.js');
      const definitions = getAllToolDefinitions();
      
      for (const tool of definitions) {
        // All tools should start with 'opencode_'
        expect(tool.name).toMatch(/^opencode_/);
        // Should be lowercase with underscores
        expect(tool.name).toMatch(/^[a-z_]+$/);
      }
    });
  });
});
