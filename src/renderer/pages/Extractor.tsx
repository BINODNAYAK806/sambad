
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';


import { toast } from 'sonner';
import {
    Users,
    Download,
    RefreshCw,
    Search,
    UserPlus
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Types
interface ExtractedContact {
    id: string; // JID
    name: string;
    pushname?: string;
}

interface ExtractedGroup {
    id: string;
    subject: string;
    owner: string;
    creation: number;
    desc?: string;
    participants: any[];
}

export const Extractor = () => {
    const [groups, setGroups] = useState<ExtractedGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const result = await window.electronAPI.whatsapp.getGroups();
            if (result.success && result.data) {
                setGroups(result.data);
            } else {
                toast.error(result.error || 'Failed to fetch groups');
            }
        } catch (error: any) {
            toast.error('Error fetching data: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        const data = groups.map(g => ({
            GroupName: g.subject,
            ParticipantsCount: g.participants.length,
            Owner: g.owner ? g.owner.split('@')[0] : '',
            Created: new Date(g.creation * 1000).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Groups');
        XLSX.writeFile(wb, `whatsapp_groups_${new Date().getTime()}.xlsx`);
        toast.success('Download started');
    };

    // Download participants of a specific group
    const handleDownloadGroup = async (group: ExtractedGroup) => {
        setIsLoading(true);
        try {
            // Fetch DETAILED participants directly from WhatsApp
            const participantsResult = await (window.electronAPI.whatsapp as any).getGroupParticipants(group.id);
            let participants = group.participants;
            if (participantsResult.success && participantsResult.data) {
                participants = participantsResult.data;
            }

            // Fetch contacts to get names
            const contactsResult = await window.electronAPI.whatsapp.getContacts();
            const contactsMap: Record<string, string> = {};

            if (contactsResult.success && contactsResult.data) {
                contactsResult.data.forEach((c: ExtractedContact) => {
                    // Map by phone number (without suffix)
                    const phone = c.id.split('@')[0];
                    contactsMap[phone] = c.name || c.pushname || '';
                });
            }

            const data = participants.map((p: any) => {
                // Use phone from detailed API (jid field has real phone)
                const isLid = p.isLinkedDevice || (p.id && p.id.includes('@lid') && !p.jid);
                const phone = p.phone || (p.jid ? p.jid.split('@')[0] : p.id?.split('@')[0]) || '';
                // Look up name from contacts
                const name = contactsMap[phone] || '';
                return {
                    Name: name,
                    Phone: isLid ? '(Encrypted Device)' : phone,
                    IsAdmin: p.admin ? 'Yes' : 'No'
                };
            });

            // Count how many have actual phone numbers
            const withPhone = data.filter(d => !d.Phone.includes('Encrypted')).length;

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, group.subject.substring(0, 31));
            XLSX.writeFile(wb, `group_${group.subject.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.xlsx`);

            if (withPhone < data.length) {
                toast.info(`Downloaded ${data.length} participants. ${data.length - withPhone} have encrypted IDs (no phone available).`);
            } else {
                toast.success(`Downloaded ${data.length} participants with phone numbers`);
            }
        } catch (error: any) {
            toast.error('Failed to export group: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportGroup = async (group: ExtractedGroup) => {
        const confirmed = window.confirm(
            `Import Group Participants\n\nAre you sure you want to import ${group.participants.length} contacts from "${group.subject}"? This will create a group in the app and add all participants.`
        );

        if (!confirmed) return;

        setIsLoading(true);
        try {
            const result = await (window.electronAPI.whatsapp as any).importGroup(group);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error || 'Import failed');
            }
        } catch (error: any) {
            toast.error('Import error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };


    const filteredGroups = groups.filter(g =>
        g.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Group Extractor</h2>
                    <p className="text-muted-foreground">Extract participants and manage groups from WhatsApp</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Groups
                    </Button>
                    <Button variant="outline" onClick={handleDownload} disabled={groups.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Groups Excel
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">WhatsApp Groups</h3>
                    <Badge variant="secondary" className="ml-2">{groups.length}</Badge>
                </div>

                <div className="flex items-center space-x-2 my-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subject</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Participants</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Owner</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {filteredGroups.length > 0 ? (
                                            filteredGroups.slice(0, 100).map((group) => (
                                                <tr key={group.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{group.subject}</td>
                                                    <td className="p-4 align-middle">
                                                        <Badge variant="outline">{group.participants.length}</Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-xs font-mono">{group.owner ? group.owner.split('@')[0] : '-'}</td>
                                                    <td className="p-4 align-middle text-xs text-muted-foreground">
                                                        {new Date(group.creation * 1000).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleImportGroup(group)}
                                                                disabled={isLoading}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <UserPlus className="h-3 w-3" />
                                                                Import to App
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadGroup(group)}
                                                                title="Download Participants Excel"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                    {isLoading ? 'Loading...' : 'No groups found. Try refreshing.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
