/**
 * Agent Tools
 * 
 * Tools for agent management and delegation through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';
import { resolveModel } from '../../client/opencode.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  AgentListInputSchema: {},
  
  AgentDelegateInputSchema: {
    agent: z.string().min(1).describe('Agent name to invoke (e.g., build, plan, explore, or custom agent)'),
    prompt: z.string().min(1).describe('Task for the agent'),
    sessionId: z.string().optional().describe('Session ID (creates new if not provided)'),
    model: z.string().optional().describe('Model in format provider/model'),
  },
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getAgentToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_agent_list',
      description: 'List all available agents (primary and subagents). Primary agents are used for main conversations, subagents are specialized assistants that can be invoked for specific tasks.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'opencode_agent_delegate',
      description: 'Delegate a task to a specific agent. Use to invoke specialized agents like "plan" for analysis without changes, "explore" for fast codebase exploration, or custom agents for specific workflows.',
      inputSchema: {
        type: 'object',
        properties: {
          agent: { type: 'string' },
          prompt: { type: 'string' },
          sessionId: { type: 'string' },
          model: { type: 'string' },
        },
        required: ['agent', 'prompt'],
      },
    },
  ];
}

// ============================================================================
// Types for API responses
// ============================================================================

interface AgentData {
  name: string;
  description: string;
  mode: 'primary' | 'subagent';
  model?: string;
  hidden?: boolean;
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createAgentHandlers(client: OpenCodeClient, defaultModel?: string) {
  return {
    async opencode_agent_list() {
      try {
        const agents = await client.listAgents();
        
        // Type assert agents
        const typedAgents = agents as AgentData[];
        
        // Separate primary and subagents
        const primary = typedAgents.filter((a: AgentData) => a.mode === 'primary' && !a.hidden);
        const subagents = typedAgents.filter((a: AgentData) => a.mode === 'subagent' && !a.hidden);
        
        const output = {
          primary: primary.map((a: AgentData) => ({
            name: a.name,
            description: a.description,
            model: a.model,
          })),
          subagents: subagents.map((a: AgentData) => ({
            name: a.name,
            description: a.description,
            model: a.model,
          })),
        };

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error listing agents: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_agent_delegate(params: { agent: string; prompt: string; sessionId?: string; model?: string }) {
      try {
        // Create or use existing session
        let sessionId = params.sessionId;
        if (!sessionId) {
          const session = await client.createSession(
            undefined,
            resolveModel(params.model, defaultModel)
          );
          sessionId = session.id;
        }

        // Send the prompt with the specified agent
        const result = await client.prompt(sessionId, params.prompt, {
          agent: params.agent,
          model: resolveModel(params.model, defaultModel),
        });

        const output = {
          agent: params.agent,
          sessionId: result.sessionId,
          messageId: result.messageId,
          content: result.content,
        };

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error delegating to agent: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type AgentHandlers = ReturnType<typeof createAgentHandlers>;
