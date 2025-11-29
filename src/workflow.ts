import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { getGeminiClient } from './lib/gemini';
import { Logger } from './lib/logger';

interface Env {
  KV: KVNamespace;
  DB: D1Database;
  GEMINI_API_KEY: string;
  SGDATA_KEY: string; // For Singapore Open Data API
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

    await logger.info('Workflow started', {
      component: 'MarketScanWorkflow',
      traceId,
      metadata: {
        triggerType: event.payload.triggerType,
        workflowId: this.name,
        codeLocation: 'workflow.ts:run:23'
      }
    });

    const workflowTraceId = await logger.startTrace({
      traceId,
      component: 'MarketScanWorkflow',
      name: 'market_scan_workflow',
      metadata: {
        triggerType: event.payload.triggerType,
        workflowId: this.name
      }
    });

    try {
      // Step 1: Fetch config
      const config = await step.do('fetch-config', async () => {
        const configStr = await this.env.KV.get("system_config");
        return configStr ? JSON.parse(configStr) : { model_fast: "gemini-1.5-flash" };
      });

      // Step 2: Fetch market data from API
      const marketData = await step.do('fetch-market-data', async () => {
        if (!this.env.SGDATA_KEY) {
          await logger.error('SGDATA_KEY is not configured', { component: 'MarketScanWorkflow', traceId });
          throw new Error('SGDATA_KEY secret is not available.');
        }
        
        // NOTE: This is a placeholder endpoint. Replace with the actual resource ID.
        const API_ENDPOINT = 'https://data.gov.sg/api/action/datastore_search?resource_id=f1765b54-a209-4718-8d38-a39237f502b3&limit=5';

        const response = await fetch(API_ENDPOINT, {
          headers: { 'Authorization': this.env.SGDATA_KEY },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch market data: ${response.status} ${errorText}`);
        }

        const data = await response.json() as any;
        
        // NOTE: Adapt this to the actual response structure.
        const record = data?.result?.records[0];
        const transformedData = {
          town: record?.town || "Unknown",
          flat_type: record?.flat_type || "Unknown",
          price: parseFloat(record?.resale_price) || 0,
          yield: 0, // Placeholder
        };

        await logger.logEvent({
          traceId,
          level: 'info',
          component: 'MarketScanWorkflow',
          action: 'market_data_fetched',
          message: 'Market data fetched from Data.gov.sg',
          data: transformedData
        });

        return transformedData;
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
        return this.env.DB.prepare(
          `INSERT INTO market_snapshots (town, flat_type, price, \`yield\`, created_at) VALUES (?, ?, ?, ?, ?)`
        ).bind(
          marketData.town,
          marketData.flat_type,
          marketData.price,
          marketData.yield,
          new Date().toISOString()
        ).run();
      });

      await logger.endTrace(workflowTraceId, 'success', { analysis: analysis.substring(0, 100) });
      return { analysis, marketData };

    } catch (error) {
      await logger.endTrace(workflowTraceId, 'error', { error: error instanceof Error ? error.message : String(error) });
      await logger.error('Workflow failed', { component: 'MarketScanWorkflow', traceId }, error as Error);
      throw error;
    }
  }
}