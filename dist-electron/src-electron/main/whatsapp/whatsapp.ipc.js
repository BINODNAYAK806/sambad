"use strict";
/**
 * WhatsApp IPC Handlers
 *
 * Registers IPC handlers for renderer communication.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWhatsAppHandlers = registerWhatsAppHandlers;
exports.updateWhatsAppMainWindow = updateWhatsAppMainWindow;
// Robust Electron import for CommonJS
const { ipcMain, BrowserWindow, app } = require('electron');
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const WhatsAppClient_1 = require("./WhatsAppClient");
const index_1 = require("../db/index");
const XLSX = __importStar(require("xlsx"));
function registerWhatsAppHandlers(mainWindow) {
    console.log('[WhatsApp IPC] ========== REGISTERING HANDLERS ==========');
    // Set main window reference
    if (mainWindow) {
        WhatsAppClient_1.whatsAppClient.setMainWindow(mainWindow);
        console.log('[WhatsApp IPC] MainWindow reference set');
    }
    // Connect/Initialize
    ipcMain.handle('whatsapp:connect', async (_event, serverId = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Connect requested`);
            await WhatsAppClient_1.whatsAppClient.initialize(serverId);
            return { success: true };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Connect failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Disconnect
    ipcMain.handle('whatsapp:disconnect', async (_event, serverId = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Disconnect requested`);
            await WhatsAppClient_1.whatsAppClient.disconnect(serverId);
            return { success: true };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Disconnect failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Logout
    ipcMain.handle('whatsapp:logout', async (_event, serverId = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Logout requested`);
            await WhatsAppClient_1.whatsAppClient.logout(serverId);
            return { success: true };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Logout failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Get Status
    ipcMain.handle('whatsapp:status', async (_event, serverId = 1) => {
        const status = WhatsAppClient_1.whatsAppClient.getStatus(serverId);
        return {
            success: true,
            isConnected: status.isReady,
            data: {
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
        const statuses = WhatsAppClient_1.whatsAppClient.getAllStatuses();
        return { success: true, statuses };
    });
    // Send Message (for campaigns)
    ipcMain.handle('whatsapp:send', async (_event, serverId, chatId, content, options) => {
        try {
            const result = await WhatsAppClient_1.whatsAppClient.sendMessage(serverId, chatId, content, options);
            return { success: true, messageId: result?.id };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Send failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Send Poll
    ipcMain.handle('whatsapp:send-poll', async (_event, serverId, chatId, question, options) => {
        try {
            const result = await WhatsAppClient_1.whatsAppClient.sendPoll(serverId, chatId, question, options);
            return { success: true, messageId: result?.id };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Send poll failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Get Poll Votes
    ipcMain.handle('whatsapp:get-poll-votes', async (_event, campaignId) => {
        try {
            return (0, index_1.getPollVotes)(campaignId);
        }
        catch (error) {
            console.error('[WhatsApp IPC] Get poll votes failed:', error);
            return { success: false, error: error.message };
        }
    });
    // Get Poll Summary
    ipcMain.handle('whatsapp:get-poll-summary', async (_event, campaignId) => {
        try {
            return (0, index_1.getPollSummary)(campaignId);
        }
        catch (error) {
            console.error('[WhatsApp IPC] Get poll summary failed:', error);
            return { success: false, error: error.message };
        }
    });
    // Get Poll Server Stats
    ipcMain.handle('whatsapp:get-poll-server-stats', async (_event, campaignId) => {
        try {
            return (0, index_1.getPollServerStats)(campaignId);
        }
        catch (error) {
            console.error('[WhatsApp IPC] Get poll server stats failed:', error);
            return { success: false, error: error.message };
        }
    });
    // Export polls to Excel
    ipcMain.handle('whatsapp:export-poll-excel', async (_event, campaignId) => {
        try {
            const votesResult = (0, index_1.getPollVotes)(campaignId);
            const summaryResult = (0, index_1.getPollSummary)(campaignId);
            if (!votesResult.success || !votesResult.data || !summaryResult.success || !summaryResult.data) {
                return { success: false, error: 'Failed to get poll data' };
            }
            const workbook = XLSX.utils.book_new();
            const votesSheet = XLSX.utils.json_to_sheet(votesResult.data.map((v) => ({
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
                ...summary.voteBreakdown.map((vb) => ({
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
        }
        catch (error) {
            console.error('[WhatsApp IPC] Export poll Excel failed:', error);
            return { success: false, error: error.message };
        }
    });
    // Clear Session (delete auth folder)
    ipcMain.handle('whatsapp:clearSession', async (_event, serverId = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Clear session requested`);
            // First disconnect if connected
            await WhatsAppClient_1.whatsAppClient.disconnect(serverId);
            // Delete the auth folder
            const authPath = path.join(app.getPath('userData'), `.baileys_auth_server_${serverId}`);
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log(`[WhatsApp IPC] [Server ${serverId}] Deleted auth folder`);
            }
            else {
                console.log(`[WhatsApp IPC] [Server ${serverId}] Auth folder does not exist`);
            }
            return { success: true, message: 'Session cleared successfully' };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Clear session failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Get All Contacts
    ipcMain.handle('whatsapp:get-contacts', async (_event, serverId = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Get contacts requested`);
            const contacts = await WhatsAppClient_1.whatsAppClient.getAllContacts(serverId);
            return { success: true, data: contacts };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Get contacts failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Get All Groups
    ipcMain.handle('whatsapp:get-groups', async (_event, serverId = 1) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Get groups requested`);
            const groups = await WhatsAppClient_1.whatsAppClient.getAllGroups(serverId);
            return { success: true, data: groups };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Get groups failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Get Detailed Group Participants (with real phone numbers)
    ipcMain.handle('whatsapp:get-group-participants', async (_event, serverId, groupJid) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Get group participants requested for:`, groupJid);
            const participants = await WhatsAppClient_1.whatsAppClient.getGroupParticipantsDetailed(serverId, groupJid);
            return { success: true, data: participants };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Get group participants failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Import Contacts (Bulk Insert)
    ipcMain.handle('whatsapp:import-contacts', async (_event, serverId, contacts) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Import contacts requested: ${contacts.length} contacts`);
            const { storageService } = await Promise.resolve().then(() => __importStar(require('../storageService')));
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
                if (result)
                    successCount++;
                else
                    failureCount++;
            }
            return {
                success: true,
                message: `Imported ${successCount} contacts. Failed: ${failureCount}`,
                stats: { success: successCount, failure: failureCount }
            };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Import contacts failed:`, error);
            return { success: false, error: error.message };
        }
    });
    // Import Group (Create group + Add participants as contacts + Link)
    ipcMain.handle('whatsapp:import-group', async (_event, serverId, group) => {
        try {
            console.log(`[WhatsApp IPC] [Server ${serverId}] Import group requested: ${group.subject}`);
            const { storageService } = await Promise.resolve().then(() => __importStar(require('../storageService')));
            // 1. Fetch detailed participants
            const participants = await WhatsAppClient_1.whatsAppClient.getGroupParticipantsDetailed(serverId, group.id);
            if (!participants || participants.length === 0) {
                return { success: false, error: 'No participants found in group' };
            }
            // 2. Create or find group in local DB
            const appGroups = await storageService.getGroups();
            let appGroup = appGroups.find(g => g.name === group.subject);
            if (!appGroup) {
                appGroup = await storageService.createGroup({ name: group.subject });
                console.log(`[WhatsApp IPC] [Server ${serverId}] Created new group in App: ${group.subject} (ID: ${appGroup.id})`);
            }
            else {
                console.log(`[WhatsApp IPC] [Server ${serverId}] Using existing group in App: ${group.subject} (ID: ${appGroup.id})`);
            }
            // 3. Pre-fetch existing contacts for fast lookup
            const existingContacts = await storageService.getContacts();
            const contactMap = new Map();
            existingContacts.forEach(c => contactMap.set(c.phone, c.id));
            // 4. Import contacts and link to group
            let successCount = 0;
            let failureCount = 0;
            const { getDatabase, groups: dbGroups } = await Promise.resolve().then(() => __importStar(require('../db/index')));
            getDatabase();
            for (const p of participants) {
                const jid = p.jid || p.id;
                if (!jid || !jid.endsWith('@s.whatsapp.net'))
                    continue;
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
                    }
                    catch (err) {
                        console.error(`[WhatsApp IPC] [Server ${serverId}] Failed to create contact ${phone}:`, err);
                        failureCount++;
                        continue;
                    }
                }
                if (contactId && appGroup.id) {
                    try {
                        dbGroups.addContact(appGroup.id, contactId);
                        successCount++;
                    }
                    catch (err) {
                        // ignore if already linked
                        successCount++;
                    }
                }
                else {
                    failureCount++;
                }
            }
            return {
                success: true,
                message: `Imported ${successCount} contacts to group "${group.subject}".`,
                stats: { success: successCount, failure: failureCount }
            };
        }
        catch (error) {
            console.error(`[WhatsApp IPC] [Server ${serverId}] Group import failed:`, error);
            return { success: false, error: error.message };
        }
    });
    console.log('[WhatsApp IPC] All handlers registered');
}
function updateWhatsAppMainWindow(mainWindow) {
    WhatsAppClient_1.whatsAppClient.setMainWindow(mainWindow);
}
//# sourceMappingURL=whatsapp.ipc.js.map