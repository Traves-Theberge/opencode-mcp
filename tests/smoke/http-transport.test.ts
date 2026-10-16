/**
 * Smoke Tests - HTTP Transport
 *
 * The stateless /mcp endpoint must serve any number of independent clients.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { startHTTPServer } from '../../src/server/transports/http.js';

const PORT = 39417;
const URL = `http://127.0.0.1:${PORT}/mcp`;

async function createServer(): Promise<McpServer> {
  const server = new McpServer({ name: 'test-server', version: '0.0.1' });
  server.tool('echo', 'Echo input', { text: z.string() }, async ({ text }) => ({
    content: [{ type: 'text' as const, text }],
  }));
  return server;
}

async function post(body: unknown): Promise<{ status: number; message?: { result?: Record<string, unknown> } }> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text.split('\n').find(line => line.startsWith('data: '));
  return { status: res.status, message: data ? JSON.parse(data.slice(6)) : undefined };
}

const initialize = (id: number) => ({
  jsonrpc: '2.0',
  id,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } },
});

describe('Smoke Tests - HTTP Transport', () => {
  let server: { close: () => void };

  beforeAll(async () => {
    server = await startHTTPServer(createServer, { port: PORT, hostname: '127.0.0.1' });
  });

  afterAll(() => {
    server.close();
  });

  test('consecutive clients can each initialize', async () => {
    for (const id of [1, 2, 3]) {
      const { status, message } = await post(initialize(id));
      expect(status).toBe(200);
      expect(message?.result?.serverInfo).toMatchObject({ name: 'test-server' });
    }
  });

  test('requests without a preceding initialize are served', async () => {
    const { status, message } = await post({ jsonrpc: '2.0', id: 4, method: 'tools/list' });
    expect(status).toBe(200);
    expect(message?.result?.tools).toEqual([expect.objectContaining({ name: 'echo' })]);
  });

  test('GET is rejected in stateless mode', async () => {
    const res = await fetch(URL, { headers: { Accept: 'text/event-stream' } });
    expect(res.status).toBe(405);
  });
});
