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
- **Bun** (recommended) or Node.js 18+
- Cloudflare account with Workers enabled
- Google AI API key

### 1. Install Dependencies

```bash
# Install all dependencies (root + client)
bun run setup
```

Or manually:
```bash
bun install
cd client && bun install
cd ..
```

### 2. D1 Database & KV

The database and KV namespace are already configured in `wrangler.toml`:
- D1 Database: `hbd-advisor` (ID: `781a9476-2cf0-43fc-94fc-742a16e39af5`)
- KV Namespace: `KV` (ID: `80f8c30b48ad4112ba0b5d27e573f6eb`)

### 3. Set Secrets

```bash
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put GOOGLE_AI_API_KEY
```

### 4. Generate and Apply Migrations

```bash
# Generate migrations from schema
bun run db:generate

# Apply locally for testing
bun run migrate:local

# Apply to remote (production)
bun run migrate:remote
```

### 5. Run Locally

```bash
bun run dev
```

This will start:
- Worker on `http://localhost:8787`
- React dev server on `http://localhost:5173`

### 6. Deploy to Cloudflare

The deploy script handles everything automatically:

```bash
bun run deploy
```

This will:
1. Build the React client
2. Apply migrations to remote D1 database
3. Deploy the Worker to Cloudflare

Perfect for CI/CD pipelines!

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

### Observability & Traceability
```
GET /api/observability/logs?limit=100&level=error&component=AdvisorAgent
GET /api/observability/traces?limit=50&component=MarketScanWorkflow
GET /api/observability/traces/:traceId/events
GET /api/observability/stats
```

Access the **Traceability Dashboard** in the UI to view real-time logs, traces, and system statistics.

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

### 5. Comprehensive Observability
Full transparency with D1-backed logging and tracing:
- **Traces Table**: Track every operation with status, duration, metadata
- **Trace Events**: Detailed event logs with code locations
- **Logs Table**: Application logs linked to traces
- **Real-time Dashboard**: Shadcn UI dashboard for monitoring
- **Code Location Tracking**: Know exactly where each log originated
- **Performance Monitoring**: Track API call durations, workflow steps
- **Error Tracing**: Link errors back to their originating trace

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
# Development
bun run dev              # Run worker + client concurrently
bun run build            # Build React client
bun run type-check       # TypeScript type checking

# Database
bun run db:generate      # Generate Drizzle migrations from schema
bun run migrate:local    # Apply migrations to local D1 (--local)
bun run migrate:remote   # Apply migrations to remote D1 (--remote)

# Deployment (CI/CD Optimized)
bun run deploy           # Build + Migrate + Deploy (all-in-one)

# Setup
bun run setup            # Install all dependencies (root + client)
bun run client:install   # Install client dependencies only

# Monitoring
bun run cf:tail          # Tail Cloudflare Worker logs
bun run cf:logs          # Tail logs with pretty formatting
```

## CI/CD Configuration

### Cloudflare Dashboard CI/CD

This project is optimized for Cloudflare's built-in CI/CD. To set up:

1. **Push to GitHub**: Commit and push your code to a GitHub repository
2. **Connect in Cloudflare Dashboard**:
   - Navigate to Workers & Pages > Your Worker > Settings > Builds & Deployments
   - Connect your GitHub repository
   - Select the branch to deploy from (e.g., `main`)
3. **Configure Build Settings**:
   ```
   Build command: bun run deploy
   Build output directory: (leave empty - handled by wrangler)
   Root directory: /
   ```
4. **Environment Variables**: Set in Dashboard under Settings > Variables and Secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `GOOGLE_AI_API_KEY`

The `deploy` script automatically handles:
- ✅ Building the React client (`bun run build`)
- ✅ Applying D1 migrations to remote (`bun run migrate:remote`)
- ✅ Deploying the Worker (`wrangler deploy`)

**No additional configuration needed!** Every push to your selected branch will automatically build and deploy.

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
