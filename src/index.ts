import { Hono } from 'hono';
import { routeAgentRequest, getAgentByName } from 'agents';
import { AdvisorAgent } from './agent';
import { MarketScanWorkflow } from './workflow';

interface Env {
  ADVISOR_AGENT: DurableObjectNamespace<AdvisorAgent>;
  MARKET_SCAN_WORKFLOW: Workflow;
  CONFIG_KV: KVNamespace;
  DB: D1Database;
  CLOUDFLARE_ACCOUNT_ID: string;
  GOOGLE_AI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Admin config endpoint
app.post('/api/admin/config', async (c) => {
  const body = await c.req.json();
  await c.env.CONFIG_KV.put('system_config', JSON.stringify(body));
  return c.json({ success: true, config: body });
});

app.get('/api/admin/config', async (c) => {
  const config = await c.env.CONFIG_KV.get('system_config');
  return c.json({ config: config ? JSON.parse(config) : {} });
});

// Trigger workflow
app.post('/api/workflow/trigger', async (c) => {
  const instance = await c.env.MARKET_SCAN_WORKFLOW.create({
    params: { triggerType: 'manual' }
  });
  return c.json({ instanceId: instance.id });
});

// Get workflow status
app.get('/api/workflow/:id', async (c) => {
  const id = c.req.param('id');
  const instance = await c.env.MARKET_SCAN_WORKFLOW.get(id);
  const status = await instance.status();
  return c.json({ status });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route WebSocket connections to Agent
    // Uses URL pattern: /agents/:agent/:name
    // e.g., /agents/advisor-agent/user-123
    if (url.pathname.startsWith('/agents/')) {
      const response = await routeAgentRequest(request, env);
      if (response) return response;
      return new Response('Agent not found', { status: 404 });
    }

    // Alternative: Direct agent access by name
    if (url.pathname === '/api/chat') {
      const agentName = url.searchParams.get('agent') || 'default';
      const agent = await getAgentByName<Env, AdvisorAgent>(
        env.ADVISOR_AGENT,
        agentName
      );
      return agent.fetch(request);
    }

    // Handle API routes with Hono
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }

    // Static assets are handled automatically by Workers Static Assets
    return new Response('Not Found', { status: 404 });
  }
};

// Export classes for Durable Objects and Workflows
export { AdvisorAgent, MarketScanWorkflow };
