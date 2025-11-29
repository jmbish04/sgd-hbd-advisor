import { useState } from 'react';
import useSWR from 'swr';

// --- Interfaces ---
interface Log {
  id: number;
  timestamp: string;
  level: string;
  component: string;
  message: string;
  traceId: string | null;
}

interface Trace {
  id: string;
  traceId: string;
  name: string;
  component: string;
  status: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
}

interface TraceEvent {
  id: number;
  traceId: string;
  eventId: string;
  timestamp: string;
  level: string;
  component: string;
  action: string;
  message: string;
  data: string | null;
  codeLocation: string | null;
}

interface Stats {
  totalLogs: number;
  totalTraces: number;
  totalEvents: number;
  errorLogs: number;
  errorTraces: number;
}

// --- SWR Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Component ---
export default function Traceability() {
  const [activeTab, setActiveTab] = useState<'logs' | 'traces'>('logs');
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const swrOptions = {
    refreshInterval: autoRefresh ? 5000 : 0,
  };

  // --- Data Fetching with useSWR ---
  const { data: logsData, error: logsError } = useSWR<{ logs: Log[] }>('/api/observability/logs?limit=100', fetcher, swrOptions);
  const { data: tracesData, error: tracesError } = useSWR<{ traces: Trace[] }>('/api/observability/traces?limit=50', fetcher, swrOptions);
  const { data: statsData, error: statsError } = useSWR<{ stats: Stats }>('/api/observability/stats', fetcher, swrOptions);
  const { data: traceEventsData, error: traceEventsError, isLoading: traceEventsLoading } = useSWR<{ events: TraceEvent[] }>(
    selectedTrace ? `/api/observability/traces/${selectedTrace}/events` : null,
    fetcher
  );

  const logs = logsData?.logs || [];
  const traces = tracesData?.traces || [];
  const stats = statsData?.stats;
  const traceEvents = traceEventsData?.events || [];

  // --- Helper Functions ---
  const getLevelColor = (level: string) => {
    // ... (implementation from previous version)
  };
  const getStatusColor = (status: string) => {
    // ... (implementation from previous version)
  };
  const formatDuration = (duration: number | null) => {
    // ... (implementation from previous version)
  };
  const parseJSON = (json: string | null) => {
    // ... (implementation from previous version)
  };

  // --- Render Logic ---
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">System Traceability Dashboard</h1>
          {/* ... (auto-refresh and refresh now buttons) */}
        </div>
        {stats && (
          <div className="grid grid-cols-5 gap-4 mt-4">
            {/* ... (stats cards) */}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        {/* ... (tab buttons) */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* ... (logs table) */}
          </div>
        )}

        {activeTab === 'traces' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Traces List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* ... (traces list rendering) */}
            </div>

            {/* Trace Events */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* ... (trace events rendering, using traceEventsLoading for loading state) */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}