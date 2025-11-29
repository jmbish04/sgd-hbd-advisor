import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { callGeminiApi } from './lib/gemini';
import { Logger } from './lib/logger';

interface Env {
  KV: KVNamespace;
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
    const logger = new Logger(this.env.DB);
    const traceId = `workflow-${event.id || Date.now()}`;

    await logger.info('Workflow started', {
      component: 'MarketScanWorkflow',
      traceId,
      metadata: {
        triggerType: event.payload.triggerType,
        workflowId: event.id,
        codeLocation: 'workflow.ts:run:23'
      }
    });

    const workflowTraceId = await logger.startTrace({
      traceId,
      component: 'MarketScanWorkflow',
      name: 'market_scan_workflow',
      metadata: {
        triggerType: event.payload.triggerType,
        workflowId: event.id
      }
    });

    try {
      // Step 1: Fetch config
      await logger.logEvent({
        traceId,
        level: 'info',
        component: 'MarketScanWorkflow',
        action: 'start_fetch_config',
        message: 'Starting config fetch step',
        codeLocation: 'workflow.ts:run:44'
      });

      const config = await step.do('fetch-config', async () => {
        const configStr = await this.env.KV.get("system_config");
        const parsedConfig = configStr ? (()=>{ try { return JSON.parse(configStr) } catch(e) { console.error('Failed to parse system_config from KV, using default', e); return {}; } })() : { model_fast: "gemini-2.0-flash-exp" };

        await logger.logEvent({
          traceId,
          level: 'info',
          component: 'MarketScanWorkflow',
          action: 'config_fetched',
          message: 'Configuration fetched from KV',
          data: {
            hasConfig: !!configStr,
            model: parsedConfig.model_fast
          },
          codeLocation: 'workflow.ts:run:54'
        });

        return parsedConfig;
      });

      // Step 2: Fetch market data (mocked)
      await logger.logEvent({
        traceId,
        level: 'info',
        component: 'MarketScanWorkflow',
        action: 'start_fetch_market_data',
        message: 'Starting market data fetch step',
        codeLocation: 'workflow.ts:run:69'
      });

      const marketData = await step.do('fetch-market-data', async () => {
        // In production, fetch real HDB data
        const data = {
          town: "Tampines",
          flat_type: "4-Room",
          price: 550000,
          yield: 3.2
        };

        await logger.logEvent({
          traceId,
          level: 'info',
          component: 'MarketScanWorkflow',
          action: 'market_data_fetched',
          message: 'Market data fetched (mocked)',
          data,
          codeLocation: 'workflow.ts:run:83'
        });

        return data;
      });

      // Step 3: AI Analysis
      await logger.logEvent({
        traceId,
        level: 'info',
        component: 'MarketScanWorkflow',
        action: 'start_ai_analysis',
        message: `Starting AI analysis with model ${config.model_fast}`,
        data: {
          model: config.model_fast,
          marketData
        },
        codeLocation: 'workflow.ts:run:100'
      });

      const analysis = await step.do('ai-analysis', async () => {
        const startTime = Date.now();
        const prompt = `Analyze this HDB market data: ${JSON.stringify(marketData)}`;
        const geminiResponse = await callGeminiApi(this.env, config.model_fast, prompt);
        const analysisText = geminiResponse.candidates[0]?.content?.parts[0]?.text || "Analysis could not be generated.";
        const duration = Date.now() - startTime;

        await logger.logEvent({
          traceId,
          level: 'info',
          component: 'MarketScanWorkflow',
          action: 'ai_analysis_complete',
          message: `AI analysis completed in ${duration}ms`,
          data: {
            duration,
            analysisLength: analysisText.length,
            model: config.model_fast
          },
          codeLocation: 'workflow.ts:run:132'
        });

        return analysisText;
      });

      // Step 4: Save to D1
      await logger.logEvent({
        traceId,
        level: 'info',
        component: 'MarketScanWorkflow',
        action: 'start_save_snapshot',
        message: 'Starting D1 save operation',
        codeLocation: 'workflow.ts:run:145'
      });

      await step.do('save-snapshot', async () => {
        await this.env.DB.prepare(
          `INSERT INTO market_snapshots (town, flat_type, price, \`yield\`, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          marketData.town,
          marketData.flat_type,
          marketData.price,
          marketData.yield,
          new Date().toISOString()
        ).run();

        await logger.logEvent({
          traceId,
          level: 'info',
          component: 'MarketScanWorkflow',
          action: 'snapshot_saved',
          message: 'Market snapshot saved to D1',
          data: marketData,
          codeLocation: 'workflow.ts:run:166'
        });

        return { saved: true };
      });

      // Optional: Wait before next step
      await logger.logEvent({
        traceId,
        level: 'debug',
        component: 'MarketScanWorkflow',
        action: 'start_cooldown',
        message: 'Starting cooldown period (1 minute)',
        codeLocation: 'workflow.ts:run:179'
      });

      await step.sleep('cooldown', '1 minute');

      await logger.logEvent({
        traceId,
        level: 'debug',
        component: 'MarketScanWorkflow',
        action: 'cooldown_complete',
        message: 'Cooldown period complete',
        codeLocation: 'workflow.ts:run:189'
      });

      // Mark workflow as successful
      await logger.endTrace(workflowTraceId, 'success', {
        analysis: analysis.substring(0, 100),
        marketData
      });

      await logger.info('Workflow completed successfully', {
        component: 'MarketScanWorkflow',
        traceId,
        metadata: {
          workflowId: event.id,
          codeLocation: 'workflow.ts:run:202'
        }
      });

      // Return result (available via instance.status())
      return { analysis, marketData };
    } catch (error) {
      await logger.endTrace(workflowTraceId, 'error', {
        error: error instanceof Error ? error.message : String(error)
      });

      await logger.error('Workflow failed', {
        component: 'MarketScanWorkflow',
        traceId,
        metadata: {
          workflowId: event.id,
          codeLocation: 'workflow.ts:run:218'
        }
      }, error as Error);

      throw error;
    }
  }
}
