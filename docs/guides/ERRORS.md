# Error Handling Guide

OpenCode MCP Server provides actionable error messages to help resolve issues quickly.

## Error Format

All errors follow a consistent format:

```
Error: <operation> failed.

Details: <technical error message>

Suggestions:
  1. <actionable suggestion>
  2. <another suggestion>
```

This format is designed to be:
1. **Machine-readable**: `isError: true` flag for programmatic handling
2. **Human-readable**: Clear descriptions and numbered steps
3. **LLM-friendly**: Suggestions help AI assistants self-correct

## Error Response Structure

```json
{
  "content": [{
    "type": "text",
    "text": "Error: Connecting to server failed.\n\nDetails: Connection refused\n\nSuggestions:\n  1. Ensure OpenCode server is running: opencode serve\n  2. Check OPENCODE_SERVER_URL environment variable\n  3. Verify the server is accessible at the configured URL"
  }],
  "isError": true
}
```

## Error Categories

### Connection Errors

**Trigger**: Cannot reach OpenCode server

**Example**:
```
Error: Connecting to server failed.

Details: Connection refused to http://localhost:4096

Suggestions:
  1. Ensure OpenCode server is running: opencode serve
  2. Check OPENCODE_SERVER_URL environment variable
  3. Verify the server is accessible at the configured URL
  4. Try restarting OpenCode: opencode restart
```

**Resolution**:
1. Start the OpenCode server: `opencode serve`
2. Verify the URL in your configuration
3. Check firewall/network settings

---

### Session Errors

**Trigger**: Invalid or expired session ID

**Example**:
```
Error: Sending prompt to session failed.

Details: Session not found: abc123

Suggestions:
  1. Use opencode_session_list to see available sessions
  2. Create a new session with opencode_session_create
  3. Check if the session ID is correct
```

**Resolution**:
1. List existing sessions to verify ID
2. Create a new session if needed
3. Copy session ID carefully

---

### File Errors

**Trigger**: File not found or inaccessible

**Example**:
```
Error: Reading file "src/missing.ts" failed.

Details: File does not exist

Suggestions:
  1. Verify the file path is correct
  2. Use opencode_find_files to search for the file
  3. Check if the file exists in the project
```

**Resolution**:
1. Verify the path is relative to project root
2. Use `opencode_find_files` to locate the file
3. Check file permissions

---

### Skill Errors

**Trigger**: Skill not found

**Example**:
```
Error: Loading skill "my-skill" failed.

Details: Skill not found in any known location

Suggestions:
  1. Use opencode_skill_list to see available skills
  2. Check the skill name spelling
  3. Skills are stored in .opencode/skills/ or .claude/skills/
```

**Resolution**:
1. List available skills
2. Check spelling (lowercase with hyphens)
3. Verify skill exists in the expected directory

---

### Agent Errors

**Trigger**: Agent not found

**Example**:
```
Error: Delegating to agent "builder" failed.

Details: Agent not found

Suggestions:
  1. Use opencode_agent_list to see available agents
  2. Check the agent name spelling
  3. Common agents: build, plan, explore
```

**Resolution**:
1. List available agents
2. Check spelling
3. Use standard agent names: `build`, `plan`, `explore`

---

### Timeout Errors

**Trigger**: Operation took too long

**Example**:
```
Error: Executing OpenCode task failed.

Details: Request timed out after 120000ms

Suggestions:
  1. The operation took too long to complete
  2. Try breaking the task into smaller parts
  3. Increase timeout with OPENCODE_TIMEOUT environment variable
```

**Resolution**:
1. Split large tasks into smaller ones
2. Increase timeout: `OPENCODE_TIMEOUT=300000 npx @opencode-mcp/server`
3. Check for network/server issues

---

### Input Validation Errors

**Trigger**: Invalid parameters

**Example**:
```
Error: Creating skill failed.

Details: Skill name must be lowercase alphanumeric with hyphens

Suggestions:
  1. Check the input parameter types and formats
  2. Ensure required fields are provided
  3. Refer to the tool schema for valid inputs
```

**Resolution**:
1. Check parameter types
2. Ensure required fields are present
3. Refer to API documentation

---

### MCP Errors

**Trigger**: MCP server configuration issues

**Example**:
```
Error: Adding MCP server "myserver" failed.

Details: Command is required for local MCP servers

Suggestions:
  1. Provide the command parameter with the command to run the MCP server
  2. Example: command=["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path"]
```

**Resolution**:
1. Check MCP server configuration
2. Verify command or URL is correct
3. Check server logs for errors

## Handling Errors in Your Client

### Programmatic Handling

```typescript
const result = await client.callTool('opencode_run', { prompt: '...' });

if (result.isError) {
  // Parse the error text
  const errorText = result.content[0].text;
  
  // Extract suggestions
  const suggestions = errorText
    .split('Suggestions:\n')[1]
    ?.split('\n')
    .filter(line => line.match(/^\s*\d+\./))
    .map(line => line.replace(/^\s*\d+\.\s*/, ''));
  
  // Log or display to user
  console.error('Operation failed. Try these steps:');
  suggestions?.forEach(s => console.log(`- ${s}`));
}
```

### For LLMs

The error format is designed to help LLMs self-correct:

1. **Clear problem statement**: "Error: <operation> failed"
2. **Technical details**: "Details: <message>" for debugging
3. **Actionable steps**: Numbered suggestions to try

LLMs can:
- Parse the error to understand what went wrong
- Follow suggestions to resolve the issue
- Retry with corrected parameters

## Best Practices

### For Developers

1. **Always check `isError`** before processing content
2. **Log error details** for debugging
3. **Display suggestions** to users when appropriate
4. **Implement retry logic** for transient errors

### For Users

1. **Read suggestions carefully** - they're specific to your error
2. **Try suggestions in order** - they're prioritized
3. **Check server status** first for connection errors
4. **Validate inputs** against tool schemas

## Error Prevention

### Connection Errors
- Ensure OpenCode server is running before starting MCP server
- Use correct server URL in configuration
- Monitor server health with `/health` endpoint (HTTP mode)

### Session Errors
- Store session IDs from `opencode_session_create` responses
- Handle session expiration gracefully
- Create new sessions when needed

### Input Errors
- Validate inputs against tool schemas
- Use proper types (string, number, boolean, array)
- Check required fields before calling tools
