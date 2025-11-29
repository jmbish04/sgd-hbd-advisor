import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { getGeminiClient } from './lib/gemini';
import { Logger } from './lib/logger';

// Standardized Env interface
interface Env {
  KV: KVNamespace;
  DB: D1Database;
  GEMINI_API_KEY: string;
  SGDATA_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  AI_GATEWAY_NAME: string;
  ANALYTICS_ENGINE?: AnalyticsEngine;
}

interface AnalyticsEngine {
  writeDataPoint(event: unknown): void;
}

interface Params {
  triggerType: string;
  metadata?: Record<string, string>;
}

export class MarketScanWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const logger = new Logger(this.env.DB, this.env.ANALYTICS_ENGINE);
    const traceId = `workflow-${this.name || Date.now()}`;

    // ... (rest of the logic remains the same, just ensuring types are correct)

      // Step 2: Fetch market data from API
      const marketData = await step.do('fetch-market-data', async () => {
        // ...
      });

      // Step 3: AI Analysis
      const analysis = await step.do('ai-analysis', async () => {
        const { getModel } = getGeminiClient(this.env);
        const model = getModel(config.model_fast);
        const prompt = `Analyze this HDB market data: ${JSON.stringify(marketData)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
      });

      // Step 4: Save to D1
      await step.do('save-snapshot', async () => {
        // ...
      });
    // ...
  }
}