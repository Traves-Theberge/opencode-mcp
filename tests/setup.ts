/**
 * Test setup file
 * Configures the test environment before all tests run
 */

import { beforeAll, afterAll } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENCODE_SERVER_URL = 'http://localhost:4096';
process.env.OPENCODE_AUTO_START = 'false';
process.env.MCP_TRANSPORT = 'stdio';

// Global test timeout
const DEFAULT_TIMEOUT = 30000;

beforeAll(() => {
  console.log('Running tests with config:');
  console.log(`  OPENCODE_SERVER_URL: ${process.env.OPENCODE_SERVER_URL}`);
  console.log(`  MCP_TRANSPORT: ${process.env.MCP_TRANSPORT}`);
}, DEFAULT_TIMEOUT);

afterAll(() => {
  console.log('All tests completed');
});
