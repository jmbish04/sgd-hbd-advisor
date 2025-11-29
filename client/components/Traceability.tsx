import { useState, useEffect } from 'react';

interface Log {
  id: number;
  timestamp: string;
  level: string;
  component: string;
  message: string;
  traceId: string | null;
  metadata: string | null;
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
  metadata: string | null;
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

export default function Traceability() {
  const [activeTab, setActiveTab] = useState<'logs' | 'traces' | 'stats'>('logs');
  const [logs, setLogs] = useState<Log[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/observability/logs?limit=100');
      const { data }: { data: any } = useSWR(
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const fetchTraces = async () => {
    try {
      const response = await fetch('/api/observability/traces?limit=50');
      const { data }: { data: any } = useSWR(
      setTraces(data.traces || []);
    } catch (error) {
      console.error('Failed to fetch traces:', error);
    }
  };

  const fetchTraceEvents = async (traceId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/observability/traces/${traceId}/events`);
      const { data }: { data: any } = useSWR(
      setTraceEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch trace events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/observability/stats');
      const { data }: { data: any } = useSWR(
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTraces();
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(() => {
        if (activeTab === 'logs') fetchLogs();
        else if (activeTab === 'traces') fetchTraces();
        fetchStats();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefresh]);

  useEffect(() => {
    if (selectedTrace) {
      fetchTraceEvents(selectedTrace);
    }
  }, [selectedTrace]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-500';
      case 'info': return 'text-blue-600';
      case 'warn': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'fatal': return 'text-red-800 font-bold';
      default: return 'text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const parseJSON = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">System Traceability Dashboard</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (5s)
            </label>
            <button
              onClick={() => {
                fetchLogs();
                fetchTraces();
                fetchStats();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Logs</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalLogs}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Traces</div>
              <div className="text-2xl font-bold text-green-600">{stats.totalTraces}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Events</div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalEvents}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Error Logs</div>
              <div className="text-2xl font-bold text-red-600">{stats.errorLogs}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Error Traces</div>
              <div className="text-2xl font-bold text-orange-600">{stats.errorTraces}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab('traces')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'traces'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Traces
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trace ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{log.component}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">{log.message}</td>
                    <td className="px-4 py-3 text-sm">
                      {log.traceId ? (
                        <button
                          onClick={() => {
                            setSelectedTrace(log.traceId);
                            setActiveTab('traces');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                        >
                          {log.traceId}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'traces' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Traces List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-800">Traces</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {traces.map((trace) => (
                  <div
                    key={trace.id}
                    onClick={() => setSelectedTrace(trace.traceId)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedTrace === trace.traceId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{trace.name}</div>
                        <div className="text-sm text-gray-600 mt-1">Component: {trace.component}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{trace.traceId}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trace.status)}`}>
                        {trace.status}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>Started: {new Date(trace.startTime).toLocaleTimeString()}</span>
                      {trace.duration && <span>Duration: {formatDuration(trace.duration)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trace Events */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-800">
                  {selectedTrace ? `Events for ${selectedTrace}` : 'Select a trace to view events'}
                </h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading events...</div>
                ) : traceEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No events found</div>
                ) : (
                  traceEvents.map((event) => {
                    const data = parseJSON(event.data);
                    return (
                      <div key={event.id} className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${getLevelColor(event.level)}`}>
                              {event.action}
                            </div>
                            <div className="text-sm text-gray-700 mt-1">{event.message}</div>
                            {event.codeLocation && (
                              <div className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 px-2 py-1 rounded inline-block">
                                {event.codeLocation}
                              </div>
                            )}
                            {data && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                                  View Data
                                </summary>
                                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                  {JSON.stringify(data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 ml-2">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
