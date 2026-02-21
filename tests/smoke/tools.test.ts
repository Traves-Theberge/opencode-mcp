/**
 * Smoke Tests - Tools
 * 
 * Critical path tests to ensure all tools can be registered.
 * These tests MUST pass for any release.
 */

import { describe, test, expect } from 'vitest';

describe('Smoke Tests - Tools', () => {
  describe('Tool Registration', () => {
    test('all tool categories are exported', async () => {
      const tools = await import('../../src/server/tools/index.js');
      
      // Execution tools
      expect(tools.registerExecutionTools).toBeDefined();
      
      // File tools
      expect(tools.registerFileTools).toBeDefined();
      
      // Config tools
      expect(tools.registerConfigTools).toBeDefined();
      
      // Agent tools
      expect(tools.registerAgentTools).toBeDefined();
      
      // Skill tools
      expect(tools.registerSkillTools).toBeDefined();
      
      // MCP tools
      expect(tools.registerMcpTools).toBeDefined();
      
      // Tool config tools
      expect(tools.registerToolConfigTools).toBeDefined();
    });

    test('execution tools have correct definitions', async () => {
      const { getExecutionToolDefinitions } = await import('../../src/server/tools/execution.js');
      const definitions = getExecutionToolDefinitions();
      
      expect(definitions.length).toBe(6);
      
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
      
      const sessionPrompt = definitions.find(t => t.name === 'opencode_session_prompt');
      expect(sessionPrompt).toBeDefined();
      
      const sessionAbort = definitions.find(t => t.name === 'opencode_session_abort');
      expect(sessionAbort).toBeDefined();
      
      const sessionShare = definitions.find(t => t.name === 'opencode_session_share');
      expect(sessionShare).toBeDefined();
    });

    test('file tools have correct definitions', async () => {
      const { getFileToolDefinitions } = await import('../../src/server/tools/files.js');
      const definitions = getFileToolDefinitions();
      
      expect(definitions.length).toBe(5);
      
      const readFile = definitions.find(t => t.name === 'opencode_file_read');
      expect(readFile).toBeDefined();
      
      const searchFile = definitions.find(t => t.name === 'opencode_file_search');
      expect(searchFile).toBeDefined();
      
      const findFiles = definitions.find(t => t.name === 'opencode_find_files');
      expect(findFiles).toBeDefined();
      
      const findSymbols = definitions.find(t => t.name === 'opencode_find_symbols');
      expect(findSymbols).toBeDefined();
      
      const fileStatus = definitions.find(t => t.name === 'opencode_file_status');
      expect(fileStatus).toBeDefined();
    });

    test('config tools have correct definitions', async () => {
      const { getConfigToolDefinitions } = await import('../../src/server/tools/config.js');
      const definitions = getConfigToolDefinitions();
      
      expect(definitions.length).toBe(6);
      
      const configGet = definitions.find(t => t.name === 'opencode_config_get');
      expect(configGet).toBeDefined();
      
      const modelList = definitions.find(t => t.name === 'opencode_model_list');
      expect(modelList).toBeDefined();
      
      const modelConfigure = definitions.find(t => t.name === 'opencode_model_configure');
      expect(modelConfigure).toBeDefined();
      
      const providerList = definitions.find(t => t.name === 'opencode_provider_list');
      expect(providerList).toBeDefined();
      
      const configUpdate = definitions.find(t => t.name === 'opencode_config_update');
      expect(configUpdate).toBeDefined();
      
      const authSet = definitions.find(t => t.name === 'opencode_auth_set');
      expect(authSet).toBeDefined();
    });

    test('agent tools have correct definitions', async () => {
      const { getAgentToolDefinitions } = await import('../../src/server/tools/agents.js');
      const definitions = getAgentToolDefinitions();
      
      expect(definitions.length).toBe(2);
      
      const listAgents = definitions.find(t => t.name === 'opencode_agent_list');
      expect(listAgents).toBeDefined();
      
      const delegate = definitions.find(t => t.name === 'opencode_agent_delegate');
      expect(delegate).toBeDefined();
    });

    test('skill tools have correct definitions', async () => {
      const { getSkillToolDefinitions } = await import('../../src/server/tools/skills.js');
      const definitions = getSkillToolDefinitions();
      
      expect(definitions.length).toBe(3);
      
      const skillList = definitions.find(t => t.name === 'opencode_skill_list');
      expect(skillList).toBeDefined();
      expect(skillList?.description).toContain('skill');
      
      const skillLoad = definitions.find(t => t.name === 'opencode_skill_load');
      expect(skillLoad).toBeDefined();
      
      const skillCreate = definitions.find(t => t.name === 'opencode_skill_create');
      expect(skillCreate).toBeDefined();
    });

    test('mcp tools have correct definitions', async () => {
      const { getMcpToolDefinitions } = await import('../../src/server/tools/mcp.js');
      const definitions = getMcpToolDefinitions();
      
      expect(definitions.length).toBe(4);
      
      const mcpList = definitions.find(t => t.name === 'opencode_mcp_list');
      expect(mcpList).toBeDefined();
      expect(mcpList?.description).toContain('MCP');
      
      const mcpAdd = definitions.find(t => t.name === 'opencode_mcp_add');
      expect(mcpAdd).toBeDefined();
      
      const mcpRemove = definitions.find(t => t.name === 'opencode_mcp_remove');
      expect(mcpRemove).toBeDefined();
      
      const mcpEnable = definitions.find(t => t.name === 'opencode_mcp_enable');
      expect(mcpEnable).toBeDefined();
    });

    test('tool config tools have correct definitions', async () => {
      const { getToolConfigToolDefinitions } = await import('../../src/server/tools/tool-config.js');
      const definitions = getToolConfigToolDefinitions();
      
      expect(definitions.length).toBe(3);
      
      const toolList = definitions.find(t => t.name === 'opencode_tool_list');
      expect(toolList).toBeDefined();
      
      const toolConfigure = definitions.find(t => t.name === 'opencode_tool_configure');
      expect(toolConfigure).toBeDefined();
      
      const permissionSet = definitions.find(t => t.name === 'opencode_permission_set');
      expect(permissionSet).toBeDefined();
    });
  });

  describe('Tool Schema Validation', () => {
    test('all tool definitions have required properties', async () => {
      const { getAllToolDefinitions } = await import('../../src/server/tools/index.js');
      const definitions = getAllToolDefinitions();
      
      expect(definitions.length).toBe(29);
      
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

    test('all tool descriptions are meaningful', async () => {
      const { getAllToolDefinitions } = await import('../../src/server/tools/index.js');
      const definitions = getAllToolDefinitions();
      
      for (const tool of definitions) {
        // Descriptions should be at least 10 characters
        expect(tool.description.length).toBeGreaterThan(10);
        // Should not contain placeholder text
        expect(tool.description.toLowerCase()).not.toContain('todo');
        expect(tool.description.toLowerCase()).not.toContain('tbd');
      }
    });

    test('all tools have unique names', async () => {
      const { getAllToolDefinitions } = await import('../../src/server/tools/index.js');
      const definitions = getAllToolDefinitions();
      
      const names = definitions.map(t => t.name);
      const uniqueNames = new Set(names);
      
      expect(names.length).toBe(uniqueNames.size);
    });
  });
});
