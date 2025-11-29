import { Agent, Connection, ConnectionContext, WSMessage } from "agents";
import { getGeminiClient } from "./lib/gemini";
import { Logger, withTrace } from "./lib/logger";

// Standardized Env interface
interface Env {
  DB: D1Database;
  KV: KVNamespace;
  GEMINI_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  AI_GATEWAY_NAME: string;
  ANALYTICS_ENGINE?: AnalyticsEngine;
}

interface AnalyticsEngine {
  writeDataPoint(event: unknown): void;
}

interface ChatMessage {
  role: string;
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  model: string;
}

export class AdvisorAgent extends Agent<Env, ChatState> {
  private logger: Logger | null = null;

  initialState: ChatState = {
    messages: [],
    model: "gemini-1.5-flash"
  };

  private getLogger(): Logger {
    if (!this.logger) {
      this.logger = new Logger(this.env.DB, this.env.ANALYTICS_ENGINE);
    }
    return this.logger;
  }

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const logger = this.getLogger();
    const traceId = `agent-connect-${Date.now()}`;
    // ... (rest of the method is mostly fine, just ensuring types are correct)
  }

  async onMessage(connection: Connection, message: WSMessage) {
    const logger = this.getLogger();
    const traceId = `agent-message-${Date.now()}`;

    try {
      const data = JSON.parse(message as string);

      if (data.type === "CHAT") {
        await withTrace(logger, {
          traceId,
          component: 'AdvisorAgent',
          name: 'process_chat_message',
          metadata: { sessionId: this.name }
        }, async () => {
          const configStr = await this.env.KV.get("system_config");
          const config = configStr ? JSON.parse(configStr) : {};
          const modelName = config.model_smart || "gemini-1.5-flash";

          const newMessage: ChatMessage = {
            role: "user",
            content: data.content,
            timestamp: Date.now()
          };

          this.setState({
            ...this.state,
            messages: [...this.state.messages, newMessage],
            model: modelName
          });

          const startTime = Date.now();
          const { getModel } = getGeminiClient(this.env);
          const model = getModel(modelName);
          const result = await model.generateContent(data.content);
          const response = result.response;
          const responseText = response.text();
          const duration = Date.now() - startTime;

          // ... (logging remains the same)

          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: responseText,
            timestamp: Date.now()
          };

          this.setState({
            ...this.state,
            messages: [...this.state.messages, assistantMessage]
          });

          connection.send(JSON.stringify({
            type: "RESPONSE",
            content: responseText
          }));
        });
      }
    } catch (e) {
      // ... (error handling remains the same)
    }
  }

  async onRequest(request: Request) {
    const logger = this.getLogger();
    const traceId = `agent-request-${Date.now()}`;

    await logger.info('HTTP request to agent', {
      component: 'AdvisorAgent',
      traceId,
      sessionId: this.name,
      metadata: {
        method: request.method,
        url: request.url,
        codeLocation: 'agent.ts:onRequest'
      }
    });

    return new Response(JSON.stringify({
      status: "ok",
      messages: this.state.messages.length,
      model: this.state.model
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
