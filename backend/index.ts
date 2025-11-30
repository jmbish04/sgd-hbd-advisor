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

// ... (rest of the file is correct)