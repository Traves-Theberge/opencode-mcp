/**
 * Configuration utilities for OpenCode MCP Server
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
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

  // Config file path for persisting model/provider settings
  if (process.env.OPENCODE_CONFIG_PATH) {
    config.configPath = process.env.OPENCODE_CONFIG_PATH;
  }

  return config;
}

/**
 * Detect the opencode.json config file path
 * Priority: env var > project local > global
 */
export function detectConfigPath(workingDirectory?: string): string | null {
  // 1. Explicit env var override
  if (process.env.OPENCODE_CONFIG_PATH) {
    return process.env.OPENCODE_CONFIG_PATH;
  }

  // 2. Project-local config
  if (workingDirectory) {
    const localConfig = join(workingDirectory, '.opencode', 'opencode.json');
    if (existsSync(localConfig)) {
      return localConfig;
    }
  }

  // 3. Global config
  const globalConfig = join(homedir(), '.config', 'opencode', 'opencode.json');
  if (existsSync(globalConfig)) {
    return globalConfig;
  }

  // 4. Default to global path (will be created if needed)
  return globalConfig;
}

/**
 * Read opencode.json config file
 */
export function readOpenCodeConfig(configPath: string): Record<string, unknown> {
  try {
    if (!existsSync(configPath)) {
      return {};
    }
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[config] Failed to read ${configPath}:`, error);
    return {};
  }
}

/**
 * Write opencode.json config file (merge with existing)
 */
export function writeOpenCodeConfig(
  configPath: string, 
  updates: Record<string, unknown>
): { success: boolean; error?: string } {
  try {
    // Read existing config
    const existing = readOpenCodeConfig(configPath);
    
    // Deep merge
    const merged = deepMerge(existing, updates);
    
    // Write back
    writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(
  target: Record<string, unknown>, 
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      result[key] = sourceValue;
    }
  }
  
  return result;
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
