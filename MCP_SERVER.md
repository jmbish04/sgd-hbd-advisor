# MCP Server Documentation

This Cloudflare Worker implements a **Model Context Protocol (MCP)** server, making it compatible with Claude and other AI agents.

## Table of Contents

- [What is MCP?](#what-is-mcp)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Endpoints](#endpoints)
- [Available Tools](#available-tools)
- [Adding Custom Tools](#adding-custom-tools)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## What is MCP?

The **Model Context Protocol (MCP)** is an open protocol that standardizes how applications provide context to AI models. It allows AI assistants like Claude to:

- Access data and tools from your services
- Execute operations on your behalf
- Integrate seamlessly with your infrastructure

**Learn More:**
- [MCP Specification](https://modelcontextprotocol.io/)
- [Cloudflare MCP Documentation](https://developers.cloudflare.com/agents/model-context-protocol/)

## Architecture

This MCP server is built using:

- **Cloudflare Workers**: Edge computing platform for fast, global execution
- **Agents SDK (`agents` package)**: Official Cloudflare SDK for building MCP servers
- **Durable Objects**: Stateful MCP sessions with persistent storage
- **Zod**: Runtime schema validation and type inference
- **TypeScript**: Full type safety throughout

### Project Structure

```
worker/
└── modules/
    └── mcp/
        ├── agent.ts       # MCP agent with tool definitions
        ├── middleware.ts  # Authentication middleware
        └── index.ts       # Module exports
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Wrangler CLI (`npm install -g wrangler`)
- A Cloudflare account (free tier works!)

### Installation

1. **Install dependencies:**

```bash
npm install
# or
bun install
```

2. **Configure environment:**

Update `wrangler.toml` with your settings:
- D1 Database ID (create with `wrangler d1 create <name>`)
- Gemini API Key (optional, for AI features)
- MCP authentication settings (optional)

3. **Run locally:**

```bash
npm run dev
# or
bun run dev
```

The MCP server will be available at:
- `http://localhost:5173/mcp` (Streamable HTTP transport)
- `http://localhost:5173/sse` (SSE transport, legacy)

## Endpoints

### `/mcp` - Streamable HTTP Transport (Recommended)

The modern MCP transport protocol. Supports both immediate responses and streaming.

**Features:**
- ✅ Single endpoint for requests and responses
- ✅ Automatic protocol negotiation
- ✅ Efficient streaming for long-running operations
- ✅ Better error handling

**Example Request:**

```bash
curl -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### `/sse` - Server-Sent Events Transport (Legacy)

The original MCP transport protocol using SSE.

**Features:**
- ✅ Backward compatible with older MCP clients
- ✅ Real-time event streaming
- ✅ Simple to debug with browser tools

**Example Request:**

```bash
curl -N http://localhost:5173/sse
```

## Available Tools

The MCP server includes these example tools:

### 1. **echo**
Echoes back a message. Useful for testing connectivity.

```typescript
{
  message: string // The message to echo
}
```

### 2. **calculate**
Performs basic arithmetic operations.

```typescript
{
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  a: number,
  b: number
}
```

### 3. **healthCheck**
Returns the health status of the Worker and its bindings.

```typescript
{} // No parameters
```

### 4. **generateText**
Generates text using Cloudflare Workers AI.

```typescript
{
  prompt: string,
  maxTokens?: number // Default: 256
}
```

### 5. **queryDatabase**
Executes read-only SQL queries on the D1 database.

```typescript
{
  query: string // SELECT queries only
}
```

## Adding Custom Tools

To add a new tool, edit `worker/modules/mcp/agent.ts`:

```typescript
/**
 * TOOL: Your Tool Name
 * Description of what your tool does
 */
private registerYourTool() {
  this.server.tool(
    'yourToolName',
    'Description that AI agents will see',
    {
      // Define parameters with Zod schemas
      param1: z.string().describe('First parameter description'),
      param2: z.number().optional().describe('Optional parameter'),
    },
    async ({ param1, param2 }) => {
      // Your tool implementation here

      // Access Cloudflare bindings:
      // - this.env.AI (Workers AI)
      // - this.env.DB (D1 Database)
      // - this.env.GEMINI_API_KEY (Environment variables)

      return {
        content: [
          {
            type: 'text',
            text: 'Your response here',
          },
        ],
        // Optional: Set isError: true for error responses
      }
    }
  )
}
```

**Then register it in the `init()` method:**

```typescript
async init() {
  this.registerEchoTool()
  this.registerCalculatorTool()
  this.registerHealthCheckTool()
  this.registerAiTool()
  this.registerDatabaseTool()
  this.registerYourTool() // Add this line
}
```

### Tool Best Practices

1. **Use descriptive names**: Tool names should be clear and action-oriented
2. **Document parameters**: Use `.describe()` on Zod schemas for AI context
3. **Handle errors gracefully**: Return `isError: true` for error cases
4. **Keep tools focused**: Each tool should do one thing well
5. **Validate inputs**: Leverage Zod for automatic validation
6. **Test thoroughly**: Use the MCP Inspector (see Testing section)

## Authentication

The MCP server supports multiple authentication methods:

### 1. API Key Authentication (Simple)

Set environment variables in `wrangler.toml`:

```toml
[vars]
MCP_AUTH_ENABLED = "true"
MCP_API_KEYS = "your-secret-key-1,your-secret-key-2"
```

**Usage:**

```bash
curl -X POST http://localhost:5173/mcp \
  -H "Authorization: Bearer your-secret-key-1" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### 2. Cloudflare Access (Recommended for Production)

Cloudflare Access provides zero-trust authentication with OAuth providers.

**Setup:**

1. Create an Access application in the Cloudflare dashboard
2. Configure your identity provider (Google, GitHub, etc.)
3. Add the application settings to `wrangler.toml`:

```toml
[vars]
MCP_AUTH_ENABLED = "true"
CLOUDFLARE_ACCESS_TEAM_DOMAIN = "your-team.cloudflareaccess.com"
CLOUDFLARE_ACCESS_AUDIENCE = "your-audience-tag-here"
```

Cloudflare Access will automatically add JWT tokens to requests, which the Worker verifies.

**Learn More:**
- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/)
- [MCP Authorization Guide](https://developers.cloudflare.com/agents/model-context-protocol/authorization/)

### 3. OAuth 2.1 (Custom)

For custom OAuth implementations, configure the token verification endpoint:

```typescript
// In worker/modules/mcp/middleware.ts
oauth: {
  tokenVerificationEndpoint: 'https://your-auth-server.com/oauth/introspect',
  requiredScopes: ['mcp:read', 'mcp:write'],
  allowedClientIds: ['client-id-1', 'client-id-2'],
}
```

### Development Mode (No Auth)

For local development, authentication is **disabled by default**. To enable it:

```toml
[vars]
MCP_AUTH_ENABLED = "true"
```

## Testing

### Using the MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the official tool for testing MCP servers:

```bash
# Install the inspector
npx @modelcontextprotocol/inspector

# Connect to your local MCP server
# Choose "HTTP" transport and enter: http://localhost:5173/mcp
```

The inspector provides:
- 🔍 Tool discovery and testing
- 📋 Request/response inspection
- 🐛 Error debugging
- 📝 JSON-RPC message validation

### Using Claude Desktop

To connect your MCP server to Claude Desktop:

1. Open Claude Desktop settings
2. Navigate to Developer → MCP Servers
3. Add a new server:
   ```json
   {
     "your-worker-mcp": {
       "url": "http://localhost:5173/mcp",
       "transport": "http"
     }
   }
   ```
4. Restart Claude Desktop
5. Your tools will appear in Claude's tool list

### Manual Testing with curl

**List available tools:**

```bash
curl -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

**Call a tool:**

```bash
curl -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "Hello, MCP!"
      }
    },
    "id": 2
  }'
```

## Deployment

### Deploy to Cloudflare

1. **Build the project:**

```bash
npm run build
```

2. **Deploy to Cloudflare:**

```bash
npm run deploy
# or
wrangler deploy
```

Your MCP server will be deployed to:
- `https://your-worker.workers.dev/mcp`
- `https://your-worker.workers.dev/sse`

### Custom Domain (Optional)

1. Add a custom domain in the Cloudflare dashboard
2. Update your MCP client configuration with the new URL

### Production Checklist

- [ ] Enable authentication (`MCP_AUTH_ENABLED = "true"`)
- [ ] Set up Cloudflare Access or OAuth
- [ ] Configure rate limiting (via Cloudflare dashboard)
- [ ] Set up monitoring and alerts
- [ ] Review and restrict tool permissions
- [ ] Test all tools in production environment
- [ ] Document your tools for users
- [ ] Configure CORS if needed (for web clients)

## Troubleshooting

### Common Issues

**Issue: "agents package not found"**

```bash
# Install the agents package
npm install agents
# or
bun add agents
```

**Issue: "MCP agent class not found"**

Make sure you've exported the agent as a Durable Object in `worker/index.ts`:

```typescript
export { mcpAgent as CloudflareMcpAgent }
```

**Issue: "Tools not appearing in Claude"**

1. Verify your MCP server is running: `curl http://localhost:5173/mcp`
2. Check that tools are registered in `agent.ts` → `init()` method
3. Restart Claude Desktop after configuration changes
4. Check Claude Desktop logs for connection errors

**Issue: "Authentication errors"**

1. Verify `MCP_AUTH_ENABLED` is set correctly
2. Check that API keys are properly configured
3. Ensure Authorization header is formatted correctly: `Bearer <key>`
4. Review Cloudflare Access configuration if using Access

**Issue: "D1 database errors"**

1. Create a D1 database: `wrangler d1 create <name>`
2. Update `database_id` in `wrangler.toml`
3. Run migrations: `npm run db:push`

### Debug Mode

Enable verbose logging by setting:

```typescript
// In worker/index.ts
console.log('MCP Request:', request)
console.log('MCP Response:', response)
```

### Getting Help

- [Cloudflare Discord](https://discord.gg/cloudflaredev) - Active community support
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [GitHub Issues](https://github.com/cloudflare/agents/issues) - Report SDK bugs

## Performance Optimization

### Cold Start Optimization

- Keep dependencies minimal
- Use ESM imports exclusively
- Lazy-load heavy libraries
- Bundle size target: < 1MB

### Caching Strategies

```typescript
// Cache expensive operations
const cache = caches.default
const cacheKey = new Request(url, request)
const cached = await cache.match(cacheKey)
if (cached) return cached
```

### Rate Limiting

Implement rate limiting to protect your MCP server:

```typescript
// Use Cloudflare Rate Limiting API
// https://developers.cloudflare.com/workers/runtime-apis/request/#rate-limiting
```

## Advanced Features

### Stateful Tools with Durable Objects

The MCP agent runs as a Durable Object, providing:

- **Persistent state** across tool calls
- **SQL database** for each agent instance
- **Hibernation** for cost efficiency

```typescript
// Access Durable Object state
async init() {
  const value = await this.ctx.storage.get('key')
  await this.ctx.storage.put('key', 'value')
}
```

### Streaming Responses

For long-running operations, use streaming:

```typescript
return {
  content: [
    {
      type: 'text',
      text: 'Processing...',
    },
  ],
  // The streamable HTTP transport will keep the connection open
}
```

### Resources (Coming Soon)

MCP supports "resources" - data that AI agents can read:

```typescript
this.server.resource('user-profile', async () => ({
  type: 'text',
  text: JSON.stringify(userProfile),
}))
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new tools
4. Submit a pull request

---

**Built with ❤️ using Cloudflare Workers and the Model Context Protocol**
