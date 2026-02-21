/**
 * Configuration utilities for OpenCode MCP Server
 */

import type { ServerConfig } from './types.js';
import { DEFAULT_CONFIG } from './types.js';

export function loadConfig(): ServerConfig {
  const config: ServerConfig = { ...DEFAULT_CONFIG };

  // Load from environment variables
  if (process.env.OPENCODE_SERVER_URL) {
    config.serverUrl = process.env.OPENCODE_SERVER_URL;
  }

  if (process.env.OPENCODE_AUTO_START !== undefined) {
    config.autoStart = process.env.OPENCODE_AUTO_START === 'true';
  }

  if (process.env.OPENCODE_DEFAULT_MODEL) {
    config.defaultModel = process.env.OPENCODE_DEFAULT_MODEL;
  }

  if (process.env.OPENCODE_TIMEOUT) {
    const timeout = parseInt(process.env.OPENCODE_TIMEOUT, 10);
    if (!isNaN(timeout)) {
      config.timeout = timeout;
    }
  }

  if (process.env.MCP_TRANSPORT) {
    const transport = process.env.MCP_TRANSPORT;
    if (transport === 'stdio' || transport === 'http') {
      config.transport = transport;
    }
  }

  if (process.env.MCP_HTTP_PORT) {
    const port = parseInt(process.env.MCP_HTTP_PORT, 10);
    if (!isNaN(port)) {
      config.httpPort = port;
    }
  }

  return config;
}

/**
 * Parse a model string in format "provider/model" into components
 */
export function parseModelString(model: string): { providerID: string; modelID: string } | null {
  const parts = model.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { providerID: parts[0], modelID: parts[1] };
}

/**
 * Format model reference to string
 */
export function formatModelString(providerID: string, modelID: string): string {
  return `${providerID}/${modelID}`;
}
