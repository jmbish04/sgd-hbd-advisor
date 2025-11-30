import { useState, useEffect, useRef } from 'react';
import { AgentClient } from 'agents/client';
import Traceability from './components/Traceability';

interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

type View = 'chat' | 'traceability';

function App() {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [config, setConfig] = useState({ model_smart: 'gemini-2.0-flash-exp' });
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<AgentClient | null>(null);

  useEffect(() => {
    // Connect to Agent via WebSocket
    const client = new AgentClient({
      agent: 'advisor-agent', // kebab-case of AdvisorAgent
      name: 'default-session', // unique session/user identifier
      host: window.location.host,
    });

    client.onopen = () => {
      console.log('Connected to agent');
      setIsConnected(true);
    };

    client.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'INIT') {
          // Initialize with existing state
          setMessages(data.state.messages || []);
        } else if (data.type === 'RESPONSE') {
          setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        } else if (data.type === 'ERROR') {
          console.error('Agent error:', data.error);
          setMessages(prev => [...prev, { role: 'error', content: `Error: ${data.error}` }]);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
        setMessages(prev => [...prev, { role: 'error', content: 'Received an invalid message from the server.' }]);
      }
    };

    client.onclose = () => {
      console.log('Disconnected');
      setIsConnected(false);
    };

    clientRef.current = client;

    return () => client.close();
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !clientRef.current) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    clientRef.current.send(JSON.stringify({ type: 'CHAT', content: input }));
    setInput('');
  };

  const updateConfig = async () => {
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Failed to update config:', error);
      alert('Failed to update configuration');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navigation */}
      <div className="flex gap-2 p-4 bg-white border-b">
        <button
          onClick={() => setCurrentView('chat')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentView === 'chat'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setCurrentView('traceability')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentView === 'traceability'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Traceability
        </button>
      </div>

      {/* Main Content */}
      {currentView === 'traceability' ? (
        <Traceability />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Chat */}
          <div className="flex-1 flex flex-col p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">HDB Autonomous Advisor</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 bg-white rounded-lg shadow-md p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.timestamp ? `${msg.timestamp}-${i}` : i}
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : msg.role === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            disabled={!isConnected || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {/* Right: Admin Settings */}
      <div className="w-80 border-l border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Admin Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Smart Model:
            </label>
            <select
              value={config.model_smart}
              onChange={(e) => setConfig({ ...config, model_smart: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Exp)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>

          <button
            onClick={updateConfig}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
            Save Config
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">System Info</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Messages:</span>
              <span className="font-medium">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-medium text-xs">{config.model_smart}</span>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

export default App;