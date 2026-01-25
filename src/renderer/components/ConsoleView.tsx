import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
  Trash2,
  Search,
  Filter,
  Terminal,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  ChevronDown,
} from 'lucide-react';
import type { LogEntry } from '../types/electron';

export default function ConsoleView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogEntry['level'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogEntry['category'] | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const result = await window.electronAPI.console.getLogs();
      if (result.success && result.data) {
        setLogs(result.data as any as LogEntry[]);
      }
    };

    fetchLogs();

    const unsubscribeNewLog = window.electronAPI.console.onNewLog((log) => {
      setLogs((prev) => [...prev, log]);
    });

    const unsubscribeCleared = window.electronAPI.console.onLogsCleared(() => {
      setLogs([]);
    });

    return () => {
      unsubscribeNewLog();
      unsubscribeCleared();
    };
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (levelFilter !== 'all') {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((log) => log.category === categoryFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(term) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, categoryFilter]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const handleClearLogs = async () => {
    await window.electronAPI.console.clearLogs();
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'debug':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getCategoryBadge = (category: LogEntry['category']) => {
    const colors = {
      worker: 'bg-green-100 text-green-700',
      system: 'bg-blue-100 text-blue-700',
      browser: 'bg-purple-100 text-purple-700',
      ipc: 'bg-orange-100 text-orange-700',
      general: 'bg-gray-100 text-gray-700',
    };

    return (
      <Badge variant="outline" className={`${colors[category]} text-xs`}>
        {category}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  const stats = {
    total: logs.length,
    error: logs.filter((l) => l.level === 'error').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    info: logs.filter((l) => l.level === 'info').length,
    debug: logs.filter((l) => l.level === 'debug').length,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Sambad Console</h1>
          </div>
          <Button variant="destructive" size="sm" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Logs
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Levels ({stats.total})</option>
              <option value="error">Error ({stats.error})</option>
              <option value="warn">Warn ({stats.warn})</option>
              <option value="info">Info ({stats.info})</option>
              <option value="debug">Debug ({stats.debug})</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="worker">Worker</option>
              <option value="system">System</option>
              <option value="browser">Browser</option>
              <option value="ipc">IPC</option>
              <option value="general">General</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>

        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="bg-red-50 text-red-700">
            Errors: {stats.error}
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Warnings: {stats.warn}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Info: {stats.info}
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Debug: {stats.debug}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Total: {stats.total}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {filteredLogs.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No logs to display</p>
              <p className="text-sm text-muted-foreground mt-1">
                {logs.length === 0
                  ? 'Logs will appear here as events occur'
                  : 'No logs match your current filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`border rounded-lg p-3 ${getLevelColor(log.level)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getLevelIcon(log.level)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {getCategoryBadge(log.category)}
                      <Badge variant="outline" className="text-xs uppercase">
                        {log.level}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium break-words">{log.message}</p>

                    {log.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-3 w-3" />
                          Show details
                        </summary>
                        <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
