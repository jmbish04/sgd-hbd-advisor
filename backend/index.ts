/// <reference types="@cloudflare/workers-types" />
import { OpenAPIHono } from '@hono/zod-openapi';
import { chatApi } from './modules/chat';
import { healthApi } from './modules/health';
import { productsApi } from './modules/dummyjson';
import { createOpenApiSpec } from './utils/openapi';
import { WebSocketServer } from './do/websocket';
import { mcpAgent } from './modules/mcp';
import { AdvisorAgent } from './agent';
import { MarketScanWorkflow } from './workflow';
import { Env } from './types';

export type { Env }; // Export the Env type

const app = new OpenAPIHono<{ Bindings: Env }>();

// Mount API routes
app.route('/api/chat', chatApi);
app.route('/api/health', healthApi);
app.route('/api/products', productsApi);

// MCP Agent route
app.post('/agents/chat', async (c) => {
  const agent = new mcpAgent();
  // Handle MCP agent requests
  return c.json({ message: 'MCP agent endpoint' });
});

// OpenAPI spec endpoint
app.get('/openapi', (c) => {
  return c.json(createOpenApiSpec(app as any));
});

// Durable Objects
export { WebSocketServer, AdvisorAgent };

// Workflows
export { MarketScanWorkflow };

// Cron trigger handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Handle cron triggers for scheduled data scraping
    // Note: Workflows are triggered through wrangler, not instantiated directly
    console.log('Scheduled event triggered:', event.cron);
  },
};