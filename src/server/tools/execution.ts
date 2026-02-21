/**
 * Execution Tools
 * 
 * Tools for running prompts and managing sessions through OpenCode.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolResult } from '../utils/types.js';
import type { OpenCodeClient } from '../client/opencode.js';
import { resolveModel } from '../client/opencode.js';

// ============================================================================
// Input Schemas
// ============================================================================

const RunInputSchema = z.object({
  prompt: z.string().min(1).describe('The task or question for OpenCode'),
  model: z.string().optional().describe('Model in format provider/model (e.g., anthropic/claude-sonnet-4)'),
  agent: z.string().optional().describe('Agent to use: build, plan, or custom agent name'),
  workingDirectory: z.string().optional().describe('Project directory path'),
  files: z.array(z.string()).optional().describe('File paths to attach as context'),
  noReply: z.boolean().optional().describe('Add context without triggering AI response'),
  structuredOutput: z.object({
    schema: z.record(z.any()).describe('JSON Schema for structured output'),
  }).optional(),
});

const SessionCreateInputSchema = z.object({
  title: z.string().optional().describe('Session title'),
  model: z.string().optional().describe('Model in format provider/model'),
  agent: z.string().optional().describe('Agent to use'),
  workingDirectory: z.string().optional().describe('Project directory'),
});

const SessionPromptInputSchema = z.object({
  sessionId: z.string().min(1).describe('Session ID from opencode_session_create'),
  prompt: z.string().min(1).describe('The message to send'),
  files: z.array(z.string()).optional().describe('File paths to attach'),
  noReply: z.boolean().optional().describe('Add context without triggering AI response'),
});

const SessionIdInputSchema = z.object({
  sessionId: z.string().min(1).describe('Session ID'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export function getExecutionToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'opencode_run',
      description: 'Execute a coding task through OpenCode AI agent. Use for implementing features, refactoring, debugging, explaining code, or any software engineering task. Delegates the entire task to OpenCode which will use its full toolset to complete it.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The task or question for OpenCode' },
          model: { type: 'string', description: 'Model in format provider/model (e.g., anthropic/claude-sonnet-4)' },
          agent: { type: 'string', description: 'Agent to use: build, plan, or custom agent name' },
          workingDirectory: { type: 'string', description: 'Project directory path' },
          files: { type: 'array', items: { type: 'string' }, description: 'File paths to attach as context' },
          noReply: { type: 'boolean', description: 'Add context without triggering AI response' },
          structuredOutput: {
            type: 'object',
            properties: {
              schema: { type: 'object', description: 'JSON Schema for structured output' },
            },
          },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'opencode_session_create',
      description: 'Create a new OpenCode session for multi-turn conversations. Returns a session ID that can be used for subsequent prompts.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Session title' },
          model: { type: 'string', description: 'Model in format provider/model' },
          agent: { type: 'string', description: 'Agent to use' },
          workingDirectory: { type: 'string', description: 'Project directory' },
        },
      },
    },
    {
      name: 'opencode_session_prompt',
      description: 'Send a prompt to an existing OpenCode session. Use for multi-turn conversations where you want to continue working in the same context.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID from opencode_session_create' },
          prompt: { type: 'string', description: 'The message to send' },
          files: { type: 'array', items: { type: 'string' }, description: 'File paths to attach' },
          noReply: { type: 'boolean', description: 'Add context without triggering AI response' },
        },
        required: ['sessionId', 'prompt'],
      },
    },
    {
      name: 'opencode_session_list',
      description: 'List all OpenCode sessions.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'opencode_session_abort',
      description: 'Abort a running OpenCode session.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID' },
        },
        required: ['sessionId'],
      },
    },
    {
      name: 'opencode_session_share',
      description: 'Share an OpenCode session. Returns a shareable link.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID' },
        },
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
    async opencode_run(input: unknown): Promise<ToolResult> {
      const parsed = RunInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        // Create a session for this run
        const session = await client.createSession(
          undefined,
          resolveModel(parsed.data.model, defaultModel)
        );

        // Send the prompt
        const result = await client.prompt(session.id, parsed.data.prompt, {
          model: resolveModel(parsed.data.model, defaultModel),
          agent: parsed.data.agent,
          files: parsed.data.files,
          noReply: parsed.data.noReply,
          structuredOutput: parsed.data.structuredOutput,
        });

        const response: Record<string, unknown> = {
          sessionId: result.sessionId,
          messageId: result.messageId,
          content: result.content,
        };

        if (result.structuredOutput) {
          response.structuredOutput = result.structuredOutput;
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_create(input: unknown): Promise<ToolResult> {
      const parsed = SessionCreateInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const session = await client.createSession(
          parsed.data.title,
          resolveModel(parsed.data.model, defaultModel)
        );

        return {
          content: [{ type: 'text', text: JSON.stringify({ sessionId: session.id, title: session.title }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_prompt(input: unknown): Promise<ToolResult> {
      const parsed = SessionPromptInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const result = await client.prompt(parsed.data.sessionId, parsed.data.prompt, {
          files: parsed.data.files,
          noReply: parsed.data.noReply,
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_list(): Promise<ToolResult> {
      try {
        const sessions = await client.listSessions();
        return {
          content: [{ type: 'text', text: JSON.stringify(sessions, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_abort(input: unknown): Promise<ToolResult> {
      const parsed = SessionIdInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const success = await client.abortSession(parsed.data.sessionId);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success }) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_session_share(input: unknown): Promise<ToolResult> {
      const parsed = SessionIdInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const session = await client.shareSession(parsed.data.sessionId);
        return {
          content: [{ type: 'text', text: JSON.stringify({ shareUrl: `https://opencode.ai/s/${session.shareToken}` }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type ExecutionHandlers = ReturnType<typeof createExecutionHandlers>;
