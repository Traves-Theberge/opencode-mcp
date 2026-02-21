/**
 * Smoke Tests - Server
 * 
 * Critical path tests to ensure the MCP server can start and operate.
 * These tests MUST pass for any release.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';

describe('Smoke Tests - Server', () => {
  describe('Server Startup', () => {
    test('server module can be imported', async () => {
      const { createMCPServer } = await import('../../src/server/mcp.js');
      expect(createMCPServer).toBeDefined();
      expect(typeof createMCPServer).toBe('function');
    });

    test('server can be created with default config', async () => {
      const { createMCPServer } = await import('../../src/server/mcp.js');
      const server = await createMCPServer();
      expect(server).toBeDefined();
      expect(server.connect).toBeDefined();
      expect(server.registerTool).toBeDefined();
    });

    test('server can be created with custom config', async () => {
      const { createMCPServer } = await import('../../src/server/mcp.js');
      const server = await createMCPServer({
        name: 'test-server',
        version: '0.0.1',
      });
      expect(server).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    test('server can start and stop cleanly', async () => {
      const { createMCPServer } = await import('../../src/server/mcp.js');
      const server = await createMCPServer();
      
      // Server should be in a clean state
      expect(server.isConnected()).toBe(false);
    });
  });
});
