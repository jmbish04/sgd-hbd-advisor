import { Hono } from 'hono';
import { routeAgentRequest, getAgentByName } from 'agents';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq, sql } from 'drizzle-orm';
import { AdvisorAgent } from './agent';
import { MarketScanWorkflow } from './workflow';
import { WebSocketServer } from './do/websocket';
import { Logger } from './lib/logger';
import { logs, traces, traceEvents } from './db/schema';

interface Env {
  ADVISOR_AGENT: DurableObjectNamespace<AdvisorAgent>;
  WS_HANDLER: DurableObjectNamespace<WebSocketServer>;
  MARKET_SCAN_WORKFLOW: Workflow;
  KV: KVNamespace;
  KV_CACHE: KVNamespace;
  DB: D1Database;
  CLOUDFLARE_ACCOUNT_ID: string;
  GOOGLE_AI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get('/api/health', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `health-${Date.now()}`;

  await logger.info('Health check requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:health:27' }
  });

  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin config endpoint
app.post('/api/admin/config', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `config-update-${Date.now()}`;

  await logger.info('Config update requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:config:40' }
  });

  try {
    const body = await c.req.json();
    await c.env.KV.put('system_config', JSON.stringify(body));

    await logger.info('Config updated successfully', {
      component: 'Worker',
      traceId,
      metadata: { config: body, codeLocation: 'index.ts:config:51' }
    });

    return c.json({ success: true, config: body });
  } catch (error) {
    await logger.error('Config update failed', {
      component: 'Worker',
      traceId,
      metadata: { codeLocation: 'index.ts:config:59' }
    }, error as Error);

    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

app.get('/api/admin/config', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `config-fetch-${Date.now()}`;

  await logger.debug('Config fetch requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:config:74' }
  });

  const config = await c.env.KV.get('system_config');
  return c.json({ config: config ? JSON.parse(config) : {} });
});

// Trigger workflow
app.post('/api/workflow/trigger', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `workflow-trigger-${Date.now()}`;

  await logger.info('Workflow trigger requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:workflow:89' }
  });

  try {
    const instance = await c.env.MARKET_SCAN_WORKFLOW.create({
      params: { triggerType: 'manual' }
    });

    await logger.info('Workflow triggered successfully', {
      component: 'Worker',
      traceId,
      metadata: { instanceId: instance.id, codeLocation: 'index.ts:workflow:101' }
    });

    return c.json({ instanceId: instance.id });
  } catch (error) {
    await logger.error('Workflow trigger failed', {
      component: 'Worker',
      traceId,
      metadata: { codeLocation: 'index.ts:workflow:109' }
    }, error as Error);

    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get workflow status
app.get('/api/workflow/:id', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `workflow-status-${Date.now()}`;
  const id = c.req.param('id');

  await logger.debug('Workflow status requested', {
    component: 'Worker',
    traceId,
    metadata: { workflowId: id, codeLocation: 'index.ts:workflow:125' }
  });

  try {
    const instance = await c.env.MARKET_SCAN_WORKFLOW.get(id);
    const status = await instance.status();
    return c.json({ status });
  } catch (error) {
    await logger.error('Workflow status fetch failed', {
      component: 'Worker',
      traceId,
      metadata: { workflowId: id, codeLocation: 'index.ts:workflow:136' }
    }, error as Error);

    return c.json({ error: (error as Error).message }, 500);
  }
});

// ===== OBSERVABILITY API ENDPOINTS =====

