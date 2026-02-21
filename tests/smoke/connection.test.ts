/**
 * Smoke Tests - Connection
 * 
 * Critical path tests for OpenCode SDK connection.
 * These tests verify the client wrapper works correctly.
 */

import { describe, test, expect, vi } from 'vitest';

// Mock the OpenCode SDK for smoke tests
vi.mock('@opencode-ai/sdk', () => ({
  createOpencodeClient: vi.fn(() => ({
    global: {
      health: vi.fn().mockResolvedValue({ data: { healthy: true, version: '1.0.0' } }),
    },
    session: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ data: { id: 'test-session', title: 'Test' } }),
      get: vi.fn().mockResolvedValue({ data: { id: 'test-session' } }),
      abort: vi.fn().mockResolvedValue({ data: true }),
      share: vi.fn().mockResolvedValue({ data: { id: 'test-session', shareToken: 'abc123' } }),
      prompt: vi.fn().mockResolvedValue({ 
        data: { 
          info: { id: 'msg-1' }, 
          parts: [{ type: 'text', text: 'Hello!' }] 
        } 
      }),
    },
    app: {
      agents: vi.fn().mockResolvedValue({ data: [] }),
    },
    config: {
      providers: vi.fn().mockResolvedValue({ data: { providers: [], defaults: {} } }),
    },
    file: {
      read: vi.fn().mockResolvedValue({ data: { type: 'raw', content: 'test content' } }),
    },
    find: {
      text: vi.fn().mockResolvedValue({ data: [] }),
      files: vi.fn().mockResolvedValue({ data: [] }),
      symbols: vi.fn().mockResolvedValue({ data: [] }),
    },
  })),
}));

describe('Smoke Tests - Connection', () => {
  describe('Client Creation', () => {
    test('client module can be imported', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      expect(createClient).toBeDefined();
      expect(typeof createClient).toBe('function');
    });

    test('client can be created with config', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      const client = await createClient({
        serverUrl: 'http://localhost:4096',
        autoStart: false,
        timeout: 30000,
        transport: 'stdio',
      });
      
      expect(client).toBeDefined();
      expect(client.isHealthy).toBeDefined();
      expect(client.listSessions).toBeDefined();
      expect(client.prompt).toBeDefined();
    });
  });

  describe('Client Methods', () => {
    test('isHealthy returns boolean', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      const client = await createClient({
        serverUrl: 'http://localhost:4096',
        autoStart: false,
        timeout: 30000,
        transport: 'stdio',
      });
      
      const healthy = await client.isHealthy();
      expect(typeof healthy).toBe('boolean');
    });

    test('listSessions returns array', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      const client = await createClient({
        serverUrl: 'http://localhost:4096',
        autoStart: false,
        timeout: 30000,
        transport: 'stdio',
      });
      
      const sessions = await client.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    test('createSession returns session object', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      const client = await createClient({
        serverUrl: 'http://localhost:4096',
        autoStart: false,
        timeout: 30000,
        transport: 'stdio',
      });
      
      const session = await client.createSession('Test Session');
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
    });

    test('prompt returns output object', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      const client = await createClient({
        serverUrl: 'http://localhost:4096',
        autoStart: false,
        timeout: 30000,
        transport: 'stdio',
      });
      
      const result = await client.prompt('test-session', 'Hello!');
      expect(result).toBeDefined();
      expect(result.sessionId).toBe('test-session');
      expect(result.content).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('disconnect cleans up state', async () => {
      const { createClient } = await import('../../src/client/opencode.js');
      const client = await createClient({
        serverUrl: 'http://localhost:4096',
        autoStart: false,
        timeout: 30000,
        transport: 'stdio',
      });
      
      // Should not throw
      expect(() => client.disconnect()).not.toThrow();
    });
  });
});
