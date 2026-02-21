/**
 * Integration Tests - Tool Handlers
 * 
 * Tests for tool handler behavior including error handling.
 * Uses mock client responses for testing error scenarios.
 */

import { describe, test, expect } from 'vitest';

// Import the error helpers
import { createErrorResponse, ERROR_SUGGESTIONS, TOOL_ANNOTATIONS, ANNOTATIONS } from '../../src/server/tools/schemas.js';

describe('Tool Schemas', () => {
  describe('createErrorResponse', () => {
    test('creates error response with message and suggestions', () => {
      const error = new Error('Connection refused');
      const response = createErrorResponse('Connecting to server', error, ERROR_SUGGESTIONS.connectionFailed);
      
      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('Connecting to server failed');
      expect(response.content[0].text).toContain('Connection refused');
      expect(response.content[0].text).toContain('Suggestions:');
    });

    test('handles non-Error objects', () => {
      const response = createErrorResponse('Test operation', 'string error', ['Try again']);
      
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('string error');
    });

    test('works without suggestions', () => {
      const error = new Error('Unknown error');
      const response = createErrorResponse('Test', error);
      
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Unknown error');
    });
  });

  describe('ERROR_SUGGESTIONS', () => {
    test('has all expected error types', () => {
      expect(ERROR_SUGGESTIONS.connectionFailed).toBeDefined();
      expect(ERROR_SUGGESTIONS.sessionNotFound).toBeDefined();
      expect(ERROR_SUGGESTIONS.invalidInput).toBeDefined();
      expect(ERROR_SUGGESTIONS.timeout).toBeDefined();
      expect(ERROR_SUGGESTIONS.unauthorized).toBeDefined();
      expect(ERROR_SUGGESTIONS.fileNotFound).toBeDefined();
      expect(ERROR_SUGGESTIONS.skillNotFound).toBeDefined();
      expect(ERROR_SUGGESTIONS.agentNotFound).toBeDefined();
      expect(ERROR_SUGGESTIONS.mcpError).toBeDefined();
    });

    test('suggestions are arrays of strings', () => {
      for (const key of Object.keys(ERROR_SUGGESTIONS)) {
        const suggestions = ERROR_SUGGESTIONS[key as keyof typeof ERROR_SUGGESTIONS];
        expect(Array.isArray(suggestions)).toBe(true);
        for (const s of suggestions) {
          expect(typeof s).toBe('string');
        }
      }
    });
  });

  describe('TOOL_ANNOTATIONS', () => {
    test('has annotations for all 29 tools', () => {
      const toolNames = Object.keys(TOOL_ANNOTATIONS);
      expect(toolNames.length).toBe(29);
    });

    test('all annotations have required properties', () => {
      for (const [, annotations] of Object.entries(TOOL_ANNOTATIONS)) {
        expect(annotations).toHaveProperty('readOnlyHint');
        expect(annotations).toHaveProperty('destructiveHint');
        expect(annotations).toHaveProperty('idempotentHint');
        expect(annotations).toHaveProperty('openWorldHint');
        expect(typeof (annotations as { readOnlyHint: boolean }).readOnlyHint).toBe('boolean');
        expect(typeof (annotations as { destructiveHint: boolean }).destructiveHint).toBe('boolean');
        expect(typeof (annotations as { idempotentHint: boolean }).idempotentHint).toBe('boolean');
        expect(typeof (annotations as { openWorldHint: boolean }).openWorldHint).toBe('boolean');
      }
    });
  });

  describe('ANNOTATIONS presets', () => {
    test('readOnly preset has correct values', () => {
      expect(ANNOTATIONS.readOnly.readOnlyHint).toBe(true);
      expect(ANNOTATIONS.readOnly.destructiveHint).toBe(false);
      expect(ANNOTATIONS.readOnly.idempotentHint).toBe(true);
      expect(ANNOTATIONS.readOnly.openWorldHint).toBe(false);
    });

    test('writeExternal preset has correct values', () => {
      expect(ANNOTATIONS.writeExternal.readOnlyHint).toBe(false);
      expect(ANNOTATIONS.writeExternal.destructiveHint).toBe(true);
      expect(ANNOTATIONS.writeExternal.openWorldHint).toBe(true);
    });
  });
});

describe('Tool Handler Error Scenarios', () => {
  test('error messages are actionable', () => {
    const connectionError = createErrorResponse('Test', new Error('fail'), ERROR_SUGGESTIONS.connectionFailed);
    
    // Check that connection error suggests starting the server
    expect(connectionError.content[0].text.toLowerCase()).toContain('opencode serve');
    
    const sessionError = createErrorResponse('Test', new Error('fail'), ERROR_SUGGESTIONS.sessionNotFound);
    
    // Check that session error suggests listing sessions
    expect(sessionError.content[0].text.toLowerCase()).toContain('opencode_session_list');
  });
});
