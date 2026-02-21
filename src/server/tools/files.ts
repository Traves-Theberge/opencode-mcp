/**
 * File Tools
 * 
 * Tools for file operations and search through OpenCode.
 */

import { z } from 'zod';
import type { ToolDefinition, ToolResult } from '../../utils/types.js';
import type { OpenCodeClient } from '../../client/opencode.js';

// ============================================================================
// Input Schemas
// ============================================================================

const FileReadInputSchema = z.object({
  path: z.string().min(1).describe('File path relative to project root'),
});

const FileSearchInputSchema = z.object({
  pattern: z.string().min(1).describe('Search pattern (regex supported)'),
  directory: z.string().optional().describe('Limit to directory'),
});

const FindFilesInputSchema = z.object({
  query: z.string().min(1).describe('File name pattern (fuzzy match)'),
  type: z.enum(['file', 'directory']).optional().describe('Filter by type'),
  limit: z.number().min(1).max(200).optional().describe('Max results (1-200)'),
});

const FindSymbolsInputSchema = z.object({
  query: z.string().min(1).describe('Symbol name to search for'),
});

const FileStatusInputSchema = z.object({
  path: z.string().optional().describe('Filter by path'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export function getFileToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'opencode_file_read',
      description: 'Read a file from the OpenCode project. Returns the file content as text.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
        },
        required: ['path'],
      },
    },
    {
      name: 'opencode_file_search',
      description: 'Search for text pattern in project files. Supports regex patterns.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search pattern (regex supported)' },
          directory: { type: 'string', description: 'Limit to directory' },
        },
        required: ['pattern'],
      },
    },
    {
      name: 'opencode_find_files',
      description: 'Find files and directories by name pattern using fuzzy matching.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'File name pattern (fuzzy match)' },
          type: { type: 'string', enum: ['file', 'directory'], description: 'Filter by type' },
          limit: { type: 'number', description: 'Max results (1-200)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'opencode_find_symbols',
      description: 'Find workspace symbols (functions, classes, variables) by name.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Symbol name to search for' },
        },
        required: ['query'],
      },
    },
    {
      name: 'opencode_file_status',
      description: 'Get git status for tracked files.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Filter by path' },
        },
      },
    },
  ];
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createFileHandlers(client: OpenCodeClient) {
  return {
    async opencode_file_read(input: unknown): Promise<ToolResult> {
      const parsed = FileReadInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const result = await client.readFile(parsed.data.path);
        return {
          content: [{ type: 'text', text: result.content }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_file_search(input: unknown): Promise<ToolResult> {
      const parsed = FileSearchInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const results = await client.searchText(parsed.data.pattern, parsed.data.directory);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error searching files: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_find_files(input: unknown): Promise<ToolResult> {
      const parsed = FindFilesInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const results = await client.findFiles(
          parsed.data.query,
          parsed.data.type,
          parsed.data.limit
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error finding files: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_find_symbols(input: unknown): Promise<ToolResult> {
      const parsed = FindSymbolsInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        const results = await client.findSymbols(parsed.data.query);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error finding symbols: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_file_status(input: unknown): Promise<ToolResult> {
      const parsed = FileStatusInputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          content: [{ type: 'text', text: `Invalid input: ${parsed.error.message}` }],
          isError: true,
        };
      }

      try {
        // File status requires the file status endpoint
        // For now, return a message that this is not yet implemented
        return {
          content: [{ type: 'text', text: 'File status not yet implemented in SDK wrapper' }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error getting file status: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type FileHandlers = ReturnType<typeof createFileHandlers>;
