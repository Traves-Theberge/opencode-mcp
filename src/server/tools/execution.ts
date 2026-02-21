/**
 * Execution Tools
 * 
 * Tools for running prompts and managing sessions through OpenCode.
 */

import { z } from 'zod';
import { stat } from 'fs/promises';
import type { OpenCodeClient } from '../../client/opencode.js';
import { resolveModel } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  RunInputSchema: {
    prompt: z.string().min(1, { error: 'Prompt is required' }).describe('The task or question for OpenCode'),
    workingDirectory: z.string().min(1, { error: 'Working directory is required - specify the project directory path' }).describe('Project directory path (REQUIRED - the directory where files should be created/modified)'),
    model: z.string().optional().describe('Model in format provider/model (e.g., anthropic/claude-sonnet-4)'),
    agent: z.string().optional().describe('Agent to use: build, plan, or custom agent name'),
    files: z.array(z.string()).optional().describe('File paths to attach as context'),
    noReply: z.boolean().optional().describe('Add context without triggering AI response'),
  },
  
  SessionCreateInputSchema: {
    workingDirectory: z.string().min(1, { error: 'Working directory is required' }).describe('Project directory path (REQUIRED)'),
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
      description: 'Execute a coding task through OpenCode AI agent. Use for implementing features, refactoring, debugging, explaining code, or any software engineering task. IMPORTANT: workingDirectory is REQUIRED - always specify the project directory.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The task or question for OpenCode' },
          workingDirectory: { type: 'string', description: 'Project directory path (REQUIRED - where files will be created/modified)' },
          model: { type: 'string', description: 'Model in format provider/model' },
          agent: { type: 'string', description: 'Agent to use' },
          files: { type: 'array', items: { type: 'string' }, description: 'File paths to attach' },
          noReply: { type: 'boolean', description: 'Add context without triggering AI response' },
        },
        required: ['prompt', 'workingDirectory'],
      },
    },
    {
      name: 'opencode_session_create',
      description: 'Create a new OpenCode session for multi-turn conversations. Returns a session ID that can be used for subsequent prompts. IMPORTANT: workingDirectory is REQUIRED.',
      inputSchema: {
        type: 'object',
        properties: {
          workingDirectory: { type: 'string', description: 'Project directory path (REQUIRED)' },
          title: { type: 'string', description: 'Session title' },
          model: { type: 'string', description: 'Model in format provider/model' },
        },
        required: ['workingDirectory'],
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
    {
      name: 'opencode_session_share',
      description: 'Share an OpenCode session. Returns a shareable link.',
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
    async opencode_run(params: { prompt: string; workingDirectory: string; model?: string; agent?: string; files?: string[]; noReply?: boolean }) {
      try {
        // Validate working directory exists
        try {
          const dirStat = await stat(params.workingDirectory);
          if (!dirStat.isDirectory()) {
            return createErrorResponse(
              'Validating working directory',
              new Error(`${params.workingDirectory} is not a directory`),
              [
                'Provide a valid directory path',
                'Use absolute paths for clarity',
                'Example: /home/user/projects/my-project',
              ]
            );
          }
        } catch (e) {
          return createErrorResponse(
            'Validating working directory',
            new Error(`Directory does not exist: ${params.workingDirectory}`),
            [
              'Create the directory first, or use an existing project directory',
              'Use absolute paths for clarity',
              `Error: ${e instanceof Error ? e.message : String(e)}`,
            ]
          );
        }

        // Create a session for this run, passing working directory
        const session = await client.createSession(
          undefined,
          resolveModel(params.model, defaultModel),
          params.workingDirectory
        );

        // Send the prompt
        const result = await client.prompt(session.id, params.prompt, {
          model: resolveModel(params.model, defaultModel),
          agent: params.agent,
          files: params.files,
          noReply: params.noReply,
        });

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            sessionId: result.sessionId,
            messageId: result.messageId,
            content: result.content,
            workingDirectory: params.workingDirectory,
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

    async opencode_session_create(params: { workingDirectory: string; title?: string; model?: string }) {
      try {
        // Validate working directory exists
        try {
          const dirStat = await stat(params.workingDirectory);
          if (!dirStat.isDirectory()) {
            return createErrorResponse(
              'Validating working directory',
              new Error(`${params.workingDirectory} is not a directory`),
              [
                'Provide a valid directory path',
                'Use absolute paths for clarity',
              ]
            );
          }
        } catch (e) {
          return createErrorResponse(
            'Validating working directory',
            new Error(`Directory does not exist: ${params.workingDirectory}`),
            [
              'Create the directory first, or use an existing project directory',
              `Error: ${e instanceof Error ? e.message : String(e)}`,
            ]
          );
        }

        const session = await client.createSession(
          params.title,
          resolveModel(params.model, defaultModel),
          params.workingDirectory
        );

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            sessionId: session.id,
            title: session.title,
            workingDirectory: params.workingDirectory,
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

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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

    async opencode_session_share(params: { sessionId: string }) {
      try {
        const session = await client.shareSession(params.sessionId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            shareUrl: `https://opencode.ai/s/${session.shareToken}`,
          }, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Sharing session',
          error,
          ERROR_SUGGESTIONS.sessionNotFound
        );
      }
    },
  };
}

export type ExecutionHandlers = ReturnType<typeof createExecutionHandlers>;
