import { useState, useEffect } from 'react';
import { Terminal, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { LogEntry } from '../types/electron';

const getLogColor = (level: string) => {
  switch (level) {
    case 'error':
      return 'text-red-500';
    case 'warn':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    case 'debug':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
};

const getLogBadgeVariant = (level: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (level) {
    case 'error':
      return 'destructive';
    case 'warn':
      return 'outline';
    case 'info':
      return 'default';
    default:
      return 'secondary';
  }
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const downloadLogsAsJSON = (logs: LogEntry[]) => {
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `logs-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function Console() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.console.getLogs();
      if (result.success && result.data) {
        setLogs(result.data as any as LogEntry[]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

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

  const handleClearLogs = async () => {
    try {
      const result = await window.electronAPI.console.clearLogs();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Logs cleared successfully',
        });
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear logs',
        variant: 'destructive',
      });
    }
  };

  const handleExportLogs = async () => {
    try {
      const result = await window.electronAPI.console.exportLogs();
      if (result.success && result.data) {
        downloadLogsAsJSON(result.data as any as LogEntry[]);
        toast({
          title: 'Success',
          description: 'Logs exported successfully',
        });
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to export logs',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: logs.length,
    error: logs.filter((l) => l.level === 'error').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    info: logs.filter((l) => l.level === 'info').length,
    debug: logs.filter((l) => l.level === 'debug').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Console</h1>
          <p className="mt-2 text-muted-foreground">Monitor system logs and campaign activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={handleClearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            System Logs
          </CardTitle>
          <CardDescription>Real-time logs from campaign execution and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md border bg-slate-950 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No logs available
              </div>
            ) : (
              <div className="space-y-2 font-mono text-sm">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <span className="text-muted-foreground">[{formatTimestamp(log.timestamp)}]</span>
                    <Badge variant={getLogBadgeVariant(log.level)} className="min-w-[70px] justify-center">
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.category}
                    </Badge>
                    <span className={getLogColor(log.level)}>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-4 grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{stats.info}</p>
                  <p className="text-sm text-muted-foreground">Info</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{stats.warn}</p>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.error}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{stats.debug}</p>
                  <p className="text-sm text-muted-foreground">Debug</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
