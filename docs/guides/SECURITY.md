# Security Considerations

This document outlines security considerations for the OpenCode MCP Server.

## Threat Model

### Assets
1. **OpenCode Server Access** - The MCP server proxies requests to OpenCode
2. **File System Access** - Tools can read files from the project
3. **Code Execution** - OpenCode can execute commands and modify code
4. **API Keys** - Provider credentials stored in OpenCode

### Attack Vectors

| Vector | Risk Level | Mitigation |
|--------|------------|------------|
| Unauthorized MCP access | Medium | stdio is local-only; HTTP requires CORS/network config |
| Injection attacks | Low | Zod validates all inputs |
| Credential exposure | Low | No credentials stored in MCP server |
| DoS via large requests | Medium | Timeout handling, no explicit rate limiting |
| Session hijacking (HTTP) | Medium | Session IDs should be cryptographically random |

## Transport Security

### stdio Transport (Default)
- **Risk**: Low - only accessible locally
- **Attack Surface**: Minimal - requires local access
- **Use Case**: IDE integration (recommended)

### HTTP Transport
- **Risk**: Medium - network accessible
- **Considerations**:
  - No built-in authentication
  - CORS configurable but defaults to `*`
  - No TLS/SSL - use reverse proxy for production
  - Session IDs managed in-memory (restart loses sessions)

**Recommendations for HTTP**:
```bash
# 1. Restrict CORS
MCP_CORS_ORIGINS=https://your-domain.com

# 2. Use reverse proxy with TLS
# nginx example:
# server {
#   listen 443 ssl;
#   location /mcp {
#     proxy_pass http://localhost:3000;
#   }
# }

# 3. Add authentication at proxy level
# Basic auth, JWT, etc.
```

## Authentication & Authorization

### Current State
- **No MCP-level auth**: Server trusts the transport layer
- **Delegated to OpenCode**: API key validation happens at OpenCode server
- **No credential storage**: Keys managed by OpenCode, not MCP server

### Recommendations
1. **For stdio**: Rely on OS-level security (local access required)
2. **For HTTP**: Add authentication proxy layer
3. **For production**: Use mTLS or API gateway

## Input Validation

### Current Protections
- All tool inputs validated with Zod schemas
- Type coercion prevented (strict parsing)
- Required fields enforced

### Potential Enhancements
```typescript
// Add input sanitization for file paths
const SafePathSchema = z.string()
  .max(4096)
  .refine(path => !path.includes('..'), 'Path traversal not allowed')
  .refine(path => !path.startsWith('/'), 'Relative paths only');

// Add rate limiting schema
const RateLimitSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});
```

## Data Protection

### Logging
- Logs written to stderr (not stdout)
- No credentials logged
- Configurable log levels

**Best Practice**: Set `OPENCODE_LOG_LEVEL=error` in production

### Error Messages
- Errors include actionable suggestions
- No stack traces exposed to clients
- No internal paths leaked

## Session Management

### stdio Mode
- No sessions - single connection
- Process isolation per client

### HTTP Mode
- Stateless by default (no session persistence)
- Stateful sessions via `/mcp/:sessionId`
- Session store is in-memory (cleared on restart)

**Recommendations**:
```typescript
// Generate cryptographically secure session IDs
import { randomUUID } from 'crypto';
const sessionId = randomUUID();

// Add session timeout
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
```

## Dependency Security

### Current Measures
- `npm audit` runs in CI
- Dependencies pinned with `^` (minor updates allowed)
- Override for minimatch vulnerability

### Recommendations
```bash
# 1. Use lockfile
npm ci  # instead of npm install

# 2. Regular audits
npm audit --audit-level=moderate

# 3. Consider dependabot
# .github/dependabot.yml
```

## Network Security

### HTTP Transport Hardening

```typescript
// Add security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add request size limits
app.use(express.json({ limit: '1mb' }));

// Add request timeout
app.use((req, res, next) => {
  req.setTimeout(30000);
  next();
});
```

## Security Checklist

### For Development
- [ ] Use stdio transport (safest)
- [ ] Keep OpenCode server on localhost
- [ ] Don't commit API keys
- [ ] Review tool permissions

### For Production/HTTP
- [ ] Enable TLS via reverse proxy
- [ ] Restrict CORS origins
- [ ] Add authentication layer
- [ ] Set log level to error/warn
- [ ] Use rate limiting
- [ ] Monitor for anomalies
- [ ] Regular security audits

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email security concerns to the maintainers
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (IDE/AI)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
   ┌────▼────┐                       ┌──────▼──────┐
   │  stdio  │                       │    HTTP     │
   │ (local) │                       │ (network)   │
   └────┬────┘                       └──────┬──────┘
        │                                   │
        │                            ┌──────▼──────┐
        │                            │ CORS Check  │
        │                            └──────┬──────┘
        │                                   │
        │                            ┌──────▼──────┐
        │                            │  Auth Proxy │ ← Optional
        │                            │ (recommended)│
        │                            └──────┬──────┘
        │                                   │
   ┌────▼───────────────────────────────────▼────┐
   │              MCP Server                      │
   │  ┌─────────────────────────────────────┐    │
   │  │  Input Validation (Zod)             │    │
   │  └─────────────────────────────────────┘    │
   │  ┌─────────────────────────────────────┐    │
   │  │  Tool Execution                     │    │
   │  └─────────────────────────────────────┘    │
   └───────────────────────┬──────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  OpenCode   │
                    │   Server    │
                    │ (auth here) │
                    └─────────────┘
```

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
