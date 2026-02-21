/**
 * Execution Tools
 * 
 * Tools for running prompts and managing sessions through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';
import { resolveModel } from '../../client/opencode.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  RunInputSchema: {
    prompt: z.string().min(1).describe('The task or question for OpenCode'),
    model: z.string().optional().describe('Model in format provider/model (e.g., anthropic/claude-sonnet-4)'),
    agent: z.string().optional().describe('Agent to use: build, plan, or custom agent name'),
    workingDirectory: z.string().optional().describe('Project directory path'),
    files: z.array(z.string()).optional().describe('File paths to attach as context'),
    noReply: z.boolean().optional().describe('Add context without triggering AI response'),
  },
  
  SessionCreateInputSchema: {
    title: z.string().optional().describe('Session title'),
    model: z.string().optional().describe('Model in format provider/model'),
    agent: z.string().optional().describe('Agent to use'),
    workingDirectory: z.string().optional().describe('Project directory'),
  },
  
  SessionPromptInputSchema: {
    sessionId: z.string().min(1).describe('Session ID from opencode_session_create'),
    prompt: z.string().min(1).describe('The message to send'),
    files: z.array(z.string()).optional().describe('File paths to attach'),
    noReply: z.boolean().optional().describe('Add context without triggering AI response'),
  },
  
  SessionIdInputSchema: {
    sessionId: z.string().min(1).describe('Session ID'),
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
      description: 'Execute a coding task through OpenCode AI agent. Use for implementing features, refactoring, debugging, explaining code, or any software engineering task.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The task or question for OpenCode' },
          model: { type: 'string', description: 'Model in format provider/model' },
          agent: { type: 'string', description: 'Agent to use' },
          workingDirectory: { type: 'string', description: 'Project directory path' },
          files: { type: 'array', items: { type: 'string' }, description: 'File paths to attach' },
          noReply: { type: 'boolean', description: 'Add context without triggering AI response' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'opencode_session_create',
      description: 'Create a new OpenCode session for multi-turn conversations. Returns a session ID that can be used for subsequent prompts.',
      inputSchema: { type: 'object', properties: {} },
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
    async opencode_run(params: { prompt: string; model?: string; agent?: string; files?: string[]; noReply?: boolean }) {
      try {
        // Create a session for this run
        const session = await client.createSession(
          undefined,
          resolveModel(params.model, defaultModel)
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
          }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_create(params: { title?: string; model?: string }) {
      try {
        const session = await client.createSession(
          params.title,
          resolveModel(params.model, defaultModel)
        );

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            sessionId: session.id,
            title: session.title,
          }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
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
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_list() {
      try {
        const sessions = await client.listSessions();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(sessions, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_abort(params: { sessionId: string }) {
      try {
        const success = await client.abortSession(params.sessionId);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success }) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
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
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type ExecutionHandlers = ReturnType<typeof createExecutionHandlers>;