// Get recent logs
app.get('/api/observability/logs', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `logs-fetch-${Date.now()}`;

  await logger.debug('Logs fetch requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:observability:153' }
  });

  try {
    const db = drizzle(c.env.DB);
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 1000);
    const level = c.req.query('level');
    const component = c.req.query('component');

    let query = db.select().from(logs).orderBy(desc(logs.timestamp));

    if (level) {
      query = query.where(eq(logs.level, level)) as any;
    }
    if (component) {
      query = query.where(eq(logs.component, component)) as any;
    }

    const results = await query.limit(limit).all();

    return c.json({ logs: results, count: results.length });
  } catch (error) {
    await logger.error('Logs fetch failed', {
      component: 'Worker',
      traceId,
      metadata: { codeLocation: 'index.ts:observability:178' }
    }, error as Error);

    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get traces
app.get('/api/observability/traces', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `traces-fetch-${Date.now()}`;

  await logger.debug('Traces fetch requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:observability:194' }
  });

  try {
    const db = drizzle(c.env.DB);
    const limit = parseInt(c.req.query('limit') || '50');
    const component = c.req.query('component');

    let query = db.select().from(traces).orderBy(desc(traces.startTime));

    if (component) {
      query = query.where(eq(traces.component, component)) as any;
    }

    const results = await query.limit(limit).all();

    return c.json({ traces: results, count: results.length });
  } catch (error) {
    await logger.error('Traces fetch failed', {
      component: 'Worker',
      traceId,
      metadata: { codeLocation: 'index.ts:observability:215' }
    }, error as Error);

    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get trace events for a specific trace
app.get('/api/observability/traces/:traceId/events', async (c) => {
  const logger = new Logger(c.env.DB);
  const requestTraceId = `trace-events-fetch-${Date.now()}`;
  const targetTraceId = c.req.param('traceId');

  await logger.debug('Trace events fetch requested', {
    component: 'Worker',
    traceId: requestTraceId,
    metadata: { targetTraceId, codeLocation: 'index.ts:observability:232' }
  });

  try {
    const db = drizzle(c.env.DB);
    const events = await db
      .select()
      .from(traceEvents)
      .where(eq(traceEvents.traceId, targetTraceId))
      .orderBy(traceEvents.timestamp)
      .all();

    return c.json({ events, count: events.length, traceId: targetTraceId });
  } catch (error) {
    await logger.error('Trace events fetch failed', {
      component: 'Worker',
      traceId: requestTraceId,
      metadata: { targetTraceId, codeLocation: 'index.ts:observability:248' }
    }, error as Error);

    return c.json({ error: (error as Error).message }, 500);
  }
});

// Get trace statistics
app.get('/api/observability/stats', async (c) => {
  const logger = new Logger(c.env.DB);
  const traceId = `stats-fetch-${Date.now()}`;

  await logger.debug('Stats fetch requested', {
    component: 'Worker',
    traceId,
    metadata: { codeLocation: 'index.ts:observability:264' }
  });

  try {
    const db = drizzle(c.env.DB);

    // Get counts from each table
    const logCount = await db.select({ count: sql<number>`count(*)` }).from(logs).get();
    const traceCount = await db.select({ count: sql<number>`count(*)` }).from(traces).get();
    const eventCount = await db.select({ count: sql<number>`count(*)` }).from(traceEvents).get();

    // Get error counts
    const errorLogs = await db
      .select({ count: sql<number>`count(*)` })
      .from(logs)
      .where(eq(logs.level, 'error'))
      .get();

    const errorTraces = await db
      .select({ count: sql<number>`count(*)` })
      .from(traces)
      .where(eq(traces.status, 'error'))
      .get();

    return c.json({
      stats: {
        totalLogs: logCount?.count || 0,
        totalTraces: traceCount?.count || 0,
        totalEvents: eventCount?.count || 0,
        errorLogs: errorLogs?.count || 0,
        errorTraces: errorTraces?.count || 0,
      }
    });
  } catch (error) {
    await logger.error('Stats fetch failed', {
      component: 'Worker',
      traceId,
      metadata: { codeLocation: 'index.ts:observability:297' }
    }, error as Error);

    return c.json({ error: (error as Error).message }, 500);
  }
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket endpoint for real-time chat
    if (url.pathname === '/api/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }
      // Route to WebSocket Durable Object
      const id = env.WS_HANDLER.idFromName('default-room');
      const stub = env.WS_HANDLER.get(id);
      return stub.fetch(request);
    }

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
export { AdvisorAgent, MarketScanWorkflow, WebSocketServer };
