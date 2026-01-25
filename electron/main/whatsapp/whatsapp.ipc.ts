/**
 * WhatsApp IPC Handlers
 * 
 * Registers IPC handlers for renderer communication.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { whatsAppClient } from './WhatsAppClient.js';

export function registerWhatsAppHandlers(mainWindow: BrowserWindow | null): void {
    console.log('[WhatsApp IPC] ========== REGISTERING HANDLERS ==========');

    // Set main window reference
    if (mainWindow) {
        whatsAppClient.setMainWindow(mainWindow);
        console.log('[WhatsApp IPC] MainWindow reference set');
    }

    // Connect/Initialize
    ipcMain.handle('whatsapp:connect', async () => {
        try {
            console.log('[WhatsApp IPC] Connect requested');
            await whatsAppClient.initialize();
            return { success: true };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Connect failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Disconnect
    ipcMain.handle('whatsapp:disconnect', async () => {
        try {
            console.log('[WhatsApp IPC] Disconnect requested');
            await whatsAppClient.disconnect();
            return { success: true };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Disconnect failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Logout
    ipcMain.handle('whatsapp:logout', async () => {
        try {
            console.log('[WhatsApp IPC] Logout requested');
            await whatsAppClient.logout();
            return { success: true };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Logout failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Status
    ipcMain.handle('whatsapp:status', async () => {
        const status = whatsAppClient.getStatus();
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

    // Send Message (for campaigns)
    ipcMain.handle('whatsapp:send', async (_event, chatId: string, content: string, options?: any) => {
        try {
            const result = await whatsAppClient.sendMessage(chatId, content, options);
            return { success: true, messageId: result?.id };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Send failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Clear Session (delete .baileys_auth folder)
    ipcMain.handle('whatsapp:clearSession', async () => {
        try {
            console.log('[WhatsApp IPC] Clear session requested');

            // First disconnect if connected
            await whatsAppClient.disconnect();

            // Delete the .baileys_auth folder
            const { app } = await import('electron');
            const path = await import('path');
            const fs = await import('fs');

            const userDataPath = app.getPath('userData');
            const authPath = path.join(userDataPath, '.baileys_auth');

            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log('[WhatsApp IPC] Deleted .baileys_auth folder');
            } else {
                console.log('[WhatsApp IPC] .baileys_auth folder does not exist');
            }

            return { success: true, message: 'Session cleared successfully' };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Clear session failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Get All Contacts
    ipcMain.handle('whatsapp:get-contacts', async () => {
        try {
            console.log('[WhatsApp IPC] Get contacts requested');
            const contacts = await whatsAppClient.getAllContacts();
            return { success: true, data: contacts };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Get contacts failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Get All Groups
    ipcMain.handle('whatsapp:get-groups', async () => {
        try {
            console.log('[WhatsApp IPC] Get groups requested');
            const groups = await whatsAppClient.getAllGroups();
            return { success: true, data: groups };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Get groups failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Detailed Group Participants (with real phone numbers)
    ipcMain.handle('whatsapp:get-group-participants', async (_event, groupJid: string) => {
        try {
            console.log('[WhatsApp IPC] Get group participants requested for:', groupJid);
            const participants = await whatsAppClient.getGroupParticipantsDetailed(groupJid);
            return { success: true, data: participants };
        } catch (error: any) {
            console.error('[WhatsApp IPC] Get group participants failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Import Contacts (Bulk Insert)
    ipcMain.handle('whatsapp:import-contacts', async (_event, contacts: any[]) => {
        try {
            console.log(`[WhatsApp IPC] Import contacts requested: ${contacts.length} contacts`);
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
            console.error('[WhatsApp IPC] Import contacts failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Import Group (Create group + Add participants as contacts + Link)
    ipcMain.handle('whatsapp:import-group', async (_event, group: any) => {
        try {
            console.log(`[WhatsApp IPC] Import group requested: ${group.subject}`);
            const { storageService } = await import('../storageService.js');

            // 1. Fetch detailed participants
            const participants = await whatsAppClient.getGroupParticipantsDetailed(group.id);
            if (!participants || participants.length === 0) {
                return { success: false, error: 'No participants found in group' };
            }

            // 2. Create or find group in local DB
            const appGroups = await storageService.getGroups();
            let appGroup = appGroups.find(g => g.name === group.subject);

            if (!appGroup) {
                appGroup = await storageService.createGroup({ name: group.subject });
                console.log(`[WhatsApp IPC] Created new group in App: ${group.subject} (ID: ${appGroup.id})`);
            } else {
                console.log(`[WhatsApp IPC] Using existing group in App: ${group.subject} (ID: ${appGroup.id})`);
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
                        console.log(`[WhatsApp IPC] Created new contact: ${phone}`);
                    } catch (err) {
                        console.error(`[WhatsApp IPC] Failed to create contact ${phone}:`, err);
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
            console.error('[WhatsApp IPC] Group import failed:', error);
            return { success: false, error: error.message };
        }
    });

    console.log('[WhatsApp IPC] All handlers registered');
}

export function updateWhatsAppMainWindow(mainWindow: BrowserWindow): void {
    whatsAppClient.setMainWindow(mainWindow);
}
