/**
 * File Tools
 * 
 * Tools for file operations and search through OpenCode.
 */

import { z } from 'zod';
import type { OpenCodeClient } from '../../client/opencode.js';

// ============================================================================
// Input Schemas (exported for MCP SDK)
// ============================================================================

export const INPUT_SCHEMAS = {
  FileReadInputSchema: {
    path: z.string().min(1).describe('File path relative to project root'),
  },
  
  FileSearchInputSchema: {
    pattern: z.string().min(1).describe('Search pattern (regex supported)'),
    directory: z.string().optional().describe('Limit to directory'),
  },
  
  FindFilesInputSchema: {
    query: z.string().min(1).describe('File name pattern (fuzzy match)'),
    type: z.enum(['file', 'directory']).optional().describe('Filter by type'),
    limit: z.number().min(1).max(200).optional().describe('Max results (1-200)'),
  },
  
  FindSymbolsInputSchema: {
    query: z.string().min(1).describe('Symbol name to search for'),
  },
  
  FileStatusInputSchema: {
    path: z.string().optional().describe('Filter by path'),
  },
  
  EmptySchema: {},
};

// ============================================================================
// Tool Definitions (for documentation/tests)
// ============================================================================

export function getFileToolDefinitions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return [
    {
      name: 'opencode_file_read',
      description: 'Read a file from the OpenCode project. Returns the file content as text.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'opencode_file_search',
      description: 'Search for text pattern in project files. Supports regex patterns.',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
          directory: { type: 'string' },
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
          query: { type: 'string' },
          type: { type: 'string', enum: ['file', 'directory'] },
          limit: { type: 'number' },
        },
        required: ['query'],
      },
    },
    {
      name: 'opencode_find_symbols',
      description: 'Find workspace symbols (functions, classes, variables) by name.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'opencode_file_status',
      description: 'Get git status for tracked files.',
      inputSchema: { type: 'object', properties: {} },
    },
  ];
}

// ============================================================================
// Tool Handlers
// ============================================================================

export function createFileHandlers(client: OpenCodeClient) {
  return {
    async opencode_file_read(params: { path: string }) {
      try {
        const result = await client.readFile(params.path);
        return {
          content: [{ type: 'text' as const, text: result.content }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_file_search(params: { pattern: string; directory?: string }) {
      try {
        const results = await client.searchText(params.pattern, params.directory);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error searching files: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_find_files(params: { query: string; type?: 'file' | 'directory'; limit?: number }) {
      try {
        const results = await client.findFiles(params.query, params.type, params.limit);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error finding files: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_find_symbols(params: { query: string }) {
      try {
        const results = await client.findSymbols(params.query);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error finding symbols: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },

    async opencode_file_status(_params: { path?: string }) {
      try {
        // TODO: Implement file status when SDK supports it
        return {
          content: [{ type: 'text' as const, text: 'File status not yet implemented in SDK wrapper' }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error getting file status: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  };
}

export type FileHandlers = ReturnType<typeof createFileHandlers>;
