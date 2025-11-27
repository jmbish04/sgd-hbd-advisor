# MCP Server Quick Start Guide

Get your MCP server running in 5 minutes!

## Prerequisites

- Node.js 18+ or Bun installed
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
npm install
# or
bun install
```

## Step 2: Set Up Environment (Optional)

For local development, authentication is disabled by default. If you want to test with auth:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set MCP_AUTH_ENABLED=true
```

## Step 3: Start the Development Server

```bash
npm run dev
# or
bun run dev
```

Your MCP server is now running at:
- **Streamable HTTP**: `http://localhost:5173/mcp`
- **SSE**: `http://localhost:5173/sse`

## Step 4: Test with MCP Inspector

Open a new terminal and run:

```bash
npx @modelcontextprotocol/inspector
```

In the inspector:
1. Select **"HTTP"** as the transport
2. Enter URL: `http://localhost:5173/mcp`
3. Click **"Connect"**

You should see 5 tools available:
- echo
- calculate
- healthCheck
- generateText
- queryDatabase

## Step 5: Try a Tool

In the inspector, select the `echo` tool and provide a message:

```json
{
  "message": "Hello, MCP!"
}
```

Click "Execute" and you should see:

```
Echo: Hello, MCP!
```

## Step 6: Connect to Claude Desktop (Optional)

1. Open Claude Desktop
2. Go to Settings → Developer → MCP Servers
3. Add this configuration:

```json
{
  "cloudflare-worker-mcp": {
    "url": "http://localhost:5173/mcp",
    "transport": "http"
  }
}
```

4. Restart Claude Desktop
5. Try asking Claude: "Can you use the echo tool to say hello?"

## Next Steps

- **Add Custom Tools**: Edit `worker/modules/mcp/agent.ts`
- **Enable Authentication**: See `MCP_SERVER.md` → Authentication
- **Deploy to Production**: Run `npm run deploy`
- **Read Full Docs**: Check out `MCP_SERVER.md`

## Troubleshooting

**Issue: "agents package not found"**

The `agents` package might not be installed due to peer dependency conflicts. Install it manually:

```bash
npm install agents --legacy-peer-deps
# or
bun add agents
```

**Issue: "Port 5173 already in use"**

Another process is using port 5173. Either:
- Stop the other process
- Change the port in `vite.config.ts` → `server.port`

**Issue: "MCP endpoint not found"**

Make sure you're using the correct URL:
- ✅ `http://localhost:5173/mcp` (correct)
- ❌ `http://localhost:8787/mcp` (wrong port)

**Still having issues?**

Check the full documentation in `MCP_SERVER.md` or join the [Cloudflare Discord](https://discord.gg/cloudflaredev).

## Success! 🎉

You now have a working MCP server running on Cloudflare Workers. Your AI agents can now interact with your Worker's capabilities through the Model Context Protocol.

Happy building!
