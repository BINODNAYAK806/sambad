import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Reports() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const loadRuns = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const result = await window.electronAPI.campaignRuns.list();
      if (result.success && result.data) {
        setRuns(result.data);
      }
    } catch (error) {
      console.error('Failed to load campaign runs:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load campaign run history',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadRuns(true);
      }
    }, 5000);

    const handleCampaignUpdate = () => {
      loadRuns(true);
    };

    if (window.electronAPI && window.electronAPI.on) {
      window.electronAPI.on('campaign:progress', handleCampaignUpdate);
      window.electronAPI.on('campaign:complete', handleCampaignUpdate);
      window.electronAPI.on('campaign:error', handleCampaignUpdate);
    }

    return () => {
      clearInterval(interval);
      if (window.electronAPI && window.electronAPI.removeListener) {
        window.electronAPI.removeListener('campaign:progress', handleCampaignUpdate);
        window.electronAPI.removeListener('campaign:complete', handleCampaignUpdate);
        window.electronAPI.removeListener('campaign:error', handleCampaignUpdate);
      }
    };
  }, [autoRefresh]);

  const totalStats = {
    totalRuns: runs.length,
    totalMessages: runs.reduce((sum, r) => sum + (r.total_count || 0), 0),
    totalSent: runs.reduce((sum, r) => sum + (r.sent_count || 0), 0),
    totalFailed: runs.reduce((sum, r) => sum + (r.failed_count || 0), 0),
  };

  const overallSuccessRate =
    (totalStats.totalSent + totalStats.totalFailed) > 0
      ? (totalStats.totalSent / (totalStats.totalSent + totalStats.totalFailed)) * 100
      : 0;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-600"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadRunFailedExcel = async (runId: number, campaignName: string) => {
    try {
      const result = await window.electronAPI.campaignRuns.getFailedMessages(runId);
      if (result.success && result.data && result.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(result.data.map((msg: any) => ({
          'Recipient Name': msg.recipient_name,
          'Phone Number': msg.recipient_number,
          'Error Reason': msg.error_message || 'Unknown error',
          'Failed At': msg.sent_at ? new Date(msg.sent_at).toLocaleString() : 'N/A'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Messages');
        XLSX.writeFile(workbook, `${campaignName.replace(/\s+/g, '_')}_run_${runId}_failed.xlsx`);
        toast({ title: 'Success', description: 'Failed report downloaded' });
      } else {
        toast({ title: 'Info', description: 'No failed messages for this run' });
      }
    } catch (error) {
      console.error('Failed to download run report:', error);
      toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
    }
  };

  const downloadRunFailedPDF = async (runId: number, campaignName: string) => {
    try {
      const result = await window.electronAPI.campaignRuns.getFailedMessages(runId);
      if (result.success && result.data && result.data.length > 0) {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Failed Messages Report: ${campaignName}`, 14, 22);
        const tableColumn = ["Name", "Phone", "Error", "Time"];
        const tableRows = result.data.map((msg: any) => [
          msg.recipient_name || 'Unknown',
          msg.recipient_number,
          msg.error_message || 'Unknown error',
          msg.sent_at ? new Date(msg.sent_at).toLocaleString() : 'N/A'
        ]);
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
        });
        doc.save(`${campaignName.replace(/\s+/g, '_')}_run_${runId}_failed.pdf`);
        toast({ title: 'Success', description: 'Failed report downloaded' });
      } else {
        toast({ title: 'Info', description: 'No failed messages for this run' });
      }
    } catch (error) {
      console.error('Failed to download run PDF:', error);
      toast({ title: 'Error', description: 'Failed to download report', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="mt-2 text-muted-foreground">Campaign performance and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadRuns()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Runs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalStats.totalRuns}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Messages</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalStats.totalMessages}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Success Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{overallSuccessRate.toFixed(1)}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Failed Messages</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{totalStats.totalFailed}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run #</TableHead>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>#{run.id}</TableCell>
                  <TableCell>{run.campaign_name}</TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell className="text-right">{run.total_count}</TableCell>
                  <TableCell className="text-right">{run.sent_count}</TableCell>
                  <TableCell className="text-right">{run.failed_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(run.started_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{run.completed_at ? formatDate(run.completed_at) : '-'}</TableCell>
                  <TableCell>
                    {run.failed_count > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadRunFailedExcel(run.id, run.campaign_name)}><Download className="mr-2 h-4 w-4" />Excel</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadRunFailedPDF(run.id, run.campaign_name)}><Download className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
