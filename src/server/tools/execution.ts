/**
 * Execution Tools
 * 
 * Tools for running prompts and managing sessions through OpenCode.
 */

import { z } from 'zod';
import { stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import type { OpenCodeClient } from '../../client/opencode.js';
import { resolveModel } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';

// ============================================================================
// Project Directory Detection
// ============================================================================

const PROJECT_MARKERS = [
  '.git',
  'package.json',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'setup.py',
  'pom.xml',
  'build.gradle',
];

/**
 * Try to find the project root by looking for project markers
 */
async function findProjectRoot(startDir: string): Promise<string | null> {
  let currentDir = startDir;
  
  for (let i = 0; i < 20; i++) { // Max 20 levels up
    for (const marker of PROJECT_MARKERS) {
      try {
        await access(join(currentDir, marker));
        return currentDir;
      } catch {
        // Marker not found, continue
      }
    }
    
    const parent = dirname(currentDir);
    if (parent === currentDir) break; // Reached root
    currentDir = parent;
  }
  
  return null;
}

/**
 * Get the working directory to use
 * Priority: explicit param > env var > project root detection > fallback
 */
async function getWorkingDirectory(explicitDir?: string): Promise<{ directory: string; source: string }> {
  // If explicitly provided, use it
  if (explicitDir) {
    try {
      const dirStat = await stat(explicitDir);
      if (dirStat.isDirectory()) {
        return { directory: explicitDir, source: 'explicit' };
      }
    } catch (error) {
      throw new Error(`Specified directory does not exist: ${explicitDir}`, { cause: error });
    }
  }
  
  // Check for default project from environment variable
  const envProject = process.env.OPENCODE_DEFAULT_PROJECT;
  if (envProject) {
    try {
      const dirStat = await stat(envProject);
      if (dirStat.isDirectory()) {
        return { directory: envProject, source: 'env' };
      }
    } catch {
      console.error(`[getWorkingDirectory] OPENCODE_DEFAULT_PROJECT directory does not exist: ${envProject}`);
    }
  }
  
  // Try to detect from current working directory
  const cwd = process.cwd();
  const projectRoot = await findProjectRoot(cwd);
  
  if (projectRoot) {
    return { directory: projectRoot, source: 'detected' };
  }
  
  // Fallback to cwd
  return { directory: cwd, source: 'fallback' };
}

function extractMessageText(parts: unknown[]): string {
  let content = '';
  for (const part of parts) {
    if (part && typeof part === 'object' && 'type' in part && part.type === 'text' && 'text' in part) {
      content += String((part as { text: unknown }).text);
    }
  }
  return content;
}

function isAssistantCompleted(info: unknown): boolean {
  if (!info || typeof info !== 'object') return false;
  if (!('role' in info) || (info as { role?: string }).role !== 'assistant') return false;
  const time = (info as { time?: { completed?: number } }).time;
  return typeof time?.completed === 'number';
}

function getMessageError(info: unknown): string | undefined {
  if (!info || typeof info !== 'object') return undefined;
  const error = (info as { error?: { name?: string; data?: { message?: string } } }).error;
  if (!error) return undefined;
  const name = error.name ?? 'UnknownError';
  const message = error.data?.message ?? 'Unknown error';
  return `${name}: ${message}`;
}

async function waitForMessageContent(
  client: OpenCodeClient,
  sessionId: string,
  messageId: string,
  timeoutMs = 60000,
  pollIntervalMs = 1000
): Promise<{ content: string; error?: string; completed: boolean }>
{
  const start = Date.now();
  let lastContent = '';

  while (Date.now() - start < timeoutMs) {
    const message = await client.getSessionMessage(sessionId, messageId);
    const parts = Array.isArray(message?.parts) ? message.parts : [];
    const content = extractMessageText(parts);
    const error = getMessageError(message?.info);
    const completed = isAssistantCompleted(message?.info);

    if (content) {
      return { content, error, completed: true };
    }

    lastContent = content || lastContent;

    if (completed) {
      return { content: lastContent, error, completed: true };
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return { content: lastContent, completed: false };
}

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  RunInputSchema: {
    prompt: z.string().min(1, { error: 'Prompt is required' }).describe('The task or question for OpenCode'),
    workingDirectory: z.string().optional().describe('Project directory path (auto-detected if not specified)'),
    model: z.string().optional().describe('Model in format provider/model (e.g., anthropic/claude-sonnet-4)'),
    agent: z.string().optional().describe('Agent to use: build, plan, or custom agent name'),
    files: z.array(z.string()).optional().describe('File paths to attach as context'),
    noReply: z.boolean().optional().describe('Add context without triggering AI response'),
  },
  
  SessionCreateInputSchema: {
    workingDirectory: z.string().optional().describe('Project directory path (auto-detected if not specified)'),
    title: z.string().optional().describe('Session title'),
    model: z.string().optional().describe('Model in format provider/model'),
    agent: z.string().optional().describe('Agent to use'),
  },
  
  SessionPromptInputSchema: {
    sessionId: z.string().min(1, { error: 'Session ID is required' }).describe('Session ID from opencode_session_create'),
    prompt: z.string().min(1, { error: 'Prompt is required' }).describe('The message to send'),
    files: z.array(z.string()).optional().describe('File paths to attach'),
    noReply: z.boolean().optional().describe('Add context without triggering AI response'),
  },
  
  SessionIdInputSchema: {
    sessionId: z.string().min(1, { error: 'Session ID is required' }).describe('Session ID'),
  },
  
  EmptySchema: {},
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getExecutionToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_run',
      description: 'Execute a coding task through OpenCode AI agent. Use for implementing features, refactoring, debugging, explaining code, or any software engineering task. Working directory is auto-detected from project root if not specified.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The task or question for OpenCode' },
          workingDirectory: { type: 'string', description: 'Project directory path (auto-detected if not specified)' },
          model: { type: 'string', description: 'Model in format provider/model' },
          agent: { type: 'string', description: 'Agent to use' },
          files: { type: 'array', items: { type: 'string' }, description: 'File paths to attach' },
          noReply: { type: 'boolean', description: 'Add context without triggering AI response' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'opencode_session_create',
      description: 'Create a new OpenCode session for multi-turn conversations. Returns a session ID that can be used for subsequent prompts. Working directory is auto-detected from project root if not specified.',
      inputSchema: {
        type: 'object',
        properties: {
          workingDirectory: { type: 'string', description: 'Project directory path (auto-detected if not specified)' },
          title: { type: 'string', description: 'Session title' },
          model: { type: 'string', description: 'Model in format provider/model' },
        },
        required: [],
      },
    },
    {
      name: 'opencode_session_prompt',
      description: 'Send a prompt to an existing OpenCode session.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID' },
          prompt: { type: 'string', description: 'The message to send' },
          files: { type: 'array', items: { type: 'string' } },
          noReply: { type: 'boolean' },
        },
        required: ['sessionId', 'prompt'],
      },
    },
    {
      name: 'opencode_session_list',
      description: 'List all OpenCode sessions.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'opencode_session_abort',
      description: 'Abort a running OpenCode session.',
      inputSchema: {
        type: 'object',
        properties: { sessionId: { type: 'string' } },
        required: ['sessionId'],
      },
    },
  ];
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createExecutionHandlers(client: OpenCodeClient, defaultModel?: string) {
  return {
    async opencode_run(params: { prompt: string; workingDirectory?: string; model?: string; agent?: string; files?: string[]; noReply?: boolean }) {
      try {
        // Get working directory (auto-detect if not specified)
        let workingDir: { directory: string; source: string };
        try {
          workingDir = await getWorkingDirectory(params.workingDirectory);
        } catch (e) {
          return createErrorResponse(
            'Detecting working directory',
            e,
            [
              'Specify workingDirectory parameter explicitly',
              'Make sure you are in a project directory with .git or package.json',
            ]
          );
        }
        
        console.error(`[opencode_run] Using directory: ${workingDir.directory} (source: ${workingDir.source})`);

        // Create a session for this run
        const session = await client.createSession(
          undefined,
          resolveModel(params.model, defaultModel),
          workingDir.directory
        );
        
        console.error(`[opencode_run] Session created: ${session.id}, directory: ${session.directory}`);

        // Send the prompt
        const result = await client.prompt(session.id, params.prompt, {
          model: resolveModel(params.model, defaultModel),
          agent: params.agent,
          files: params.files,
          noReply: params.noReply,
        });

        let content = result.content;
        let messageError: string | undefined;

        if (!params.noReply && result.messageId) {
          const waited = await waitForMessageContent(client, session.id, result.messageId);
          if (waited.content) {
            content = waited.content;
          }
          messageError = waited.error;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            sessionId: result.sessionId,
            messageId: result.messageId,
            content,
            error: messageError,
            workingDirectory: workingDir.directory,
            directorySource: workingDir.source,
            sessionDirectory: session.directory,
          }, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Executing OpenCode task',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_session_create(params: { workingDirectory?: string; title?: string; model?: string }) {
      try {
        // Get working directory (auto-detect if not specified)
        let workingDir: { directory: string; source: string };
        try {
          workingDir = await getWorkingDirectory(params.workingDirectory);
        } catch (e) {
          return createErrorResponse(
            'Detecting working directory',
            e,
            [
              'Specify workingDirectory parameter explicitly',
              'Make sure you are in a project directory with .git or package.json',
            ]
          );
        }

        const session = await client.createSession(
          params.title,
          resolveModel(params.model, defaultModel),
          workingDir.directory
        );

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            sessionId: session.id,
            title: session.title,
            workingDirectory: workingDir.directory,
            directorySource: workingDir.source,
            sessionDirectory: session.directory,
          }, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Creating OpenCode session',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_session_prompt(params: { sessionId: string; prompt: string; files?: string[]; noReply?: boolean }) {
      try {
        const result = await client.prompt(params.sessionId, params.prompt, {
          files: params.files,
          noReply: params.noReply,
        });

        let content = result.content;
        let messageError: string | undefined;

        if (!params.noReply && result.messageId) {
          const waited = await waitForMessageContent(client, params.sessionId, result.messageId);
          if (waited.content) {
            content = waited.content;
          }
          messageError = waited.error;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            ...result,
            content,
            error: messageError,
          }, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const suggestions = errorMessage.toLowerCase().includes('session')
          ? ERROR_SUGGESTIONS.sessionNotFound
          : ERROR_SUGGESTIONS.connectionFailed;
        
        return createErrorResponse(
          'Sending prompt to session',
          error,
          suggestions
        );
      }
    },

    async opencode_session_list() {
      try {
        const sessions = await client.listSessions();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(sessions, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing sessions',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_session_abort(params: { sessionId: string }) {
      try {
        const success = await client.abortSession(params.sessionId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ 
            success,
            message: success ? 'Session aborted successfully' : 'Session may have already completed',
          }) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Aborting session',
          error,
          ERROR_SUGGESTIONS.sessionNotFound
        );
      }
    },
  };
}

export type ExecutionHandlers = ReturnType<typeof createExecutionHandlers>;
