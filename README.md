# HDB Autonomous Agent - Cloudflare Worker Monorepo

A fully functional Cloudflare Worker monorepo featuring Agents SDK, Workflows, React frontend, and Google Gemini AI integration.

## Architecture

### Backend
- **Cloudflare Worker** with Hono framework
- **Agents SDK** with Durable Objects and SQLite storage
- **AdvisorAgent**: WebSocket-based chat with state management
- **MarketScanWorkflow**: Automated market data processing

### AI Integration
- **Google Gemini AI** with dynamic model selection
- **Cloudflare AI Gateway** for routing and caching
- Support for multiple models: `gemini-2.0-flash-exp`, `gemini-1.5-flash`, `gemini-1.5-pro`

### Database
- **D1 Database** for market snapshots
- **Drizzle ORM** for type-safe schema management
- Market data schema: town, flat_type, price, yield, created_at

### Frontend
- **React** with Vite for fast development
- **Tailwind CSS** for styling
- **AgentClient** for real-time WebSocket communication
- Admin panel for dynamic model configuration

## Project Structure

```
sgd-hbd-advisor/
├── src/
│   ├── agent.ts              # AdvisorAgent (Durable Object)
│   ├── workflow.ts           # MarketScanWorkflow
│   ├── index.ts              # Worker entrypoint
│   ├── types.ts              # Environment types
│   ├── db/
│   │   └── schema.ts         # Drizzle schema
│   └── lib/
│       └── gemini.ts         # Gemini AI client
├── client/
│   ├── src/
│   │   ├── App.tsx           # Main React app
│   │   ├── main.tsx          # React entry
│   │   ├── index.css         # Tailwind styles
│   │   └── lib/
│   │       └── utils.ts      # Utility functions
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── wrangler.toml             # Cloudflare configuration
├── drizzle.config.ts         # Drizzle configuration
├── package.json              # Root package.json
└── tsconfig.json             # TypeScript config
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or bun
- Cloudflare account with Workers enabled
- Google AI API key

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install
cd ..
```

### 2. Create D1 Database

```bash
npx wrangler d1 create hdb-stats-db
```

Update `wrangler.toml` with the returned `database_id`.

### 3. Create KV Namespace

```bash
npx wrangler kv namespace create CONFIG_KV
```

Update `wrangler.toml` with the returned `id`.

### 4. Set Secrets

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put GOOGLE_AI_API_KEY
```

### 5. Generate and Apply Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 6. Run Locally

```bash
npm run dev
```

This will start:
- Worker on `http://localhost:8787`
- React dev server on `http://localhost:5173`

### 7. Deploy to Cloudflare

```bash
npm run deploy
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Admin Configuration
```
GET /api/admin/config
POST /api/admin/config
Body: { "model_smart": "gemini-2.0-flash-exp" }
```

### Workflow Management
```
POST /api/workflow/trigger
GET /api/workflow/:id
```

### Agent WebSocket
```
WebSocket: /agents/advisor-agent/session-name
```

## WebSocket Message Format

### Client → Agent (Chat)
```json
{
  "type": "CHAT",
  "content": "Your message here"
}
```

### Agent → Client (Response)
```json
{
  "type": "RESPONSE",
  "content": "AI response"
}
```

### Agent → Client (Error)
```json
{
  "type": "ERROR",
  "error": "Error message"
}
```

## Key Features

### 1. SQLite-Backed Agents
The AdvisorAgent uses SQLite storage for state persistence:
- Automatic state sync across WebSocket connections
- Conversation history stored in Durable Object
- Dynamic model selection via KV

### 2. AI Gateway Integration
All Gemini API calls are routed through Cloudflare AI Gateway:
- Caching for improved performance
- Analytics and monitoring
- Rate limiting and cost control

### 3. Workflows
MarketScanWorkflow demonstrates long-running processes:
- Multi-step execution with automatic retries
- State persistence across steps
- Sleep/delay capabilities

### 4. Modern Static Assets
Uses Workers Static Assets configuration:
- SPA routing with `not_found_handling`
- Selective Worker routing with `run_worker_first`
- Automatic asset serving

## Configuration Notes

### Critical Wrangler Settings

```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["AdvisorAgent"]  # MUST use new_sqlite_classes, not new_classes
```

The `new_sqlite_classes` migration is required for Agents SDK SQLite storage. This cannot be added after initial deployment.

### AI Gateway URL Format
```
https://gateway.ai.cloudflare.com/v1/{account_id}/hdb-gateway/google-ai-studio/v1beta
```

## Development Scripts

```bash
npm run dev           # Run worker + client concurrently
npm run deploy        # Build client and deploy worker
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Apply migrations to D1
npm run client:install # Install client dependencies
npm run setup         # Install all dependencies
```

## Next Steps

1. **Configure AI Gateway**: Set up gateway at Cloudflare dashboard
2. **Add Authentication**: Implement user authentication for WebSocket connections
3. **Real HDB Data**: Replace mock data with actual HDB API integration
4. **Error Handling**: Add comprehensive error handling and logging
5. **Testing**: Add unit and integration tests
6. **Monitoring**: Set up Cloudflare analytics and alerts

## Troubleshooting

### WebSocket Connection Issues
- Ensure worker is running on port 8787
- Check browser console for CORS errors
- Verify agent name is kebab-case: `advisor-agent`

### Database Migration Errors
- Ensure D1 database is created
- Check `database_id` in wrangler.toml
- Run migrations with `--local` flag for local testing

### Build Errors
- Clear node_modules and reinstall
- Check TypeScript version compatibility
- Verify all imports are correct

## License

MIT
