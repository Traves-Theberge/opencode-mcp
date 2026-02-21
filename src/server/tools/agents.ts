/**
 * Agent Tools
 * 
 * Tools for agent management and delegation through OpenCode.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolResult } from '../utils/types.js';
import type { OpenCodeClient } from '../client/opencode.js';
import { resolveModel } from '../client/opencode.js';

// ============================================================================
// Input Schemas
// ============================================================================

const AgentListInputSchema = z.object({});

const AgentDelegateInputSchema = z.object({
  agent: z.string().min(1).describe('Agent name to invoke (e.g., build, plan, explore, or custom agent)'),
  prompt: z.string().min(1).describe('Task for the agent'),
  sessionId: z.string().optional().describe('Session ID (creates new if not provided)'),
  model: z.string().optional().describe('Model in format provider/model'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export function getAgentToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'opencode_agent_list',
      description: 'List all available agents (primary and subagents). Primary agents are used for main conversations, subagents are specialized assistants that can be invoked for specific tasks.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'opencode_agent_delegate',
      description: 'Delegate a task to a specific agent. Use to invoke specialized agents like "plan" for analysis without changes, "explore" for fast codebase exploration, or custom agents for specific workflows.',
      inputSchema: {
        type: 'object',
        properties: {
          agent: { type: 'string', description: 'Agent name to invoke (e.g., build, plan, explore, or custom agent)' },
          prompt: { type: 'string', description: 'Task for the agent' },
          sessionId: { type: 'string', description: 'Session ID (creates new if not provided)' },
          model: { type: 'string', description: 'Model in format provider/model' },
        },
        required: ['agent', 'prompt'],
      },
    },
  ];
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createAgentHandlers(client: OpenCodeClient, defaultModel?: string) {
  return {
    async opencode_agent_list(): Promise<ToolResult> {
      try {
        const agents = await client.listAgents();
        
        // Separate primary and subagents
        const primary = agents.filter(a => a.mode === 'primary' && !a.hidden);
        const subagents = agents.filter(a => a.mode === 'subagent' && !a.hidden);
        
        const output = {
          primary: primary.map(a => ({
            name: a.name,
            description: a.description,
            model: a.model,
          })),
          subagents: subagents.map(a => ({
            name: a.name,
            description: a.description,
            model: a.model,
          })),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing agents: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_agent_delegate(input: unknown): Promise<ToolResult> {
      const parsed = AgentDelegateInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        // Create or use existing session
        let sessionId = parsed.data.sessionId;
        if (!sessionId) {
          const session = await client.createSession(
            undefined,
            resolveModel(parsed.data.model, defaultModel)
          );
          sessionId = session.id;
        }

        // Send the prompt with the specified agent
        const result = await client.prompt(sessionId, parsed.data.prompt, {
          agent: parsed.data.agent,
          model: resolveModel(parsed.data.model, defaultModel),
        });

        const output = {
          agent: parsed.data.agent,
          sessionId: result.sessionId,
          messageId: result.messageId,
          content: result.content,
          structuredOutput: result.structuredOutput,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error delegating to agent: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type AgentHandlers = ReturnType<typeof createAgentHandlers>;
