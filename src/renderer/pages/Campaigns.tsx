import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  ImageIcon,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  X,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CampaignDialog } from '../components/CampaignDialog';
import { CampaignRunner } from '../components/CampaignRunner';
import { PollResultsDialog } from '../components/PollResultsDialog';
import type { Campaign } from '../types/electron';
import { toast } from 'sonner';

export const Campaigns = React.memo(() => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [runningCampaign, setRunningCampaign] = useState<Campaign | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | undefined>(undefined);
  const [pollResultsOpen, setPollResultsOpen] = useState(false);
  const [pollResultsCampaign, setPollResultsCampaign] = useState<Campaign | undefined>(undefined);
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';

  useEffect(() => {
    loadCampaigns();

    const handleCampaignComplete = (data: any) => {
      console.log('[Campaigns Page] Campaign complete received:', data);
      setCampaigns(prev => prev.map(c => {
        if (data && (String(data.id) === String(c.id) || String(data.campaignId) === String(c.id))) {
          return {
            ...c,
            status: 'completed',
            sent_count: data.sentCount || c.sent_count,
            failed_count: data.failedCount || c.failed_count,
            total_count: data.totalContacts || data.totalMessages || c.total_count
          };
        }
        return c;
      }));
      loadCampaigns();
    };

    const handleCampaignError = () => {
      loadCampaigns();
    };

    const handleCampaignStopped = () => {
      loadCampaigns();
    };

    const handleCampaignProgress = (_event: any, data: any) => {
      setCampaigns(prev => prev.map(c => {
        if (String(c.id) === String(data.campaignId)) {
          return {
            ...c,
            status: c.status === 'paused' ? 'paused' : 'running',
            sent_count: data.sentCount || data.processedContacts || 0,
            failed_count: data.failedCount || 0,
            total_count: data.totalMessages || data.totalContacts || c.total_count
          };
        }
        return c;
      }));
    };

    const handleCampaignPaused = (_event: any, data: any) => {
      setCampaigns(prev => prev.map(c => {
        // If data includes campaignId, use it; otherwise, we might need a better way to track "active" campaign on this page
        if (data && data.campaignId && String(c.id) === String(data.campaignId)) {
          return { ...c, status: 'paused' };
        }
        // Fallback: If status is running, set to paused (assuming one campaign at a time)
        if (c.status === 'running') {
          return { ...c, status: 'paused' };
        }
        return c;
      }));
    };

    const handleCampaignResumed = (_event: any, data: any) => {
      setCampaigns(prev => prev.map(c => {
        if (data && data.campaignId && String(c.id) === String(data.campaignId)) {
          return { ...c, status: 'running' };
        }
        if (c.status === 'paused') {
          return { ...c, status: 'running' };
        }
        return c;
      }));
    };

    if (window.electronAPI && window.electronAPI.on) {
      const onCompleteWrapper = (_event: any, data: any) => handleCampaignComplete(data);
      const onProgressWrapper = (_event: any, data: any) => handleCampaignProgress(_event, data);

      window.electronAPI.on('campaign:complete', onCompleteWrapper);
      window.electronAPI.on('campaign:error', handleCampaignError);
      window.electronAPI.on('campaign:stopped', handleCampaignStopped);
      window.electronAPI.on('campaign:paused', handleCampaignPaused);
      window.electronAPI.on('campaign:resumed', handleCampaignResumed);
      window.electronAPI.on('campaign:progress', onProgressWrapper);

      return () => {
        if (window.electronAPI && window.electronAPI.removeListener) {
          window.electronAPI.removeListener('campaign:complete', onCompleteWrapper);
          window.electronAPI.removeListener('campaign:error', handleCampaignError);
          window.electronAPI.removeListener('campaign:stopped', handleCampaignStopped);
          window.electronAPI.removeListener('campaign:paused', handleCampaignPaused);
          window.electronAPI.removeListener('campaign:resumed', handleCampaignResumed);
          window.electronAPI.removeListener('campaign:progress', onProgressWrapper);
        }
      };
    }
  }, []);

  const loadCampaigns = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const result = await window.electronAPI.campaigns.list();
      if (result.success && result.data) {
        setCampaigns(result.data);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadCampaigns(true);
      toast.success('Campaigns refreshed');
    } catch (error) {
      // Error handled in loadCampaigns
    } finally {
      setIsRefreshing(false);
    }
  };




  const getFailedMessages = async (campaignId: number): Promise<any[]> => {
    try {
      const result = await window.electronAPI.campaigns.getFailedMessages(campaignId);
      if (result.success && result.data) return result.data;
      throw new Error(result.error || 'No data found');
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to fetch report data');
      return [];
    }
  };

  const handleExportExcel = async (campaign: Campaign) => {
    try {
      if (!campaign.id) return;
      toast.info('Generating Excel report...');
      const messages = await getFailedMessages(campaign.id);
      if (messages.length === 0) return;

      const worksheet = XLSX.utils.json_to_sheet(messages.map((msg: any) => ({
        'Recipient Name': msg.recipient_name,
        'Phone Number': msg.recipient_number,
        'Error Message': msg.error_message,
        'Time': msg.updated_at ? new Date(msg.updated_at).toLocaleString() : 'N/A'
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Messages');
      XLSX.writeFile(workbook, `failure_report_${campaign.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
      toast.success('Excel report downloaded');
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPDF = async (campaign: Campaign) => {
    try {
      if (!campaign.id) return;
      toast.info('Generating PDF report...');
      const messages = await getFailedMessages(campaign.id);
      if (messages.length === 0) return;

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Failure Report: ${campaign.name}`, 14, 22);

      const tableColumn = ["Name", "Phone", "Error", "Time"];
      const tableRows = messages.map((msg: any) => [
        msg.recipient_name || 'Unknown',
        msg.recipient_number,
        msg.error_message || 'Unknown',
        msg.updated_at ? new Date(msg.updated_at).toLocaleString() : 'N/A'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8 },
        columnStyles: { 2: { cellWidth: 80 } } // Give more width to Error column
      });

      doc.save(`failure_report_${campaign.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      toast.success('PDF report downloaded');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleCreate = () => {
    setEditingCampaign(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setDialogOpen(true);
  };

  const handleRun = async (campaign: Campaign) => {
    try {
      const statusResult = await window.electronAPI.campaign.status();
      if (!statusResult.success || !statusResult.data?.ready) {
        toast.error('WhatsApp not ready', {
          description: 'Please wait for WhatsApp to initialize or scan the QR code in the Dashboard.',
        });
        return;
      }
      setRunningCampaign(campaign);
      setRunnerOpen(true);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
      setRunningCampaign(campaign);
      setRunnerOpen(true);
    }
  };

  const handleDeleteClick = (campaignId: number) => {
    setDeletingCampaignId(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCampaignId) return;
    try {
      const result = await window.electronAPI.campaigns.delete(deletingCampaignId);
      if (result.success) {
        toast.success('Campaign deleted successfully');
        await loadCampaigns();
      } else {
        toast.error(result.error || 'Failed to delete campaign');
      }
    } catch (error: any) {
      console.error('Failed to delete campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingCampaignId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { variant: 'outline' as const, className: 'bg-gray-50 text-gray-700', icon: FileText, label: 'Draft' },
      ready: { variant: 'outline' as const, className: 'bg-blue-50 text-blue-700', icon: CheckCircle2, label: 'Ready' },
      running: { variant: 'default' as const, className: 'bg-blue-600', icon: Loader2, label: 'Running', animate: true },
      paused: { variant: 'outline' as const, className: 'bg-orange-50 text-orange-700', icon: Clock, label: 'Paused' },
      completed: { variant: 'outline' as const, className: 'bg-green-50 text-green-700', icon: CheckCircle2, label: 'Completed' },
      stopped: { variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-700', icon: XCircle, label: 'Stopped' },
      failed: { variant: 'destructive' as const, className: '', icon: AlertCircle, label: 'Failed' },
    };

    const config = badges[status as keyof typeof badges] || {
      variant: 'outline' as const,
      className: 'text-gray-600',
      icon: FileText,
      label: status,
    };

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className={`mr-1 h-3 w-3 ${'animate' in config && config.animate ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const handlePreview = (campaign: Campaign) => {
    setPreviewCampaign(campaign);
    setPreviewOpen(true);
  };

  const getPreviewMessage = (message: string | undefined) => {
    if (!message) return '';
    return message
      .replace(/\{\{\s*name\s*\}\}/gi, 'Rahul')
      .replace(/\{\{\s*phone\s*\}\}/gi, '9876543210')
      .replace(/\{\{\s*email\s*\}\}/gi, 'rahul@example.com')
      .replace(/\{\{\s*company\s*\}\}/gi, 'ABC Corp')
      .replace(/\{\{\s*date\s*\}\}/gi, new Date().toLocaleDateString())
      .replace(/\{\{[^}]+\}\}/g, 'Sample');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">Campaigns</span>
          </h1>
          <p className="text-lg text-muted-foreground">Create and manage your WhatsApp campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="rounded-md border shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b">
              <TableHead className="w-[220px] font-semibold">Campaign</TableHead>
              <TableHead className="w-[140px] font-semibold">Delivery Status</TableHead>
              <TableHead className="w-[140px] font-semibold">Result</TableHead>
              <TableHead className="w-[140px] font-semibold">Created</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading campaigns...
                  </div>
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Sparkles className="h-8 w-8 text-muted" />
                    <p className="font-medium">No campaigns found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => {
                const sent = campaign.sent_count || 0;
                const failed = campaign.failed_count || 0;
                const createdDate = campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A';

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{campaign.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-emerald-600">{sent} Sent</span>
                        {failed > 0 && <span className="text-sm font-bold text-rose-600">{failed} Failed</span>}
                      </div>
                    </TableCell>
                    <TableCell>{createdDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(campaign)} title="Preview Message">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.is_poll && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPollResultsCampaign(campaign);
                              setPollResultsOpen(true);
                            }}
                            title="View Poll Results"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant={campaign.status === 'running' ? 'secondary' : 'default'} size="sm" onClick={() => handleRun(campaign)} title="Run Campaign">
                          {campaign.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                        {(campaign.failed_count || 0) > 0 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="Download Report">
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExportExcel(campaign)}>
                                Export as Excel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportPDF(campaign)}>
                                Export as PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" disabled title="No failed messages">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(campaign)} title="Edit Campaign">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!isStaff && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(campaign.id as number)} title="Delete Campaign">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleRefresh} campaign={editingCampaign} />
      <CampaignRunner open={runnerOpen} onOpenChange={setRunnerOpen} campaign={runningCampaign} onComplete={loadCampaigns} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this campaign?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-[#e5ddd5]">
          <div className="flex flex-col h-[600px]">
            <div className="bg-[#075e54] p-3 text-white flex items-center justify-between">
              <span className="font-semibold">{previewCampaign?.name || 'Preview'}</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)} className="text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {previewCampaign?.template_image_path && (
                <div className="bg-white p-1 rounded-lg self-start max-w-[85%]">
                  <div className="aspect-square bg-slate-100 rounded flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  </div>
                </div>
              )}
              <div className="bg-white p-3 rounded-lg self-start max-w-[90%] relative shadow-sm">
                <div className="text-[13px] whitespace-pre-wrap">{getPreviewMessage(previewCampaign?.message_template || previewCampaign?.message)}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Poll Results Dialog */}
      <PollResultsDialog
        campaign={pollResultsCampaign}
        open={pollResultsOpen}
        onOpenChange={setPollResultsOpen}
      />
    </div>
  );
});
