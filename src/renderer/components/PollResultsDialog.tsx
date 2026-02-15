import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, BarChart3, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PollResultsDialogProps {
    campaign: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface PollVote {
    name: string;
    phone: string;
    selected_option: string;
    voted_at: string | null;
}

interface PollSummary {
    poll_question: string;
    poll_options: string;
    total_votes: number;
    total_sent: number;
    voteBreakdown: Array<{ selected_option: string; count: number }>;
}

export function PollResultsDialog({ campaign, open, onOpenChange }: PollResultsDialogProps) {
    const [votes, setVotes] = useState<PollVote[]>([]);
    const [summary, setSummary] = useState<PollSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [serverStats, setServerStats] = useState<any[]>([]);

    useEffect(() => {
        if (open && campaign?.is_poll) {
            loadPollData();
        }
    }, [open, campaign]);

    const loadPollData = async () => {
        setLoading(true);
        try {
            const [votesResult, summaryResult, serverStatsResult] = await Promise.all([
                window.electronAPI.whatsapp.getPollVotes(campaign.id),
                window.electronAPI.whatsapp.getPollSummary(campaign.id),
                window.electronAPI.whatsapp.getPollServerStats(campaign.id)
            ]);

            if (votesResult.success && votesResult.data) {
                setVotes(votesResult.data);
            }

            if (summaryResult.success && summaryResult.data) {
                setSummary(summaryResult.data);
            }

            if (serverStatsResult.success && serverStatsResult.data) {
                setServerStats(serverStatsResult.data);
            }
        } catch (error: any) {
            console.error('Failed to load poll data:', error);
            toast.error('Failed to load poll results');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const result = await window.electronAPI.whatsapp.exportPollExcel(campaign.id);
            if (result.success && result.data) {
                toast.success(`Exported to ${result.data.filePath}`);
            } else {
                toast.error(result.error || 'Export failed');
            }
        } catch (error: any) {
            toast.error('Failed to export poll results');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl">
                    <div className="flex items-center justify-center py-16">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!summary) {
        return null;
    }

    const pollOptions = JSON.parse(summary.poll_options);
    const responseRate = summary.total_sent > 0
        ? ((summary.total_votes / summary.total_sent) * 100).toFixed(1)
        : '0.0';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Poll Results
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Poll Question */}
                    <div className="rounded-lg bg-muted/50 p-4">
                        <h3 className="font-semibold text-lg">{summary.poll_question}</h3>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.total_sent}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Voted</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary.total_votes}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{responseRate}%</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Vote Breakdown */}
                    {summary.voteBreakdown.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-3">Vote Distribution</h3>
                            <div className="space-y-3">
                                {pollOptions.map((option: string, idx: number) => {
                                    const voteData = summary.voteBreakdown.find(vb => vb.selected_option === option);
                                    const count = voteData?.count || 0;
                                    const percentage = summary.total_votes > 0
                                        ? ((count / summary.total_votes) * 100).toFixed(1)
                                        : '0.0';

                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{option}</span>
                                                <span className="text-muted-foreground">{count} votes ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-primary h-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Server Breakdown */}
                {serverStats.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-semibold mb-3">Server Performance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {serverStats.map((stat, idx) => (
                                <Card key={idx}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Server {stat.server_id}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.total_sent}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stat.total_voted} votes ({((stat.total_voted / stat.total_sent) * 100).toFixed(1)}%)
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detailed Votes Table */}
                <div className="mt-6">
                    <h3 className="font-semibold mb-3">Detailed Votes</h3>
                    <div className="rounded-md border max-h-[300px] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Selected Option</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {votes.map((vote, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{vote.name}</TableCell>
                                        <TableCell>{vote.phone}</TableCell>
                                        <TableCell>
                                            {vote.selected_option ? (
                                                <span className="text-green-600 dark:text-green-400">{vote.selected_option}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Not voted</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>


                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button onClick={handleExportExcel} disabled={exporting}>
                        <Download className="mr-2 h-4 w-4" />
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
