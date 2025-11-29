import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  ScrollShadow,
  Avatar,
  Chip
} from "@heroui/react";
import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket Connection Logic
  useEffect(() => {
    // Dynamically determine WS protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    console.log("Connecting to WebSocket:", wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setStatus("connected");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Connected to HDB Advisor Agent",
          timestamp: Date.now(),
        },
      ]);
    };

    ws.current.onmessage = (evt) => {
      console.log("Received message:", evt.data);
      try {
        const data = JSON.parse(evt.data);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.data || data.content || evt.data,
            timestamp: Date.now(),
          },
        ]);
      } catch {
        // If not JSON, treat as plain text
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: evt.data,
            timestamp: Date.now(),
          },
        ]);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("disconnected");
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setStatus("disconnected");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "Disconnected from server",
          timestamp: Date.now(),
        },
      ]);
    };

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!inputVal.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Optimistic Update (show user message immediately)
    const userMessage: Message = {
      role: "user",
      content: inputVal,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to server
    ws.current.send(inputVal);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar
              src="https://api.dicebear.com/7.x/bottts/svg?seed=agent"
              size="sm"
              isBordered
              color={status === "connected" ? "success" : "danger"}
            />
            <div>
              <div className="text-lg font-semibold">HDB Market Advisor</div>
              <div className="text-xs text-default-400 flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    status === "connected"
                      ? "bg-success animate-pulse"
                      : status === "connecting"
                      ? "bg-warning animate-pulse"
                      : "bg-danger"
                  }`}
                ></div>
                {status}
              </div>
            </div>
          </div>
          <Chip size="sm" variant="flat" color="secondary">
            WebSocket
          </Chip>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden">
        <CardBody className="p-0 h-full">
          <ScrollShadow className="h-full w-full p-6">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.timestamp}-${idx}`}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[85%] px-4 py-3 rounded-xl text-sm
                      ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : msg.role === "system"
                          ? "bg-default-100 text-default-600 text-xs italic rounded-none text-center w-full"
                          : "bg-default-200 text-foreground rounded-tl-none"
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {messages.length === 0 && status !== "connecting" && (
                <div className="flex h-full items-center justify-center text-default-400 text-sm">
                  <div className="text-center">
                    <p className="text-lg mb-2">👋 Welcome!</p>
                    <p>Ask me about HDB market trends, pricing, or investment insights.</p>
                  </div>
                </div>
              )}
              {status === "connecting" && messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-default-400">
                  <div className="text-center">
                    <div className="mb-2">Connecting to agent...</div>
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollShadow>
        </CardBody>
      </Card>

      {/* Chat Input */}
      <Card className="mt-4">
        <CardBody className="p-4">
          <Input
            value={inputVal}
            onValueChange={setInputVal}
            placeholder={
              status === "connected"
                ? "Ask about HDB market trends..."
                : "Connecting to server..."
            }
            variant="bordered"
            radius="lg"
            size="lg"
            onKeyDown={handleKeyDown}
            disabled={status !== "connected"}
            endContent={
              <Button
                isIconOnly
                radius="full"
                size="sm"
                color="primary"
                variant="solid"
                onPress={sendMessage}
                isDisabled={!inputVal.trim() || status !== "connected"}
              >
                {/* Send Icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </Button>
            }
          />
          <div className="text-xs text-default-400 mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
