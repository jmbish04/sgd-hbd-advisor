import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { getGeminiClient } from './lib/gemini';

interface Env {
  CONFIG_KV: KVNamespace;
  DB: D1Database;
  CLOUDFLARE_ACCOUNT_ID: string;
  GOOGLE_AI_API_KEY: string;
}

interface Params {
  triggerType: string;
  metadata?: Record<string, string>;
}

export class MarketScanWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Access bindings via this.env
    // Access params via event.payload

    // Step 1: Fetch config
    const config = await step.do('fetch-config', async () => {
      const configStr = await this.env.CONFIG_KV.get("system_config");
      return configStr ? JSON.parse(configStr) : { model_fast: "gemini-2.0-flash-exp" };
    });

    // Step 2: Fetch market data (mocked)
    const marketData = await step.do('fetch-market-data', async () => {
      // In production, fetch real HDB data
      return {
        town: "Tampines",
        flat_type: "4-Room",
        price: 550000,
        yield: 3.2
      };
    });

    // Step 3: AI Analysis
    const analysis = await step.do('ai-analysis', async () => {
      const { ai } = getGeminiClient(this.env, config.model_fast);
      const result = await ai.generateContent(
        `Analyze this HDB market data: ${JSON.stringify(marketData)}`
      );
      return result.response.text();
    });

    // Step 4: Save to D1
    await step.do('save-snapshot', async () => {
      await this.env.DB.prepare(
        `INSERT INTO market_snapshots (town, flat_type, price, yield, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        marketData.town,
        marketData.flat_type,
        marketData.price,
        marketData.yield,
        new Date().toISOString()
      ).run();

      return { saved: true };
    });

    // Optional: Wait before next step
    await step.sleep('cooldown', '1 minute');

    // Return result (available via instance.status())
    return { analysis, marketData };
  }
}
