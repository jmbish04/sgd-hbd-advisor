import { AdvisorAgent } from './agent';

export interface Env {
  // Durable Object bindings
  ADVISOR_AGENT: DurableObjectNamespace<AdvisorAgent>;

  // Workflow bindings
  MARKET_SCAN_WORKFLOW: Workflow;

  // Storage bindings
  DB: D1Database;
  KV: KVNamespace;

  // Secrets (set via wrangler secret)
  CLOUDFLARE_ACCOUNT_ID: string;
  GOOGLE_AI_API_KEY: string;
}
