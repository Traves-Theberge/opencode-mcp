/**
 * Integration Tests - Basic Flow
 * 
 * Tests that require a running OpenCode server.
 * These are skipped if OPENCODE_SERVER_URL is not accessible.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '../../src/client/opencode.js';

// Skip integration tests if no server is available
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

describe.skipIf(!shouldRunIntegrationTests)('Integration Tests', () => {
  let client: Awaited<ReturnType<typeof createClient>>;
  
  beforeAll(async () => {
    client = await createClient({
      serverUrl: process.env.OPENCODE_SERVER_URL || 'http://localhost:4096',
      autoStart: false,
      timeout: 30000,
      transport: 'stdio',
    });
  }, 30000);
  
  afterAll(() => {
    client?.disconnect();
  });

  describe('Connection', () => {
    test('can connect to OpenCode server', async () => {
      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe('Sessions', () => {
    test('can create a session', async () => {
      const session = await client.createSession('Test Session');
      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
    });

    test('can list sessions', async () => {
      const sessions = await client.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Agents', () => {
    test('can list agents', async () => {
      const agents = await client.listAgents();
      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe('Providers', () => {
    test('can list providers', async () => {
      const { providers, defaults } = await client.listProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(typeof defaults).toBe('object');
    });
  });

  describe('Files', () => {
    test('can find files', async () => {
      const files = await client.findFiles('package.json', 'file');
      expect(Array.isArray(files)).toBe(true);
    });
  });
});
