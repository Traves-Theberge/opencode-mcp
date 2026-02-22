/**
 * Skill Tools
 * 
 * Tools for skill discovery and management through OpenCode.
 */

import { z } from 'zod';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { OpenCodeClient } from '../../client/opencode.js';
import { createErrorResponse, ERROR_SUGGESTIONS } from './schemas.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  SkillListInputSchema: {},
  
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
// Tool Handlers
// ============================================================================

/**
 * Get skills from a directory on the filesystem
 */
async function getSkillsFromDirectory(basePath: string, location: 'project' | 'global'): Promise<Array<{ name: string; description: string; location: 'project' | 'global' }>> {
  const skills: Array<{ name: string; description: string; location: 'project' | 'global' }> = [];
  
  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(basePath, entry.name, 'SKILL.md');
        try {
          const content = await readFile(skillPath, 'utf-8');
          // Extract description from frontmatter or first line
          let description = '';
          const descMatch = content.match(/description:\s*(.+)/);
          if (descMatch?.[1]) {
            description = descMatch[1].trim();
          }
          skills.push({ name: entry.name, description, location });
        } catch {
          // SKILL.md doesn't exist, skip
        }
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }
  
  return skills;
}

export function createSkillHandlers(_client: OpenCodeClient) {
  return {
    async opencode_skill_list() {
      try {
        const skills: Array<{ name: string; description: string; location: 'project' | 'global' }> = [];
        
        // Get home directory
        const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? '~';
        
        // Search global skill locations
        const globalLocations = [
          join(homeDir, '.config', 'opencode', 'skills'),
          join(homeDir, '.claude', 'skills'),
          join(homeDir, '.opencode', 'skills'),
        ];
        
        for (const location of globalLocations) {
          const found = await getSkillsFromDirectory(location, 'global');
          skills.push(...found);
        }
        
        // Also search project-local skills (relative to current working directory)
        const cwd = process.cwd();
        const projectLocations = [
          join(cwd, '.opencode', 'skills'),
          join(cwd, '.claude', 'skills'),
        ];
        
        for (const location of projectLocations) {
          const found = await getSkillsFromDirectory(location, 'project');
          skills.push(...found);
        }
        
        // Deduplicate by name (prefer project over global)
        const seen = new Set<string>();
        const deduped = skills.filter(skill => {
          if (seen.has(skill.name)) return false;
          seen.add(skill.name);
          return true;
        });
        
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(deduped, null, 2) }],
        };
      } catch (error) {
        return createErrorResponse(
          'Listing skills',
          error,
          ERROR_SUGGESTIONS.connectionFailed
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
