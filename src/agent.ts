import { Agent } from "agents";
import { getGeminiClient } from "./lib/gemini";
import { Logger, withTrace } from "./lib/logger";

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  CLOUDFLARE_ACCOUNT_ID: string;
  GOOGLE_AI_API_KEY: string;
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

  // Initial state persisted to SQLite storage
  initialState: ChatState = {
    messages: [],
    model: "gemini-2.0-flash-exp"
  };

  // Initialize logger
  private getLogger(): Logger {
    if (!this.logger) {
      this.logger = new Logger(this.env.DB);
    }
    return this.logger;
  }

  // Called when a WebSocket client connects
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const logger = this.getLogger();
    const traceId = `agent-connect-${Date.now()}`;

    await logger.info('Client connecting to agent', {
      component: 'AdvisorAgent',
      traceId,
      sessionId: this.name,
      metadata: {
        agentName: this.name,
        userAgent: ctx.request.headers.get('user-agent'),
        codeLocation: 'AdvisorAgent.onConnect'
      }
    });

    try {
      // Send current state to newly connected client
      await logger.logEvent({
        traceId,
        level: 'debug',
        component: 'AdvisorAgent',
        action: 'send_init_state',
        message: `Sending initial state to client`,
        data: {
          messageCount: this.state.messages.length,
          currentModel: this.state.model
        },
        codeLocation: 'agent.ts:onConnect:52'
      });

      connection.send(JSON.stringify({
        type: "INIT",
        state: this.state
      }));

      await logger.info('Client connected successfully', {
        component: 'AdvisorAgent',
        traceId,
        sessionId: this.name,
        metadata: {
          messageCount: this.state.messages.length,
          codeLocation: 'agent.ts:onConnect:65'
        }
      });
    } catch (error) {
      await logger.error('Failed to send init state', {
        component: 'AdvisorAgent',
        traceId,
        sessionId: this.name
      }, error as Error);
      throw error;
    }
  }

  // Called for each WebSocket message
  async onMessage(connection: Connection, message: WSMessage) {
    const logger = this.getLogger();
    const traceId = `agent-message-${Date.now()}`;

    await logger.info('Received WebSocket message', {
      component: 'AdvisorAgent',
      traceId,
      sessionId: this.name,
      metadata: {
        messageLength: (message as string).length,
        codeLocation: 'agent.ts:onMessage:90'
      }
    });

    try {
      const data = JSON.parse(message as string);

      await logger.logEvent({
        traceId,
        level: 'debug',
        component: 'AdvisorAgent',
        action: 'parse_message',
        message: 'Parsed incoming message',
        data: { type: data.type },
        codeLocation: 'agent.ts:onMessage:103'
      });

      if (data.type === "CHAT") {
        await withTrace(logger, {
          traceId,
          component: 'AdvisorAgent',
          name: 'process_chat_message',
          metadata: { sessionId: this.name }
        }, async () => {
          // Dynamic Config from KV
          await logger.logEvent({
            traceId,
            level: 'debug',
            component: 'AdvisorAgent',
            action: 'fetch_kv_config',
            message: 'Fetching configuration from KV',
            codeLocation: 'agent.ts:onMessage:120'
          });

          const configStr = await this.env.KV.get("system_config");
          const config = configStr ? JSON.parse(configStr) : {};
          const modelName = config.model_smart || "gemini-2.0-flash-exp";

          await logger.logEvent({
            traceId,
            level: 'info',
            component: 'AdvisorAgent',
            action: 'config_loaded',
            message: `Using model: ${modelName}`,
            data: { model: modelName, hasConfig: !!configStr },
            codeLocation: 'agent.ts:onMessage:133'
          });

          // Update state (automatically persisted and synced to clients)
          const newMessage: ChatMessage = {
            role: "user",
            content: data.content,
            timestamp: Date.now()
          };

          await logger.logEvent({
            traceId,
            level: 'debug',
            component: 'AdvisorAgent',
            action: 'update_state',
            message: 'Adding user message to state',
            data: {
              messageLength: data.content.length,
              totalMessages: this.state.messages.length + 1
            },
            codeLocation: 'agent.ts:onMessage:152'
          });

          this.setState({
            ...this.state,
            messages: [...this.state.messages, newMessage],
            model: modelName
          });

          // Call Gemini via AI Gateway
          await logger.logEvent({
            traceId,
            level: 'info',
            component: 'AdvisorAgent',
            action: 'call_gemini_api',
            message: `Calling Gemini API with model ${modelName}`,
            data: {
              model: modelName,
              promptLength: data.content.length
            },
            codeLocation: 'agent.ts:onMessage:171'
          });

          const startTime = Date.now();
          const { ai } = getGeminiClient(this.env, modelName);
          const result = await ai.generateContent(data.content);
          const response = result.response;
          const responseText = response.text();
          const duration = Date.now() - startTime;

          await logger.logEvent({
            traceId,
            level: 'info',
            component: 'AdvisorAgent',
            action: 'gemini_response_received',
            message: `Received response from Gemini in ${duration}ms`,
            data: {
              duration,
              responseLength: responseText.length,
              model: modelName
            },
            codeLocation: 'agent.ts:onMessage:190'
          });

          // Broadcast response to all connected clients
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: responseText,
            timestamp: Date.now()
          };

          await logger.logEvent({
            traceId,
            level: 'debug',
            component: 'AdvisorAgent',
            action: 'update_state_with_response',
            message: 'Adding assistant response to state',
            data: {
              responseLength: responseText.length,
              totalMessages: this.state.messages.length + 1
            },
            codeLocation: 'agent.ts:onMessage:209'
          });

          this.setState({
            ...this.state,
            messages: [...this.state.messages, assistantMessage]
          });

          await logger.logEvent({
            traceId,
            level: 'debug',
            component: 'AdvisorAgent',
            action: 'send_response',
            message: 'Sending response to client',
            data: { responseLength: responseText.length },
            codeLocation: 'agent.ts:onMessage:223'
          });

          connection.send(JSON.stringify({
            type: "RESPONSE",
            content: responseText
          }));

          await logger.info('Chat message processed successfully', {
            component: 'AdvisorAgent',
            traceId,
            sessionId: this.name,
            metadata: {
              duration,
              model: modelName,
              codeLocation: 'agent.ts:onMessage:237'
            }
          });
        });
      }
    } catch (e) {
      const error = e as Error;

      await logger.error('Error processing message', {
        component: 'AdvisorAgent',
        traceId,
        sessionId: this.name,
        metadata: {
          codeLocation: 'agent.ts:onMessage:251'
        }
      }, error);

      connection.send(JSON.stringify({
        type: "ERROR",
        error: error.message || "Invalid message format"
      }));
    }
  }

  // Handle HTTP requests to the Agent
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
        codeLocation: 'agent.ts:onRequest:275'
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
