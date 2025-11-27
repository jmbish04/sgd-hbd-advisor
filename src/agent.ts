import { Agent } from "agents";
import { getGeminiClient } from "./lib/gemini";

interface Env {
  CONFIG_KV: KVNamespace;
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
  // Initial state persisted to SQLite storage
  initialState: ChatState = {
    messages: [],
    model: "gemini-2.0-flash-exp"
  };

  // Called when a WebSocket client connects
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    // Access original request via ctx.request for auth headers, cookies, etc.
    console.log(`Client connected to agent: ${this.name}`);

    // Send current state to newly connected client
    connection.send(JSON.stringify({
      type: "INIT",
      state: this.state
    }));
  }

  // Called for each WebSocket message
  async onMessage(connection: Connection, message: WSMessage) {
    try {
      const data = JSON.parse(message as string);

      if (data.type === "CHAT") {
        // Dynamic Config from KV
        const configStr = await this.env.CONFIG_KV.get("system_config");
        const config = configStr ? JSON.parse(configStr) : {};
        const modelName = config.model_smart || "gemini-2.0-flash-exp";

        // Update state (automatically persisted and synced to clients)
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

        // Call Gemini via AI Gateway
        const { ai } = getGeminiClient(this.env, modelName);
        const result = await ai.generateContent(data.content);
        const response = result.response;
        const responseText = response.text();

        // Broadcast response to all connected clients
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
      }
    } catch (e) {
      const error = e as Error;
      connection.send(JSON.stringify({
        type: "ERROR",
        error: error.message || "Invalid message format"
      }));
    }
  }

  // Handle HTTP requests to the Agent
  async onRequest(request: Request) {
    return new Response(JSON.stringify({
      status: "ok",
      messages: this.state.messages.length,
      model: this.state.model
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
