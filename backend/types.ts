/// <reference types="@cloudflare/workers-types" />
import { WebSocketServer } from './do/websocket';
import { AdvisorAgent } from './agent';

export type Env = {
  AI: Ai;
  DB: D1Database;
  WS_HANDLER: DurableObjectNamespace;
  ADVISOR_AGENT: DurableObjectNamespace;
  MARKET_SCAN_WORKFLOW: any; // Workflow binding
  KV: KVNamespace;
  ASSETS: Fetcher;
  GEMINI_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  AI_GATEWAY_NAME: string;
  SGDATA_KEY: string;
  ANALYTICS_ENGINE?: AnalyticsEngineDataset;
  MCP_AUTH_ENABLED?: string;
  MCP_API_KEYS?: string;
  CLOUDFLARE_ACCESS_TEAM_DOMAIN?: string;
  CLOUDFLARE_ACCESS_AUDIENCE?: string;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface TraceContext {
  traceId: string;
  parentId?: string;
  component: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface LogContext {
  component: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}