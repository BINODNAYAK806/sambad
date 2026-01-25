import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    AlertCircle,
    FileSpreadsheet,
    FileText,
    File
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Campaign } from '../types/electron';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CampaignSummaryTableProps {
    campaigns: Campaign[];
}

export function CampaignSummaryTable({ campaigns }: CampaignSummaryTableProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return <Badge className="bg-blue-600 gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Running</Badge>;
            case 'completed':
                return <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Failed</Badge>;
            case 'stopped':
                return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600"><XCircle className="h-3 w-3" /> Stopped</Badge>;
            default:
                return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> {status}</Badge>;
        }
    };

    const fetchFailedMessages = async (campaignId: number) => {
        const result = await window.electronAPI.campaigns.getFailedMessages(campaignId);
        if (result.success && result.data && result.data.length > 0) {
            console.log('Fetched failed messages:', result.data.length);
            return result.data;
        } else {
            // Fallback or empty
            console.warn('No failed messages via new API, trying CSV export path for error handling?');
            // Actually if new API returns empty, we can't export.
            return [];
        }
    };

    const getExportFilename = (campaignName: string, ext: string) => {
        const safeName = campaignName.replace(/[^a-z0-9]/gi, '_');
        const date = new Date().toISOString().split('T')[0];
        return `Failure_Report_${safeName}_${date}.${ext}`;
    };

    const handleDownloadExcel = async (campaign: Campaign) => {
        try {
            const data = await fetchFailedMessages(campaign.id);
            if (data.length === 0) {
                toast.error('No failed messages found to export.');
                return;
            }

            const exportData = data.map((msg: any) => ({
                'Recipient Name': msg.recipient_name || 'Unknown',
                'Mobile Number': msg.recipient_number,
                'Error Reason': msg.error_message || 'Unknown error',
                'Time': new Date(msg.updated_at).toLocaleString()
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Failed Messages");
            XLSX.writeFile(wb, getExportFilename(campaign.name, 'xlsx'));
            toast.success('Excel report downloaded successfully');
        } catch (error) {
            console.error('Excel export failed:', error);
            toast.error('Failed to export Excel report');
        }
    };

    const handleDownloadPdf = async (campaign: Campaign) => {
        try {
            const data = await fetchFailedMessages(campaign.id);
            if (data.length === 0) {
                toast.error('No failed messages found to export.');
                return;
            }

            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text("Campaign Failure Report", 14, 20);

            doc.setFontSize(12);
            doc.text(`Campaign: ${campaign.name}`, 14, 30);
            doc.text(`Date: ${new Date().toLocaleString()}`, 14, 38);
            doc.text(`Total Failures: ${data.length}`, 14, 46);

            const tableData = data.map((msg: any) => [
                msg.recipient_name || 'Unknown',
                msg.recipient_number,
                msg.error_message || 'Unknown',
                new Date(msg.updated_at).toLocaleTimeString()
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Name', 'Mobile', 'Error Reason', 'Time']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] }, // Red for failure
            });

            doc.save(getExportFilename(campaign.name, 'pdf'));
            toast.success('PDF report downloaded successfully');
        } catch (error) {
            console.error('PDF export failed:', error);
            toast.error('Failed to export PDF report');
        }
    };

    const handleDownloadCsv = async (campaign: Campaign) => {
        try {
            const result = await window.electronAPI.campaigns.exportFailureReport(campaign.id, campaign.name);
            if (result.success) {
                toast.success(result.message || 'CSV saved successfully');
            } else {
                toast.error(result.error || 'Failed to save CSV');
            }
        } catch (error: any) {
            console.error('CSV export failed:', error);
            toast.error('Failed to export CSV');
        }
    };

    // Sort campaigns by ID descending (newest first)
    const sortedCampaigns = [...campaigns].sort((a, b) => b.id - a.id);

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Campaign Summary</h2>
                <p className="text-sm text-muted-foreground">
                    Detailed performance metrics for each campaign
                </p>
            </div>

            <div className="rounded-md border shadow-sm bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Campaign Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total Messages</TableHead>
                            <TableHead className="text-right text-green-600">Sent</TableHead>
                            <TableHead className="text-right text-red-600">Failed</TableHead>
                            <TableHead className="text-right text-blue-600">Pending</TableHead>
                            <TableHead className="text-right">Success Rate</TableHead>
                            <TableHead className="text-right">Completed At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedCampaigns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No campaigns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedCampaigns.map((campaign) => {
                                const total = campaign.total_count || 0;
                                const sent = campaign.sent_count || 0;
                                const failed = campaign.failed_count || 0;
                                const pending = total - sent - failed;
                                const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
                                const completedAt = campaign.completed_at
                                    ? new Date(campaign.completed_at).toLocaleString()
                                    : (campaign.status === 'completed' ? 'Just now' : 'N/A');

                                return (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>{getStatusBadge(campaign.status || 'draft')}</TableCell>
                                        <TableCell className="text-right">{total}</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">{sent}</TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">{failed}</TableCell>
                                        <TableCell className="text-right text-blue-600">{Math.max(0, pending)}</TableCell>
                                        <TableCell className="text-right">
                                            {total > 0 ? (
                                                <Badge variant={successRate >= 90 ? 'outline' : 'secondary'} className={successRate >= 90 ? 'text-green-600 border-green-200' : ''}>
                                                    {successRate}%
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {completedAt}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(failed > 0) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                            <span className="sr-only sm:not-sr-only sm:inline-block">Report</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleDownloadExcel(campaign)}>
                                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                            Export to Excel
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadPdf(campaign)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Export to PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadCsv(campaign)}>
                                                            <File className="mr-2 h-4 w-4" />
                                                            Export as CSV
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
