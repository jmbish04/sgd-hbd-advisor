# Gold Standard Worker Template with MCP Server

A production-ready, modular, and AI-governed Cloudflare Worker template using a modern SPA + API architecture.

**NEW:** Now includes a complete **Model Context Protocol (MCP)** server implementation for AI agent integration with Claude and other AI assistants!

## Stack

- **Build Tool:** Vite with `vite-plugin-cloudflare`
- **Backend:** Hono (modular API with OpenAPI specs)
- **Frontend:** React SPA with client-side routing
- **Database:** D1 with Drizzle ORM + Kysely
- **AI:** Vercel AI SDK with Workers AI / Gemini
- **MCP Server:** Cloudflare Agents SDK with Zod validation
- **UI:** shadcn/ui components with Tailwind CSS
- **Styling:** Tailwind CSS with dark mode support
- **TypeScript:** Strict mode with modern Cloudflare standards
- **Real-time:** WebSocket support via Durable Objects

## Architecture

This is a **hybrid SPA + API application**:

- `/src` - React SPA (frontend)
- `/worker` - Hono API (backend)
- `vite-plugin-cloudflare` - Dev server with HMR and API proxying

## Getting Started

### Prerequisites

- Bun or Node.js 18+
- Wrangler CLI

### Installation

```bash
bun install
# or
npm install
```

### Development

```bash
bun run dev
# or
npm run dev
```

### Build

```bash
bun run build
```

### Deploy

```bash
bun run deploy
```

### Database Commands

```bash
bun run db:gen     # Generate migrations
bun run db:push    # Push schema to D1
bun run typegen    # Generate worker types
```

### Testing Commands

```bash
npm test           # Run all tests
npm run test:ui    # Interactive UI mode
npm run test:headed # Run with browser visible
npm run test:debug # Debug with Playwright Inspector
npm run test:report # View test report
```

## Project Structure

```
/
├── src/                    # Frontend (React SPA)
│   ├── main.tsx            # React entrypoint
│   ├── App.tsx             # Main app with routing
│   ├── pages/              # All pages
│   │   ├── landing.tsx
│   │   ├── dashboard.tsx
│   │   ├── chat.tsx
│   │   ├── health.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── components/ui/      # shadcn/ui components
│   └── lib/utils.ts
├── worker/                 # Backend (Hono API)
│   ├── index.ts            # API entrypoint with MCP routing
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   └── client.ts       # Hybrid ORM client
│   ├── modules/            # Modular API routes
│   │   ├── chat/
│   │   ├── health/
│   │   ├── dummyjson/
│   │   ├── mcp/            # MCP server implementation
│   │   │   ├── agent.ts    # MCP agent with tools
│   │   │   ├── middleware.ts # Authentication
│   │   │   └── index.ts
│   │   └── ai/
│   ├── do/                 # Durable Objects
│   │   └── websocket.ts
│   └── utils/
│       └── openapi.ts
├── tests/                  # Playwright E2E tests
│   ├── AGENTS.md            # Testing agent guidelines
│   ├── README.md            # Testing documentation
│   ├── fixtures.ts          # Custom test fixtures
│   ├── utils/               # Test utilities
│   └── *.spec.ts            # Test suites
├── docs/                   # Documentation
│   └── testing-instructions.md
├── index.html              # SPA entrypoint
├── playwright.config.ts    # Playwright configuration
├── vite.config.ts          # Vite configuration
├── wrangler.jsonc          # Worker configuration
├── drizzle.config.ts       # Drizzle configuration
├── AGENTS.md               # AI governance rules
└── README.md
```

## Features

- ✅ **Modular API**: Hono backend with OpenAPI specs
- ✅ **MCP Server**: Full Model Context Protocol server with example tools
- ✅ **AI Integration**: Connect Claude and other AI agents to your Worker
- ✅ **Dual Transport**: Support for both SSE and Streamable HTTP
- ✅ **Generative Chat**: AI-powered chat UI using AI SDK
- ✅ **Full-Stack Dev**: Blazing fast HMR with Vite
- ✅ **Authentic Shadcn**: All core components pre-installed
- ✅ **Hybrid ORM**: Drizzle + Kysely for type-safe queries
- ✅ **Agent Governed**: AGENTS.md rulebook for AI development
- ✅ **Health Dashboard**: Real-time monitoring with AI diagnostics
- ✅ **WebSocket Support**: Real-time communication via Durable Objects
- ✅ **OAuth Ready**: Built-in auth scaffolding for secure MCP access
- ✅ **E2E Testing**: Comprehensive Playwright test suite with auto-managed dev servers

## Configuration

Before deploying, update `wrangler.jsonc` with your:
- D1 Database ID
- Gemini API Key (or OpenAI API Key)

## MCP Server

This Worker includes a complete **Model Context Protocol (MCP)** server implementation that allows AI agents like Claude to interact with your Worker's capabilities.

### Quick Start

**MCP Endpoints:**
- `/mcp` - Streamable HTTP transport (recommended)
- `/sse` - Server-Sent Events transport (legacy)

**Available Tools:**
- `echo` - Test connectivity
- `calculate` - Basic arithmetic
- `healthCheck` - Worker status
- `generateText` - AI text generation via Workers AI
- `queryDatabase` - Read-only D1 database queries

**Testing with MCP Inspector:**

```bash
npx @modelcontextprotocol/inspector
# Connect to: http://localhost:5173/mcp
```

**Full Documentation:** See [MCP_SERVER.md](./MCP_SERVER.md) for comprehensive setup, authentication, and tool development guides.

## Testing

This template includes a comprehensive Playwright testing suite with automatic dev server management.

### Running Tests

```bash
npm test              # Run all tests
npm run test:ui       # Interactive UI mode (recommended)
npm run test:headed   # Run with browser visible
npm run test:debug    # Debug with Playwright Inspector
npm run test:report   # View HTML report
```

### Test Documentation

- **[tests/README.md](./tests/README.md)** - Setup, running tests, debugging
- **[tests/AGENTS.md](./tests/AGENTS.md)** - Agent guidelines for maintaining tests
- **[docs/testing-instructions.md](./docs/testing-instructions.md)** - Quick reference

### Test Coverage

The test suite includes:
- Basic functionality and page loading
- Navigation across all routes
- Health dashboard and monitoring
- API endpoint testing
- User interactions and form submissions

**Note:** When adding new pages, you must add corresponding tests. See [tests/AGENTS.md](./tests/AGENTS.md) for guidelines.

## Development Guidelines

See [AGENTS.md](./AGENTS.md) for AI agent governance rules and development patterns.
