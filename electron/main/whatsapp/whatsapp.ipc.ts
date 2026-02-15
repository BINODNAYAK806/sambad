/**
 * WhatsApp IPC Handlers
 * 
 * Registers IPC handlers for renderer communication.
 */

import { ipcMain, BrowserWindow, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { whatsAppClient } from './WhatsAppClient.js';
import { getPollVotes, getPollSummary, getPollServerStats } from '../db/index.js';
import * as XLSX from 'xlsx';

export function registerWhatsAppHandlers(mainWindow: BrowserWindow | null): void {
    console.log('[WhatsApp IPC] ========== REGISTERING HANDLERS ==========');

    // Set main window reference
    if (mainWindow) {
        whatsAppClient.setMainWindow(mainWindow);
        console.log('[WhatsApp IPC] MainWindow reference set');
    }

    // Connect/Initialize
    ipcMain.handle('whatsapp:connect', async (_event, serverId: number = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Connect requested`);
            await whatsAppClient.initialize(serverId);
            return { success: true };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Connect failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Disconnect
    ipcMain.handle('whatsapp:disconnect', async (_event, serverId: number = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Disconnect requested`);
            await whatsAppClient.disconnect(serverId);
            return { success: true };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Disconnect failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Logout
    ipcMain.handle('whatsapp:logout', async (_event, serverId: number = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Logout requested`);
            await whatsAppClient.logout(serverId);
            return { success: true };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Logout failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Get Status
    ipcMain.handle('whatsapp:status', async (_event, serverId: number = 1) => {
        const status = whatsAppClient.getStatus(serverId);
        return {
            success: true,
            isConnected: status.isReady,
            data: { // Wrap in data property as expected by frontend
                isConnected: status.isReady,
                isInitializing: status.state === 'initializing',
                phoneNumber: status.phoneNumber
            },
            state: status.state,
            error: status.error,
        };
    });

    // Get All Statuses
    ipcMain.handle('whatsapp:status-all', async () => {
        const statuses = whatsAppClient.getAllStatuses();
        return { success: true, statuses };
    });

    // Send Message (for campaigns)
    ipcMain.handle('whatsapp:send', async (_event, serverId: number, chatId: string, content: string, options?: any) => {
        try {
            const result = await whatsAppClient.sendMessage(serverId, chatId, content, options);
            return { success: true, messageId: result?.id };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Send failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Send Poll
    ipcMain.handle('whatsapp:send-poll', async (_event, serverId: number, chatId: string, question: string, options: string[]) => {
        try {
            const result = await whatsAppClient.sendPoll(serverId, chatId, question, options);
            return { success: true, messageId: result?.id };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Send poll failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Get Poll Votes
    ipcMain.handle('whatsapp:get-poll-votes', async (_event, campaignId: number) => {
        try {
            return getPollVotes(campaignId);
        } catch (error: any) {
            console.error('[WhatsApp IPC] Get poll votes failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Poll Summary
    ipcMain.handle('whatsapp:get-poll-summary', async (_event, campaignId: number) => {
        try {
            return getPollSummary(campaignId);
        } catch (error: any) {
            console.error('[WhatsApp IPC] Get poll summary failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Poll Server Stats
    ipcMain.handle('whatsapp:get-poll-server-stats', async (_event, campaignId: number) => {
        try {
            return getPollServerStats(campaignId);
        } catch (error: any) {
            console.error('[WhatsApp IPC] Get poll server stats failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Export polls to Excel
    ipcMain.handle('whatsapp:export-poll-excel', async (_event, campaignId: number) => {
        try {

            const votesResult = getPollVotes(campaignId);
            const summaryResult = getPollSummary(campaignId);

            if (!votesResult.success || !votesResult.data || !summaryResult.success || !summaryResult.data) {
                return { success: false, error: 'Failed to get poll data' };
            }

            const workbook = XLSX.utils.book_new();

            const votesSheet = XLSX.utils.json_to_sheet(votesResult.data.map((v: any) => ({
                'Name': v.name,
                'Phone': v.phone,
                'Selected Option': v.selected_option || ''
            })));
            XLSX.utils.book_append_sheet(workbook, votesSheet, 'Votes');

            const summary = summaryResult.data;
            const summaryData = [
                { 'Metric': 'Poll Question', 'Value': summary.poll_question },
                { 'Metric': 'Total Sent', 'Value': summary.total_sent },
                { 'Metric': 'Total Voted', 'Value': summary.total_votes },
                { 'Metric': 'Response Rate', 'Value': `${((summary.total_votes / summary.total_sent) * 100).toFixed(1)}%` },
                { 'Metric': '', 'Value': '' },
                { 'Metric': 'Vote Breakdown', 'Value': '' },
                ...summary.voteBreakdown.map((vb: any) => ({
                    'Metric': vb.selected_option,
                    'Value': `${vb.count} (${((vb.count / summary.total_votes) * 100).toFixed(1)}%)`
                }))
            ];
            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            const fileName = `poll_results_campaign_${campaignId}_${Date.now()}.xlsx`;
            const filePath = path.join(app.getPath('downloads'), fileName);
            XLSX.writeFile(workbook, filePath);

            return { success: true, data: { filePath } };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Export poll Excel failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Clear Session (delete auth folder)
    ipcMain.handle('whatsapp:clearSession', async (_event, serverId: number = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Clear session requested`);

            // First disconnect if connected
            await whatsAppClient.disconnect(serverId);

            // Delete the auth folder
            const authPath = path.join(app.getPath('userData'), `.baileys_auth_server_${serverId}`);

            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log(`[WhatsApp IPC] [Server ${serverId}] Deleted auth folder`);
            } else {
                console.log(`[WhatsApp IPC] [Server ${serverId}] Auth folder does not exist`);
            }

            return { success: true, message: 'Session cleared successfully' };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Clear session failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Get All Contacts
    ipcMain.handle('whatsapp:get-contacts', async (_event, serverId: number = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Get contacts requested`);
            const contacts = await whatsAppClient.getAllContacts(serverId);
            return { success: true, data: contacts };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Get contacts failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Get All Groups
    ipcMain.handle('whatsapp:get-groups', async (_event, serverId: number = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Get groups requested`);
            const groups = await whatsAppClient.getAllGroups(serverId);
            return { success: true, data: groups };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Get groups failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Get Detailed Group Participants (with real phone numbers)
    ipcMain.handle('whatsapp:get-group-participants', async (_event, serverId: number, groupJid: string) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Get group participants requested for:`, groupJid);
            const participants = await whatsAppClient.getGroupParticipantsDetailed(serverId, groupJid);
            return { success: true, data: participants };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Get group participants failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Import Contacts (Bulk Insert)
    ipcMain.handle('whatsapp:import-contacts', async (_event, serverId: number, contacts: any[]) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Import contacts requested: ${contacts.length} contacts`);
            const { storageService } = await import('../storageService.js');

            let successCount = 0;
            let failureCount = 0;

            for (const contact of contacts) {
                // Ensure number format
                const formattedNumber = contact.id.replace('@s.whatsapp.net', '');

                // Skip if no number
                if (!formattedNumber) {
                    failureCount++;
                    continue;
                }

                const result = await storageService.addContact({
                    name: contact.name || contact.displayName || formattedNumber,
                    company_id: 'default',
                    phone: formattedNumber,
                    phone_number: formattedNumber,
                    country_code: '91',
                    is_valid: true
                });

                if (result) successCount++;
                else failureCount++;
            }

            return {
                success: true,
                message: `Imported ${successCount} contacts. Failed: ${failureCount}`,
                stats: { success: successCount, failure: failureCount }
            };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Import contacts failed:`, error);
            return { success: false, error: error.message };
        }
    });

    // Import Group (Create group + Add participants as contacts + Link)
    ipcMain.handle('whatsapp:import-group', async (_event, serverId: number, group: any) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Import group requested: ${group.subject}`);
            const { storageService } = await import('../storageService.js');

            // 1. Fetch detailed participants
            const participants = await whatsAppClient.getGroupParticipantsDetailed(serverId, group.id);
            if (!participants || participants.length === 0) {
                return { success: false, error: 'No participants found in group' };
            }

            // 2. Create or find group in local DB
            const appGroups = await storageService.getGroups();
            let appGroup = appGroups.find(g => g.name === group.subject);

            if (!appGroup) {
                appGroup = await storageService.createGroup({ name: group.subject });
                console.log(`[WhatsApp IPC] [Server ${serverId}] Created new group in App: ${group.subject} (ID: ${appGroup.id})`);
            } else {
                console.log(`[WhatsApp IPC] [Server ${serverId}] Using existing group in App: ${group.subject} (ID: ${appGroup.id})`);
            }

            // 3. Pre-fetch existing contacts for fast lookup
            const existingContacts = await storageService.getContacts();
            const contactMap = new Map();
            existingContacts.forEach(c => contactMap.set(c.phone, c.id));

            // 4. Import contacts and link to group
            let successCount = 0;
            let failureCount = 0;

            const { getDatabase, groups: dbGroups } = await import('../db/index.js');
            getDatabase();

            for (const p of participants) {
                const jid = p.jid || p.id;
                if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;

                const phone = jid.split('@')[0];
                let contactId = contactMap.get(phone);

                if (!contactId) {
                    try {
                        const contactResult = await storageService.createContact({
                            name: p.name || phone,
                            phone: phone,
                            phone_number: phone,
                            company_id: 'default',
                            country_code: '91',
                            is_valid: true
                        });
                        contactId = contactResult.id;
                        console.log(`[WhatsApp IPC] [Server ${serverId}] Created new contact: ${phone}`);
                    } catch (err) {
                        console.error(`[WhatsApp IPC] [Server ${serverId}] Failed to create contact ${phone}:`, err);
                        failureCount++;
                        continue;
                    }
                }

                if (contactId && appGroup.id) {
                    try {
                        dbGroups.addContact(appGroup.id, contactId);
                        successCount++;
                    } catch (err) {
                        // ignore if already linked
                        successCount++;
                    }
                } else {
                    failureCount++;
                }
            }

            return {
                success: true,
                message: `Imported ${successCount} contacts to group "${group.subject}".`,
                stats: { success: successCount, failure: failureCount }
            };
        } catch (error: any) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Group import failed:`, error);
            return { success: false, error: error.message };
        }
    });

    console.log('[WhatsApp IPC] All handlers registered');
}

export function updateWhatsAppMainWindow(mainWindow: BrowserWindow): void {
    whatsAppClient.setMainWindow(mainWindow);
}
