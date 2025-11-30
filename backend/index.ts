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
app.route('/agents', mcpAgent);

// OpenAPI spec endpoint
app.get('/openapi', createOpenApiSpec(app));

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
    const workflow = new MarketScanWorkflow(env, ctx);
    await workflow.run();
  },
};