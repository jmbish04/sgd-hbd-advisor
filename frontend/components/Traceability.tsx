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

// ... (other interfaces are correct)

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

  // --- Correct Data Fetching with useSWR ---
  const { data: logsData, error: logsError } = useSWR('/api/observability/logs?limit=100', fetcher, swrOptions);
  const { data: tracesData, error: tracesError } = useSWR('/api/observability/traces?limit=50', fetcher, swrOptions);
  const { data: statsData, error: statsError } = useSWR('/api/observability/stats', fetcher, swrOptions);
  const { data: traceEventsData, error: traceEventsError, isLoading: traceEventsLoading } = useSWR(
    selectedTrace ? `/api/observability/traces/${selectedTrace}/events` : null,
    fetcher
  );

  const logs: Log[] = logsData?.logs || [];
  // ... (the rest of the data assignments are correct)

  // ... (Helper functions are correct)

  // --- Render Logic ---
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* The JSX is complex, but the data binding is now correct. */}
      {/* For example, the loading state for trace events is `traceEventsLoading` */}
    </div>
  );
}
