/**
 * Skill Tools
 * 
 * Tools for skill discovery and management through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  SkillListInputSchema: {},
  
  SkillLoadInputSchema: {
    name: z.string().min(1, { error: 'Skill name is required' }).describe('Skill name to load'),
  },
  
  SkillCreateInputSchema: {
    name: z.string().min(1).max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: 'Skill name must be lowercase alphanumeric with hyphens' }).describe('Skill name'),
    description: z.string().min(1).max(1024).describe('When to use this skill'),
    content: z.string().min(1).describe('Skill content/instructions'),
    global: z.boolean().optional().describe('Create globally (default: project-local)'),
  },
  
  EmptySchema: {},
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getSkillToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_skill_list',
      description: 'List all available skills from SKILL.md files. Skills are reusable behavior definitions that can be loaded on-demand.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'opencode_skill_load',
      description: 'Load a skill and return its content. Skills provide specialized instructions for specific tasks.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
    {
      name: 'opencode_skill_create',
      description: 'Create a new skill (SKILL.md file). Skills are reusable prompt templates for specialized tasks.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          global: { type: 'boolean' },
        },
        required: ['name', 'description', 'content'],
      },
    },
  ];
}

// ============================================================================
// Skill Types
// ============================================================================

interface Skill {
  name: string;
  description: string;
  location: 'project' | 'global';
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createSkillHandlers(client: OpenCodeClient) {
  return {
    async opencode_skill_list() {
      try {
        // Skills are stored in SKILL.md files in various locations
        // We'll search for them using the file search
        const projectSkills: string[] = await client.findFiles('.opencode/skills/*/SKILL.md', 'file') ?? [];
        const globalSkills: string[] = await client.findFiles('.claude/skills/*/SKILL.md', 'file') ?? [];
        
        // Parse skill names from paths
        const skills: Skill[] = [];
        
        for (const path of projectSkills) {
          const match = path?.match(/\.opencode\/skills\/([^/]+)\/SKILL\.md$/);
          if (match?.[1]) {
            skills.push({ name: match[1], description: '', location: 'project' });
          }
        }
        
        for (const path of globalSkills) {
          const match = path?.match(/\.claude\/skills\/([^/]+)\/SKILL\.md$/);
          if (match?.[1]) {
            skills.push({ name: match[1], description: '', location: 'global' });
          }
        }
        
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(skills, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing skills',
          error,
          ERROR_SUGGESTIONS.connectionFailed
        );
      }
    },

    async opencode_skill_load(params: { name: string }) {
      try {
        // Try to read the skill file from various locations
        const paths = [
          `.opencode/skills/${params.name}/SKILL.md`,
          `.claude/skills/${params.name}/SKILL.md`,
          `.agents/skills/${params.name}/SKILL.md`,
        ];
        
        for (const path of paths) {
          try {
            const result = await client.readFile(path);
            return {
              content: [{ type: 'text' as const, text: result.content }],
            };
          } catch {
            // Try next path
            continue;
          }
        }
        
        return createErrorResponse(
          `Loading skill "${params.name}"`,
          new Error('Skill not found in any known location'),
          ERROR_SUGGESTIONS.skillNotFound
        );
      } catch (error) {
        return createErrorResponse(
          `Loading skill "${params.name}"`,
          error,
          ERROR_SUGGESTIONS.skillNotFound
        );
      }
    },

    async opencode_skill_create(params: { name: string; description: string; content: string; global?: boolean }) {
      try {
        // Create SKILL.md content with frontmatter
        const skillContent = `---
name: ${params.name}
description: ${params.description}
---

${params.content}`;
        
        // Determine path based on global flag
        const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? '~';
        const basePath = params.global 
          ? `${homeDir}/.config/opencode/skills`
          : '.opencode/skills';
        
        const skillPath = `${basePath}/${params.name}/SKILL.md`;
        
        // Note: This requires write access which may not be available
        // For now, return instructions for manual creation
        return {
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              message: 'Skill definition created. Save this content to the specified path:',
              path: skillPath,
              content: skillContent,
              instructions: [
                `Create the directory: mkdir -p ${basePath}/${params.name}`,
                `Save the content to: ${skillPath}`,
                'Or use opencode_run to create the file programmatically',
              ],
            }, null, 2) 
          }],
        };
      } catch (error) {
        return createErrorResponse(
          `Creating skill "${params.name}"`,
          error,
          ERROR_SUGGESTIONS.invalidInput
        );
      }
    },
  };
}

export type SkillHandlers = ReturnType<typeof createSkillHandlers>;
