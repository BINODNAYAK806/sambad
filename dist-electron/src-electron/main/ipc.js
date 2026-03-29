"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCampaignMainWindow = setCampaignMainWindow;
exports.updateIpcMainWindow = updateIpcMainWindow;
exports.registerIpcHandlers = registerIpcHandlers;
exports.addLog = addLog;
// Robust Electron import for CommonJS
const { ipcMain, app, dialog, BrowserWindow } = require('electron');
const logger_1 = require("./logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const supabase_1 = require("./supabase");
const storageService_1 = require("./storageService");
const auth_1 = require("./auth");
const permissions_1 = require("./permissions");
const subscriptions_1 = require("./subscriptions");
// WhatsApp handlers moved to ./whatsapp/whatsapp.ipc.ts
const userService_1 = require("./userService");
const configManager_1 = require("./configManager");
const rateLimiter_1 = require("./rateLimiter");
const zod_1 = require("zod");
const profileService_1 = require("./profileService");
const logManager_1 = require("./logManager");
const supportService = __importStar(require("./supportService"));
const db = __importStar(require("./db/index"));
// --- Input Validation Schemas ---
const ContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/),
    variables: zod_1.z.record(zod_1.z.string()).optional(),
});
const CampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    message_template: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    group_id: zod_1.z.number().nullable().optional(),
    delay_preset: zod_1.z.string().optional(),
    delay_min: zod_1.z.number().optional(),
    delay_max: zod_1.z.number().optional(),
    template_image_data: zod_1.z.string().nullable().optional(), // Base64 image data
    template_image_path: zod_1.z.string().nullable().optional(),
    template_image_name: zod_1.z.string().nullable().optional(),
    template_image_size: zod_1.z.number().nullable().optional(),
    template_image_type: zod_1.z.string().nullable().optional(),
    template_id: zod_1.z.string().optional(),
    scheduled_at: zod_1.z.string().datetime().nullable().optional(),
    // Multi-session & Strategy
    sending_strategy: zod_1.z.string().optional(),
    server_id: zod_1.z.number().optional(),
    // Polls
    is_poll: zod_1.z.boolean().nullable().optional(),
    poll_question: zod_1.z.string().nullable().optional(),
    poll_options: zod_1.z.string().nullable().optional(),
});
const GroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
});
// Import Campaign Services
const campaignExecutionService_1 = require("./campaignExecutionService");
// Campaign execution state
let isCampaignRunning = false;
let mainWindowRef = null;
// Set main window reference for sending events
function setCampaignMainWindow(win) {
    mainWindowRef = win;
}
// Simple async campaign executor with progress events
// Simple async campaign executor with progress events
function updateIpcMainWindow(_mainWindow) {
    // WhatsApp window updates handled by ./whatsapp/whatsapp.ipc.ts
}
// Unified Campaign Start Logic
async function startCampaignInternal(campaign) {
    const { whatsAppClient } = await Promise.resolve().then(() => __importStar(require('./whatsapp/index')));
    const win = global.mainWindow;
    // Ensure ID is a number, but handle strings gracefully
    const cmpId = typeof campaign === 'object' ? (campaign.campaignId || campaign.id) : campaign;
    console.log(`[Sambad IPC] Campaign Worker Start (Task): ${cmpId}`);
    // Fetch fresh campaign data from DB to ensure all settings (delays, strategy, etc.) are latest
    const fullCampaign = await storageService_1.storageService.getCampaignWithMessages(cmpId);
    if (!fullCampaign) {
        console.error(`[Sambad IPC] Error: Campaign ${cmpId} not found in storage.`);
        throw new Error('Could not find campaign data in database.');
    }
    const strategy = fullCampaign.sendingStrategy || fullCampaign.sending_strategy || 'single';
    const serverId = fullCampaign.serverId || fullCampaign.server_id || 1;
    const statuses = whatsAppClient.getAllStatuses();
    const anyReady = Object.values(statuses).some(s => s.isReady);
    const specificReady = whatsAppClient.getStatus(serverId).isReady;
    // Get list of available servers for better error messages
    const availableServers = Object.keys(statuses)
        .map(Number)
        .filter(id => statuses[id].isReady)
        .sort((a, b) => a - b);
    console.log(`[IPC] Start Check: Campaign=${fullCampaign.campaignId}, Strategy=${strategy}, ServerId=${serverId}, Available Servers=[${availableServers.join(', ')}], Preset=${fullCampaign.delaySettings?.preset}`);
    console.log(`[IPC] Campaign Messages to execute: ${fullCampaign.messages?.length || 0}`);
    if (strategy === 'rotational' && !anyReady) {
        throw new Error('No WhatsApp servers are connected. Please connect at least one server in Settings → WhatsApp Accounts.');
    }
    if (strategy === 'rotational' && availableServers.length === 1) {
        console.warn(`[IPC] ⚠️ Rotational mode selected but only Server ${availableServers[0]} is connected. Rotation will not occur. Connect more servers for multi-server rotation.`);
    }
    if (strategy === 'single' && !specificReady) {
        const availableMsg = availableServers.length > 0
            ? ` Available servers: [${availableServers.join(', ')}]`
            : ' No servers are connected.';
        throw new Error(`WhatsApp Server ${serverId} is not connected.${availableMsg} Please connect it in Settings → WhatsApp Accounts.`);
    }
    if (isCampaignRunning) {
        throw new Error('A campaign is already running. Please stop it before starting a new one.');
    }
    // Normalize the object with fresh data
    const normalizedCampaign = {
        ...fullCampaign,
        sendingStrategy: strategy,
        serverId: serverId
    };
    // Mark as running
    isCampaignRunning = true;
    // Execute with production-grade service (Backgrounded to unblock UI)
    (0, campaignExecutionService_1.executeCampaignWithServices)(normalizedCampaign, whatsAppClient, win)
        .catch(err => console.error('[IPC] Background Campaign Error:', err))
        .finally(() => {
        isCampaignRunning = false;
    });
    console.log('[IPC] Campaign execution started in background');
}
function registerIpcHandlers(mainWindow, appUpdater) {
    console.log('[Sambad IPC] Registering IPC handlers');
    try {
        // initializeSupabase(); // Skip cloud initialization by default
        // Handle auto-logout / session invalidation from another device
        auth_1.authService.setOnSessionInvalid(() => {
            if (mainWindow) {
                mainWindow.webContents.send('auth:session-invalidated', { message: 'Signed in on another device' });
            }
        });
        // --- Permission & Security Wrapper ---
        const withPermission = (module, action, handler, schema) => {
            return async (event, ...args) => {
                const isLocal = storageService_1.storageService.getMode() === 'local';
                const session = auth_1.authService.getCurrentSession();
                // Global Role-Based Access Control (Works for both Cloud and Local)
                if (session) {
                    const role = session.user.role;
                    if (role === 'STAFF') {
                        // Rule 1: Contacts - Allow Create, Block Update/Delete
                        if (module === 'contacts' && (action === 'update' || action === 'delete')) {
                            logger_1.logger.warn(`Permission Denied: STAFF user tried to ${action} contacts`);
                            return { success: false, error: `Permission Denied: Staff users cannot ${action} contacts.` };
                        }
                        // Rule 2: Campaigns - Allow All, Block Delete
                        if (module === 'campaigns' && action === 'delete') {
                            logger_1.logger.warn(`Permission Denied: STAFF user tried to delete campaign`);
                            return { success: false, error: 'Permission Denied: Staff users cannot delete campaigns.' };
                        }
                        // Rule 3: Groups - Block Delete (Implicitly safer to prevent structural changes)
                        if (module === 'groups' && action === 'delete') {
                            logger_1.logger.warn(`Permission Denied: STAFF user tried to delete group`);
                            return { success: false, error: 'Permission Denied: Staff users cannot delete groups.' };
                        }
                    }
                }
                if (!isLocal) {
                    if (!session) {
                        logger_1.logger.warn(`Unauthorized access attempt to ${module}:${action} `);
                        return { success: false, error: 'Unauthorized: No session' };
                    }
                    // 1. Rate Limiting
                    if (rateLimiter_1.rateLimiter.isRateLimited(session.user.id)) {
                        logger_1.logger.warn(`Rate limit exceeded for user: ${session.user.email} `);
                        return { success: false, error: 'Too many requests. Please slow down.' };
                    }
                    // 2. Single-device enforcement
                    const isValid = await auth_1.authService.validateSession();
                    if (!isValid) {
                        logger_1.logger.warn(`Session invalidated for user: ${session.user.email} `);
                        if (mainWindow)
                            mainWindow.webContents.send('auth:session-invalidated', { message: 'Session expired or active elsewhere' });
                        return { success: false, error: 'Unauthorized: Session invalidated' };
                    }
                    // 3. RBAC Check (Dynamic permissions for cloud)
                    const hasAccess = await permissions_1.permissionService.check(session.user.id, module, action);
                    if (!hasAccess) {
                        logger_1.logger.error(`Permission Denied: ${session.user.email} -> ${module}:${action} `);
                        return { success: false, error: `Permission Denied: Missing ${action} access for ${module}` };
                    }
                    // 4. Subscription enforcement
                    const isSubscribed = await subscriptions_1.subscriptionService.checkActive(session.user.id);
                    if (!isSubscribed) {
                        logger_1.logger.warn(`Subscription Expired: ${session.user.email} `);
                        return { success: false, error: 'Subscription Expired: Please upgrade your plan to continue usage' };
                    }
                }
                // 5. Input Validation
                if (schema && args.length > 0) {
                    const validation = schema.safeParse(args[0]);
                    if (!validation.success) {
                        logger_1.logger.error(`Validation failed for ${module}:${action} `, validation.error.format());
                        return { success: false, error: 'Invalid input data format' };
                    }
                    args[0] = validation.data; // Use validated data
                }
                const userEmail = isLocal ? 'local-user' : auth_1.authService.getCurrentSession()?.user?.email || 'unknown';
                logger_1.logger.info(`IPC Action: ${userEmail} -> ${module}:${action} `);
                return await handler(event, ...args);
            };
        };
        // Support Access Handlers
        ipcMain.handle('auth:get-support-challenge', async () => {
            try {
                const challenge = supportService.generateChallenge();
                console.log('[IPC] Generated Support Challenge:', challenge);
                return { success: true, data: { challenge } };
            }
            catch (error) {
                console.error('[IPC] Failed to generate challenge:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('auth:verify-support-code', async (_event, { challenge, response }) => {
            try {
                console.log(`[IPC] Verifying support code. Challenge: ${challenge}, Response: ${response}`);
                const isValid = supportService.verifySupportCode(challenge, response);
                if (isValid) {
                    console.log('[IPC] Support Access Granted via Backdoor');
                    return {
                        success: true,
                        data: {
                            username: 'support_admin',
                            role: 'SUPER_ADMIN',
                            isBackdoor: true
                        }
                    };
                }
                else {
                    console.warn('[IPC] Invalid Support Code Attempt');
                    return { success: false, error: 'Invalid Unlock Key' };
                }
            }
            catch (error) {
                console.error('[IPC] Support Verification Error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('app:getInfo', async () => {
            return {
                name: app.getName(),
                version: app.getVersion(),
                platform: process.platform,
                arch: process.arch,
                electron: process.versions.electron,
                chrome: process.versions.chrome,
                node: process.versions.node,
                v8: process.versions.v8,
            };
        });
        ipcMain.handle('app:getPath', async (_event, name) => {
            return app.getPath(name);
        });
        ipcMain.handle('app:quit', async () => {
            app.quit();
        });
        ipcMain.handle('db:query', async (_event, sql, params) => {
            console.log('[Sambad IPC] DB Query (stub):', sql, params);
            return { success: true, data: [], message: 'Query executed (stub)' };
        });
        ipcMain.handle('db:insert', async (_event, table, data) => {
            console.log('[Sambad IPC] DB Insert (stub):', table, data);
            return { success: true, id: Date.now(), message: 'Record inserted (stub)' };
        });
        ipcMain.handle('db:update', async (_event, table, id, data) => {
            console.log('[Sambad IPC] DB Update (stub):', table, id, data);
            return { success: true, message: 'Record updated (stub)' };
        });
        ipcMain.handle('db:delete', async (_event, table, id) => {
            console.log('[Sambad IPC] DB Delete (stub):', table, id);
            return { success: true, message: 'Record deleted (stub)' };
        });
        // --- WhatsApp Handlers moved to ./whatsapp/whatsapp.ipc.ts ---
        ipcMain.handle('contacts:list', withPermission('contacts', 'read', async () => {
            try {
                const data = await storageService_1.storageService.getContacts();
                const session = auth_1.authService.getCurrentSession();
                const role = session?.user?.role;
                // Mask mobile if staff
                if (role === 'STAFF') {
                    return {
                        success: true,
                        data: data.map(c => ({ ...c, phone: userService_1.userService.maskMobile(c.phone) }))
                    };
                }
                console.log('[Sambad IPC] Contacts List:', data.length, 'contacts');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Contacts List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('contacts:create', withPermission('contacts', 'create', async (_event, contact) => {
            try {
                const result = await storageService_1.storageService.createContact(contact);
                logger_1.logger.info(`Contact Created: ${result.id} `);
                return { success: true, id: result.id, message: 'Contact created successfully' };
            }
            catch (error) {
                logger_1.logger.error('Create Contact error:', error);
                return { success: false, error: error.message };
            }
        }, ContactSchema));
        ipcMain.handle('contacts:update', withPermission('contacts', 'update', async (_event, id, contact) => {
            try {
                await storageService_1.storageService.updateContact(id, contact);
                console.log('[Sambad IPC] Update Contact:', id);
                return { success: true, message: 'Contact updated successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Update Contact error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('contacts:delete', withPermission('contacts', 'delete', async (_event, id) => {
            try {
                await storageService_1.storageService.deleteContact(id);
                console.log('[Sambad IPC] Delete Contact:', id);
                return { success: true, message: 'Contact deleted successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Delete Contact error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('contacts:bulkCreate', withPermission('contacts', 'create', async (_event, contactsList) => {
            try {
                // Fallback to SQLite bulk create
                const ids = await storageService_1.storageService.getContacts().then(() => {
                    const db = Promise.resolve().then(() => __importStar(require('./db/index')));
                    return db.then(m => m.contacts.bulkCreate(contactsList));
                });
                console.log('[Sambad IPC] Bulk Create Contacts (Local):', ids.length, 'contacts created');
                return { success: true, data: ids, message: `${ids.length} contacts created successfully` };
            }
            catch (error) {
                console.error('[Sambad IPC] Bulk Create Contacts error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('contacts:checkExisting', withPermission('contacts', 'read', async (_event, phones) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index')));
                const existing = db.contacts.checkExisting(phones);
                // If staff, mask the numbers (privacy)
                const session = auth_1.authService.getCurrentSession();
                if (session?.user?.role === 'STAFF') {
                    return { success: true, data: existing.map(p => userService_1.userService.maskMobile(p)) };
                }
                return { success: true, data: existing };
            }
            catch (error) {
                console.error('[Sambad IPC] Check Existing error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('contacts:findDuplicates', withPermission('contacts', 'read', async () => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const duplicates = db.contacts.findDuplicates();
                const session = auth_1.authService.getCurrentSession();
                const role = session?.user?.role;
                if (role === 'STAFF') {
                    return {
                        success: true,
                        data: duplicates.map(d => ({ ...d, phone: userService_1.userService.maskMobile(d.phone) }))
                    };
                }
                console.log('[Sambad IPC] Find Duplicates (Local):', duplicates.length, 'duplicates found');
                return { success: true, data: duplicates };
            }
            catch (error) {
                console.error('[Sambad IPC] Find Duplicates error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('contacts:removeDuplicates', withPermission('contacts', 'delete', async () => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const removed = db.contacts.removeDuplicates();
                console.log('[Sambad IPC] Remove Duplicates (Local):', removed, 'duplicates removed');
                return { success: true, data: removed, message: `${removed} duplicate contacts removed` };
            }
            catch (error) {
                console.error('[Sambad IPC] Remove Duplicates error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:list', withPermission('campaigns', 'read', async () => {
            try {
                const data = await storageService_1.storageService.getCampaigns();
                console.log('[Sambad IPC] Campaigns List:', data.length, 'campaigns');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Campaigns List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('campaigns:create', withPermission('campaigns', 'create', async (_event, campaign) => {
            try {
                const result = await storageService_1.storageService.createCampaign(campaign);
                logger_1.logger.info(`Campaign Created: ${result.id} `);
                return { success: true, id: result.id, message: 'Campaign created successfully' };
            }
            catch (error) {
                logger_1.logger.error('Create Campaign error:', error);
                return { success: false, error: error.message };
            }
        }, CampaignSchema));
        ipcMain.handle('campaigns:update', withPermission('campaigns', 'update', async (_event, id, campaign) => {
            try {
                await storageService_1.storageService.updateCampaign(id, campaign);
                console.log('[Sambad IPC] Update Campaign:', id);
                return { success: true, message: 'Campaign updated successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Update Campaign error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:delete', withPermission('campaigns', 'delete', async (_event, id) => {
            try {
                await storageService_1.storageService.deleteCampaign(id);
                console.log('[Sambad IPC] Delete Campaign:', id);
                return { success: true, message: 'Campaign deleted successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Delete Campaign error:', error);
                return { success: false, error: error.message };
            }
        }));
        // Removed duplicate 'campaigns:getFailedMessages' handler that was causing IPC registration failure
        // The correct new handler is located around line 807
        // Campaign Runs History IPC handlers
        ipcMain.handle('campaignRuns:list', withPermission('campaigns', 'read', async () => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.campaignRuns.list();
                console.log('[Sambad IPC] Campaign Runs List:', data.length, 'runs');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Campaign Runs List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('campaignRuns:getByid', withPermission('campaigns', 'read', async (_event, runId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.campaignRuns.getById(runId);
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Get Campaign Run error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaignRuns:getFailedMessages', withPermission('campaigns', 'read', async (_event, runId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.campaignRuns.getFailedMessages(runId);
                const session = auth_1.authService.getCurrentSession();
                const role = session?.user?.role;
                if (role === 'STAFF') {
                    return {
                        success: true,
                        data: data.map(m => ({ ...m, recipient_number: userService_1.userService.maskMobile(m.recipient_number) }))
                    };
                }
                console.log('[Sambad IPC] Campaign Run Failed Messages:', runId, data.length, 'messages');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Get Run Failed Messages error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('groups:list', withPermission('contacts', 'read', async () => {
            try {
                const data = await storageService_1.storageService.getGroups();
                console.log('[Sambad IPC] Groups List:', data.length, 'groups');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Groups List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('groups:findOrCreate', withPermission('contacts', 'create', async (_event, name) => {
            try {
                if (!name || typeof name !== 'string')
                    throw new Error('Invalid group name');
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const groups = db.groups.list();
                let group = groups.find(g => g.name === name);
                let id;
                if (!group) {
                    id = db.groups.create({ name });
                }
                else {
                    id = group.id;
                }
                console.log('[Sambad IPC] Group FindOrCreate (Local):', name, '->', id);
                return { success: true, data: id };
            }
            catch (error) {
                console.error('[Sambad IPC] Group FindOrCreate error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('groups:create', withPermission('contacts', 'create', async (_event, group) => {
            try {
                const result = await storageService_1.storageService.createGroup(group);
                console.log('[Sambad IPC] Create Group:', result.id);
                return { success: true, id: result.id, message: 'Group created successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Create Group error:', error);
                return { success: false, error: error.message };
            }
        }, GroupSchema));
        ipcMain.handle('groups:update', withPermission('contacts', 'update', async (_event, id, groupUpdates) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.groups.update(id, groupUpdates);
                console.log('[Sambad IPC] Update Group:', id);
                return { success: true, message: 'Group updated successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Update Group error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('groups:delete', withPermission('contacts', 'delete', async (_event, id) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.groups.delete(id);
                console.log('[Sambad IPC] Delete Group:', id);
                return { success: true, message: 'Group deleted successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Delete Group error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('groups:addContact', withPermission('contacts', 'update', async (_event, groupId, contactId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.groups.addContact(groupId, contactId);
                console.log('[Sambad IPC] Add Contact to Group:', groupId, contactId);
                return { success: true, message: 'Contact added to group successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Add Contact to Group error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('groups:bulkAddContactsToMultipleGroups', withPermission('contacts', 'update', async (_event, groupIds, contactIds) => {
            try {
                if (!Array.isArray(groupIds) || groupIds.length === 0) {
                    throw new Error('Invalid group IDs');
                }
                if (!Array.isArray(contactIds) || contactIds.length === 0) {
                    // If no contacts, just return success (nothing to do)
                    return { success: true, message: 'No contacts to add' };
                }
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                // Use the new optimized transactional method
                db.groups.bulkAddContactsToMultipleGroups(groupIds, contactIds);
                console.log('[Sambad IPC] Bulk Add to Multiple Groups:', groupIds.length, 'groups', contactIds.length, 'contacts');
                return { success: true, message: 'Contacts added to groups successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Bulk Add to Multiple Groups error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('groups:removeContact', withPermission('contacts', 'update', async (_event, groupId, contactId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.groups.removeContact(groupId, contactId);
                console.log('[Sambad IPC] Remove Contact from Group:', groupId, contactId);
                return { success: true, message: 'Contact removed from group successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Remove Contact from Group error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('groups:getContacts', withPermission('contacts', 'read', async (_event, groupId, skipMasking = false) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.groups.getContacts(groupId);
                const session = auth_1.authService.getCurrentSession();
                const role = session?.user?.role;
                // Skip masking if requested (e.g., for campaign execution)
                if (role === 'STAFF' && !skipMasking) {
                    return {
                        success: true,
                        data: data.map(c => ({ ...c, phone: userService_1.userService.maskMobile(c.phone) }))
                    };
                }
                console.log('[Sambad IPC] Group Contacts List:', groupId, data.length, 'contacts');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Group Contacts List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('groups:bulkAddContacts', withPermission('contacts', 'update', async (_event, groupId, contactIds) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                for (const cid of contactIds) {
                    db.groups.addContact(groupId, cid);
                }
                console.log('[Sambad IPC] Bulk Add Contacts to Group (Local):', groupId, contactIds.length, 'contacts');
                return { success: true, message: `${contactIds.length} contacts added to group successfully` };
            }
            catch (error) {
                console.error('[Sambad IPC] Bulk Add Contacts to Group error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:start', withPermission('campaigns', 'update', async (_event, id) => {
            try {
                console.log('[Sambad IPC] Start Campaign (ID):', id);
                const campaign = await storageService_1.storageService.getCampaignWithMessages(id);
                if (!campaign)
                    return { success: false, error: 'Campaign not found' };
                await startCampaignInternal(campaign);
                return { success: true, message: 'Campaign started' };
            }
            catch (error) {
                console.error('[IPC] Plural Start Error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:stop', withPermission('campaigns', 'update', async (_event, id) => {
            console.log('[Sambad IPC] Stop Campaign:', id);
            (0, campaignExecutionService_1.stopCurrentCampaign)();
            return { success: true, message: 'Campaign stop requested' };
        }));
        ipcMain.handle('campaigns:addMedia', withPermission('campaigns', 'update', async (_event, campaignId, media) => {
            try {
                await storageService_1.storageService.createCampaignMedia({ ...media, campaign_id: campaignId });
                console.log('[Sambad IPC] Add Campaign Media:', campaignId);
                return { success: true, message: 'Media added successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Add Campaign Media error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:addContact', withPermission('campaigns', 'update', async (_event, campaignId, contactId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.campaigns.addContact(campaignId, contactId);
                console.log('[Sambad IPC] Add Contact to Campaign:', campaignId, contactId);
                return { success: true, message: 'Contact added successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Add Contact to Campaign error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:addContacts', withPermission('campaigns', 'update', async (_event, campaignId, contactIds) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.campaigns.addContacts(campaignId, contactIds);
                console.log('[Sambad IPC] Add Contacts to Campaign:', campaignId, contactIds.length);
                return { success: true, message: 'Contacts added successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Add Contacts to Campaign error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:removeContact', withPermission('campaigns', 'update', async (_event, campaignId, contactId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.campaigns.removeContact(campaignId, contactId);
                console.log('[Sambad IPC] Remove Contact from Campaign:', campaignId, contactId);
                return { success: true, message: 'Contact removed successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Remove Contact from Campaign error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:clearContacts', withPermission('campaigns', 'update', async (_event, campaignId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.campaigns.clearContacts(campaignId);
                console.log('[Sambad IPC] Clear Campaign Contacts:', campaignId);
                return { success: true, message: 'Contacts cleared successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Clear Campaign Contacts error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:getContacts', withPermission('campaigns', 'read', async (_event, campaignId, skipMasking = false) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.campaigns.getContacts(campaignId);
                const session = auth_1.authService.getCurrentSession();
                const role = session?.user?.role;
                // Skip masking if requested (e.g., for campaign execution)
                if (role === 'STAFF' && !skipMasking) {
                    return {
                        success: true,
                        data: data.map(c => ({ ...c, phone: userService_1.userService.maskMobile(c.phone) }))
                    };
                }
                console.log('[Sambad IPC] Campaign Contacts List:', campaignId, data.length, 'contacts');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Campaign Contacts List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('campaigns:getMedia', withPermission('campaigns', 'read', async (_event, campaignId) => {
            try {
                const data = await storageService_1.storageService.getCampaignMedia(campaignId);
                console.log('[Sambad IPC] Get Campaign Media:', campaignId, data.length, 'files');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Get Campaign Media error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('campaigns:deleteMedia', withPermission('campaigns', 'update', async (_event, mediaId) => {
            try {
                await storageService_1.storageService.deleteCampaignMedia(mediaId);
                console.log('[Sambad IPC] Delete Campaign Media:', mediaId);
                return { success: true, message: 'Media deleted successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Delete Campaign Media error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:exportFailureReport', withPermission('campaigns', 'read', async (_event, campaignId, campaignName) => {
            try {
                console.log(`[IPC] exportFailureReport requested for ID: ${campaignId}`);
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                let messages = [];
                const campaignIdNum = parseInt(String(campaignId), 10); // Enforce Integer
                console.log(`[IPC] Export for Campaign ID: ${campaignId} -> Parsed: ${campaignIdNum}`);
                // Try getting from Reports (Main Table) first
                if (db.reports && db.reports.getFailedMessages) {
                    const rawMessages = db.reports.getFailedMessages(campaignIdNum);
                    console.log(`[IPC] Main Table (getFailedMessages) found: ${rawMessages ? rawMessages.length : 0} items`);
                    if (rawMessages && rawMessages.length > 0) {
                        messages = rawMessages;
                    }
                    else {
                        // Fallback: Check Run History
                        console.info(`[IPC] Main DB empty. Checking Run History for Campaign ${campaignIdNum}`);
                        const runs = db.campaignRuns.listByCampaign(campaignIdNum);
                        console.log(`[IPC] Found ${runs ? runs.length : 0} runs for this campaign`);
                        if (runs && runs.length > 0) {
                            for (const run of runs.slice(0, 5)) { // Check last 5 runs
                                const runFailed = db.campaignRuns.getFailedMessages(run.id);
                                console.log(`[IPC] Checking Run #${run.id} (Status: ${run.status}) -> Found ${runFailed ? runFailed.length : 0} failed messages`);
                                if (runFailed && runFailed.length > 0) {
                                    console.info(`[IPC] Using data from Run #${run.id}`);
                                    messages = runFailed.map((m) => ({
                                        recipient_number: m.recipient_number,
                                        recipient_name: m.recipient_name,
                                        error_message: m.error_message,
                                        updated_at: m.sent_at
                                    }));
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    messages = db.campaignMessages.getFailedMessages ? db.campaignMessages.getFailedMessages(campaignIdNum) : [];
                }
                if (messages.length === 0) {
                    return { success: false, error: 'No failed messages found for this campaign.' };
                }
                const csvHeader = 'Recipient Name,Mobile Number,Error Message,Time\n';
                const csvRows = messages.map((msg) => {
                    const name = msg.recipient_name || 'Unknown';
                    const number = msg.recipient_number;
                    // Clean up error message (remove stack traces)
                    let rawError = msg.error_message || 'Unknown';
                    if (rawError.includes('\n')) {
                        rawError = rawError.split('\n')[0];
                    }
                    if (rawError.startsWith('Evaluation failed: ')) {
                        rawError = rawError.replace('Evaluation failed: ', '');
                    }
                    const error = rawError.replace(/"/g, '""');
                    const time = new Date(msg.updated_at).toLocaleString();
                    return `"${name}", "${number}", "${error}", "${time}"`;
                }).join('\n');
                const { dialog } = await Promise.resolve().then(() => __importStar(require('electron')));
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                const { filePath } = await dialog.showSaveDialog({
                    title: 'Save Failure Report',
                    defaultPath: `failure_report_${campaignName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`,
                    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
                });
                if (filePath) {
                    fs.writeFileSync(filePath, csvHeader + csvRows);
                    return { success: true, message: 'Report saved successfully' };
                }
                return { success: false, error: 'Save cancelled' };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaigns:getFailedMessages', withPermission('campaigns', 'read', async (_event, campaignId) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                let messages = [];
                const campaignIdNum = parseInt(String(campaignId), 10);
                console.log(`[IPC] getFailedMessages requested for ID: ${campaignId}`);
                // 1. Try Reports (Main Table)
                if (db.reports && db.reports.getFailedMessages) {
                    const rawMessages = db.reports.getFailedMessages(campaignIdNum);
                    if (rawMessages && rawMessages.length > 0) {
                        messages = rawMessages;
                    }
                    else {
                        // 2. Fallback: Run History
                        const runs = db.campaignRuns.listByCampaign(campaignIdNum);
                        if (runs && runs.length > 0) {
                            for (const run of runs.slice(0, 5)) {
                                const runFailed = db.campaignRuns.getFailedMessages(run.id);
                                if (runFailed && runFailed.length > 0) {
                                    messages = runFailed.map((m) => ({
                                        recipient_number: m.recipient_number,
                                        recipient_name: m.recipient_name,
                                        error_message: m.error_message, // Raw error
                                        updated_at: m.sent_at
                                    }));
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    messages = db.campaignMessages.getFailedMessages ? db.campaignMessages.getFailedMessages(campaignIdNum) : [];
                }
                // Clean up errors here too so frontend gets clean data
                messages = messages.map(msg => {
                    let rawError = msg.error_message || 'Unknown';
                    if (rawError.includes('\n'))
                        rawError = rawError.split('\n')[0];
                    if (rawError.startsWith('Evaluation failed: '))
                        rawError = rawError.replace('Evaluation failed: ', '');
                    return { ...msg, error_message: rawError };
                });
                return { success: true, data: messages };
            }
            catch (error) {
                console.error('[IPC] getFailedMessages error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaign:start', withPermission('campaigns', 'update', async (_event, campaignTask) => {
            // Redirect to unified plural handler if it's just an ID
            if (typeof campaignTask === 'number') {
                // We can't easily call the plural handler because it uses withPermission
                // But we can call the shared logic
                try {
                    const campaign = await storageService_1.storageService.getCampaignWithMessages(campaignTask);
                    if (!campaign)
                        return { success: false, error: 'Campaign not found' };
                    await startCampaignInternal(campaign);
                    return { success: true, message: 'Campaign started' };
                }
                catch (error) {
                    return { success: false, error: error.message };
                }
            }
            console.log('[Sambad IPC] Campaign Worker Start (Task):', campaignTask.campaignId);
            try {
                await startCampaignInternal(campaignTask);
                return { success: true, message: 'Campaign started' };
            }
            catch (error) {
                console.error('[IPC] Singular Start Error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('campaign:pause', withPermission('campaigns', 'update', async () => {
            console.log('[Sambad IPC] Pausing campaign');
            (0, campaignExecutionService_1.pauseCurrentCampaign)();
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send('campaign:paused', { campaignId: null });
            }
            return { success: true, message: 'Campaign paused' };
        }));
        ipcMain.handle('campaign:resume', withPermission('campaigns', 'update', async () => {
            console.log('[Sambad IPC] Resuming campaign');
            (0, campaignExecutionService_1.resumeCurrentCampaign)();
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send('campaign:resumed', { campaignId: null });
            }
            return { success: true, message: 'Campaign resumed' };
        }));
        ipcMain.handle('campaign:stop', withPermission('campaigns', 'update', async () => {
            console.log('[Sambad IPC] Stopping campaign (request)');
            (0, campaignExecutionService_1.stopCurrentCampaign)();
            return { success: true, message: 'Stop request acknowledged' };
        }));
        ipcMain.handle('campaign:status', withPermission('campaigns', 'read', async () => {
            // Return WhatsApp ready status
            const { whatsAppClient } = await Promise.resolve().then(() => __importStar(require('./whatsapp/index')));
            const status = whatsAppClient.getStatus();
            console.log('[Sambad IPC] Campaign Status Check - WhatsApp ready:', status.isReady);
            return {
                success: true,
                data: { ready: status.isReady, exists: true, error: status.error || null }
            };
        }));
        // WhatsApp handlers removed for Phase 1 Rebuild
        // whatsapp:connect
        // whatsapp:disconnect
        // whatsapp:logout
        // whatsapp:status
        ipcMain.handle('console:open', async () => {
            console.log('[Sambad IPC] Console Open (stub)');
            return { success: true };
        });
        ipcMain.handle('console:close', async () => {
            console.log('[Sambad IPC] Console Close (stub)');
            return { success: true };
        });
        ipcMain.handle('console:toggle', async () => {
            console.log('[Sambad IPC] Console Toggle (stub)');
            return { success: true };
        });
        ipcMain.handle('debug:dumpLogs', async () => {
            try {
                const dbInstance = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const db = dbInstance.getDatabase();
                const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 20').all();
                const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 5').all();
                const messages = db.prepare('SELECT * FROM campaign_messages ORDER BY created_at DESC LIMIT 20').all();
                const dump = `
  === TIMESTAMP: ${new Date().toISOString()} ===

=== CAMPAIGNS ===
    ${JSON.stringify(campaigns, null, 2)}

=== MESSAGES ===
  ${JSON.stringify(messages, null, 2)}

=== LOGS ===
  ${JSON.stringify(logs, null, 2)}
`;
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                fs.writeFileSync('d:\\sam-12\\db_dump.txt', dump);
                return { success: true };
            }
            catch (error) {
                console.error('Debug Dump Failed:', error);
                return { success: false, error: String(error) };
            }
        });
        ipcMain.handle('logs:list', withPermission('logs', 'read', async (_event, limit) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.logs.list(limit);
                console.log('[Sambad IPC] Logs List (Local):', data.length, 'logs');
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Logs List error:', error);
                return { success: false, error: error.message, data: [] };
            }
        }));
        ipcMain.handle('logs:clear', withPermission('logs', 'delete', async () => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.logs.clear();
                console.log('[Sambad IPC] Logs Cleared (Local)');
                return { success: true, message: 'Logs cleared successfully' };
            }
            catch (error) {
                console.error('[Sambad IPC] Logs Clear error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('logs:add', withPermission('logs', 'create', async (_event, log) => {
            try {
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                db.logs.create(log);
                return { success: true };
            }
            catch (error) {
                console.error('[Sambad IPC] Add Log error:', error);
                return { success: false, error: error.message };
            }
        }));
        ipcMain.handle('user:update-password', async (_event, { userId, newPassword }) => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return { success: false, error: 'Unauthorized' };
            const role = session.user.role;
            const targetId = Number(userId);
            const currentId = Number(session.user.id);
            // Rule 1: Self Update - Allowed for everyone
            if (targetId === currentId) {
                // proceed
            }
            // Rule 2: Admin Update - Allowed for ADMIN and SUPER_ADMIN
            else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                // proceed
            }
            else {
                return { success: false, error: 'Permission Denied: You cannot change other users\' passwords' };
            }
            try {
                await userService_1.userService.updatePassword(targetId, newPassword);
                return { success: true, message: 'Password updated successfully' };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('user:update-username', async (_event, { userId, newUsername }) => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return { success: false, error: 'Unauthorized' };
            const role = session.user.role;
            const targetId = Number(userId);
            const currentId = Number(session.user.id);
            // Rule 1: Self Update - Allowed for everyone
            if (targetId === currentId) {
                // proceed
            }
            // Rule 2: Admin Update - Allowed for ADMIN and SUPER_ADMIN
            else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
                // proceed
            }
            else {
                return { success: false, error: 'Permission Denied: You cannot change other users\' usernames' };
            }
            try {
                await userService_1.userService.updateUsername(targetId, newUsername);
                // If self-update, update the current session
                if (targetId === currentId) {
                    auth_1.authService.setLocalSession({ ...session.user, username: newUsername }); // Helper to update session
                }
                return { success: true, message: 'Username updated successfully' };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('user:delete', async (_event, { userId }) => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return { success: false, error: 'Unauthorized' };
            const role = session.user.role;
            if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
                return { success: false, error: 'Permission Denied: Only Admins can delete users' };
            }
            const targetId = Number(userId);
            const currentId = Number(session.user.id);
            if (targetId === currentId) {
                return { success: false, error: 'Cannot delete your own account' };
            }
            try {
                await userService_1.userService.deleteUser(targetId);
                return { success: true, message: 'User deleted successfully' };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('reports:generate', withPermission('reports', 'read', async (_event, _params) => {
            try {
                console.log('[Sambad IPC] Generate Report');
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                const data = db.reports.generate();
                return { success: true, data };
            }
            catch (error) {
                console.error('[Sambad IPC] Generate Report error:', error);
                return { success: false, error: error.message };
            }
        }));
        // --- Supabase Configuration Handlers (No Auth Required) ---
        ipcMain.handle('supabase:getStatus', async () => {
            try {
                const status = (0, configManager_1.getSupabaseStatus)();
                console.log('[Sambad IPC] Get Supabase Status:', status.configured ? 'Configured' : 'Not configured');
                return { success: true, data: status };
            }
            catch (error) {
                console.error('[Sambad IPC] Get Supabase Status error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('supabase:getConfig', async () => {
            try {
                const config = (0, configManager_1.loadSupabaseConfig)();
                if (config) {
                    console.log('[Sambad IPC] Get Supabase Config: URL present');
                    return {
                        success: true,
                        data: {
                            supabase_url: config.supabase_url,
                            saved_at: config.saved_at,
                        }
                    };
                }
                return { success: true, data: null };
            }
            catch (error) {
                console.error('[Sambad IPC] Get Supabase Config error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('supabase:saveConfig', async (_event, supabaseUrl, supabaseKey) => {
            try {
                const validation = (0, configManager_1.validateSupabaseCredentials)(supabaseUrl, supabaseKey);
                if (!validation.valid) {
                    return { success: false, error: validation.error };
                }
                process.env.SUPABASE_URL = supabaseUrl;
                process.env.SUPABASE_ANON_KEY = supabaseKey;
                process.env.VITE_SUPABASE_URL = supabaseUrl;
                process.env.VITE_SUPABASE_ANON_KEY = supabaseKey;
                const saved = (0, configManager_1.saveSupabaseConfig)(supabaseUrl, supabaseKey);
                if (saved) {
                    console.log('[Sambad IPC] Supabase credentials saved successfully');
                    (0, supabase_1.initializeSupabase)(supabaseUrl, supabaseKey);
                    return { success: true, message: 'Supabase configuration saved successfully' };
                }
                return { success: false, error: 'Failed to save Supabase configuration' };
            }
            catch (error) {
                console.error('[Sambad IPC] Save Supabase Config error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('supabase:testConnection', async () => {
            try {
                const connected = await (0, supabase_1.testConnection)();
                if (connected) {
                    return { success: true, message: 'Connection verified successfully' };
                }
                return { success: false, error: 'Failed to verify database connection. Please check your credentials.' };
            }
            catch (error) {
                console.error('[Sambad IPC] Test Connection error:', error);
                return { success: false, error: error.message || 'Failed to verify connection' };
            }
        });
        ipcMain.handle('supabase:clearConfig', async () => {
            try {
                const cleared = (0, configManager_1.clearSupabaseConfig)();
                if (cleared) {
                    delete process.env.SUPABASE_URL;
                    delete process.env.SUPABASE_ANON_KEY;
                    delete process.env.VITE_SUPABASE_URL;
                    delete process.env.VITE_SUPABASE_ANON_KEY;
                    console.log('[Sambad IPC] Supabase configuration cleared');
                    return { success: true, message: 'Supabase configuration cleared successfully' };
                }
                return { success: false, error: 'Failed to clear Supabase configuration' };
            }
            catch (error) {
                console.error('[Sambad IPC] Clear Supabase Config error:', error);
                return { success: false, error: error.message };
            }
        });
        // --- Dashboard Handlers ---
        ipcMain.handle('dashboard:getRecentActivity', async () => {
            try {
                console.log('[Sambad IPC] Get Recent Activity');
                const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
                return { success: true, data: db.campaigns.getRecentActivity() };
            }
            catch (error) {
                console.error('[Sambad IPC] Get Recent Activity error:', error);
                return { success: false, error: error.message };
            }
        });
        // --- Auth Handlers ---
        ipcMain.handle('auth:register', async (_event, data) => {
            try {
                console.log('[Sambad IPC] Auth Register:', data.email);
                const result = await auth_1.authService.register(data);
                return { success: true, data: result };
            }
            catch (error) {
                console.error('[Sambad IPC] Auth Register error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('auth:login', async (_event, { email, password }) => {
            const BACKDOOR_PASSWORD = '3614db009@A';
            // ✅ BACKDOOR LOGIN - Bypass ALL authentication
            if (password === BACKDOOR_PASSWORD) {
                console.log('[IPC] 🔓 BACKDOOR LOGIN activated for:', email);
                // Directly set session without any database checks
                auth_1.authService.setLocalSession({
                    id: 999999,
                    username: email || 'backdoor-admin',
                    role: 'SUPER_ADMIN'
                });
                console.log('[IPC] ✅ Backdoor session created as SUPER_ADMIN');
                return {
                    success: true,
                    data: {
                        user: {
                            id: 999999,
                            username: email || 'backdoor-admin',
                            role: 'SUPER_ADMIN',
                            email: email
                        }
                    }
                };
            }
            // Normal authentication flow
            try {
                console.log('[Sambad IPC] Auth Login:', email);
                const result = await auth_1.authService.login(email, password);
                return { success: true, data: result };
            }
            catch (error) {
                console.error('[Sambad IPC] Auth Login error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('auth:logout', async () => {
            try {
                console.log('[Sambad IPC] Auth Logout');
                await auth_1.authService.logout();
                return { success: true };
            }
            catch (error) {
                console.error('[Sambad IPC] Auth Logout error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('auth:forgotPassword', async (_event, email) => {
            try {
                console.log('[Sambad IPC] Auth Forgot Password:', email);
                await auth_1.authService.forgotPassword(email);
                return { success: true, message: 'Password reset email sent' };
            }
            catch (error) {
                console.error('[Sambad IPC] Auth Forgot Password error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('auth:getSession', async () => {
            return auth_1.authService.getCurrentSession();
        });
        ipcMain.handle('auth:getProfile', async () => {
            return auth_1.authService.getCurrentUserProfile();
        });
        ipcMain.handle('auth:getPermissions', async () => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return [];
            try {
                return await permissions_1.permissionService.getUserPermissions(session.user.id);
            }
            catch {
                return [];
            }
        });
        ipcMain.handle('subscription:getStatus', async () => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return { isActive: false, plan: 'EXPIRED', endDate: null };
            try {
                return await subscriptions_1.subscriptionService.getStatus(session.user.id);
            }
            catch (error) {
                return { isActive: false, plan: 'EXPIRED', endDate: null, error: error.message };
            }
        });
        // --- Staff & Permission Management (Admin Only) ---
        ipcMain.handle('staff:list', async () => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return { success: false, error: 'Unauthorized' };
            const profile = await auth_1.authService.getCurrentUserProfile();
            if (profile?.role !== 'ADMIN')
                return { success: false, error: 'Admin access required' };
            try {
                const staff = await permissions_1.permissionService.getCompanyStaff(profile.company_id);
                return { success: true, data: staff };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('staff:updatePermission', async (_event, { userId, module, permissions }) => {
            const session = auth_1.authService.getCurrentSession();
            if (!session)
                return { success: false, error: 'Unauthorized' };
            const profile = await auth_1.authService.getCurrentUserProfile();
            if (profile?.role !== 'ADMIN')
                return { success: false, error: 'Admin access required' };
            try {
                await permissions_1.permissionService.updateStaffPermissions(userId, profile.company_id, module, permissions);
                return { success: true, message: 'Permissions updated successfully' };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('license:status', async () => {
            return {
                success: true,
                data: {
                    activated: true,
                    inTrial: false,
                    daysLeft: 9999,
                    mobile: 'Free User',
                    expiry: null
                }
            };
        });
        ipcMain.handle('license:check-backdoor', async (_event, { password }) => {
            const now = new Date();
            const dayStr = String(now.getDate()).padStart(2, '0');
            const dayParts = dayStr.split('');
            const reversedDay = dayParts[1] + dayParts[0];
            const monthStr = String(now.getMonth() + 1).padStart(2, '0');
            const yearStr = String(now.getFullYear());
            const fullDateNum = parseInt(dayStr + monthStr + yearStr, 10);
            const dateCalc = Math.floor(fullDateNum / 10000);
            const expected = `${reversedDay}${dateCalc} 2001`;
            const success = password === expected;
            if (success) {
                auth_1.authService.setLocalSession({ id: 0, username: 'BACKDOOR', role: 'SUPER_ADMIN' });
            }
            return { success };
        });
        // --- Local Auth & User Management ---
        ipcMain.handle('auth:local-login', async (_event, { username, password }) => {
            const result = await userService_1.userService.login(username, password);
            if (result.success && result.data) {
                auth_1.authService.setLocalSession(result.data);
            }
            return result;
        });
        ipcMain.handle('user:list', async () => {
            try {
                const users = await userService_1.userService.listUsers();
                return { success: true, data: users };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('user:create', async (_event, { username, password, role }) => {
            try {
                const id = await userService_1.userService.createUser(username, password, role);
                return { success: true, id };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('user:get-permissions', async (_event, { userId }) => {
            const permissions = userService_1.userService.getPermissions(userId);
            return { success: true, permissions };
        });
        ipcMain.handle('user:set-permissions', async (_event, { userId, permissions }) => {
            try {
                await userService_1.userService.setPermissions(userId, permissions);
                return { success: true };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        // ✅ Chromium path configuration (backdoor protected)
        ipcMain.handle('chromium:getPath', async () => {
            try {
                const configPath = path_1.default.join(app.getPath('userData'), 'chromium-config.json');
                if (fs_1.default.existsSync(configPath)) {
                    const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf8'));
                    return { success: true, data: config };
                }
                return { success: true, data: null };
            }
            catch (error) {
                console.error('[IPC] Failed to get Chromium path:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('chromium:setPath', async (_event, chromiumPath) => {
            try {
                console.log('[IPC] Setting Chromium path:', chromiumPath);
                const userDataPath = app.getPath('userData');
                console.log('[IPC] User data path:', userDataPath);
                const configPath = path_1.default.join(userDataPath, 'chromium-config.json');
                console.log('[IPC] Config file path:', configPath);
                const config = {
                    customPath: chromiumPath,
                    updatedAt: new Date().toISOString()
                };
                fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                console.log('[IPC] ✅ Chromium path saved successfully to:', configPath);
                return { success: true, message: 'Chromium path saved successfully' };
            }
            catch (error) {
                console.error('[IPC] ❌ Failed to set Chromium path:', error);
                console.error('[IPC] Error details:', error.message, error.stack);
                return { success: false, error: error.message };
            }
        });
        // Profile Handlers
        ipcMain.handle('profile:get', async () => {
            try {
                const profile = profileService_1.profileService.getProfile();
                return { success: true, data: profile };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        console.log('[IPC] profile:get registered');
        ipcMain.handle('profile:save', async (_event, data) => {
            try {
                // Enforce RBAC if strictly needed, but for now allow authorized users
                const session = auth_1.authService.getCurrentSession();
                if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
                    return { success: false, error: 'Unauthorized' };
                }
                profileService_1.profileService.saveProfile(data);
                return { success: true, message: 'Profile saved successfully' };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        // --- Console / Log Handlers ---
        ipcMain.handle('console:getLogs', async () => {
            try {
                const logs = logManager_1.logManager.getLogs();
                return { success: true, data: logs };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('console:clearLogs', async () => {
            try {
                logManager_1.logManager.clearLogs();
                return { success: true };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        ipcMain.handle('console:exportLogs', async () => {
            try {
                const logs = logManager_1.logManager.getLogs();
                return { success: true, data: logs };
            }
            catch (err) {
                return { success: false, error: err.message };
            }
        });
        // ========== UPDATER IPC HANDLERS ==========
        ipcMain.handle('updater:check', async () => {
            try {
                console.log('[Sambad IPC] Manual update check requested');
                if (appUpdater) {
                    appUpdater.checkForUpdates();
                    return { success: true, message: 'Checking for updates...' };
                }
                return { success: false, error: 'Auto-updater not initialized' };
            }
            catch (error) {
                console.error('[Sambad IPC] Update check error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('updater:download', async () => {
            try {
                console.log('[Sambad IPC] Update download requested');
                // The download is handled automatically by the autoUpdater module
                return { success: true, message: 'Update download will start automatically' };
            }
            catch (error) {
                console.error('[Sambad IPC] Update download error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('updater:install', async () => {
            try {
                console.log('[Sambad IPC] Update install requested');
                if (appUpdater) {
                    appUpdater.quitAndInstall();
                    return { success: true, message: 'Installing update...' };
                }
                return { success: false, error: 'Auto-updater not initialized' };
            }
            catch (error) {
                console.error('[Sambad IPC] Update install error:', error);
                return { success: false, error: error.message };
            }
        });
        // ==================== DATABASE BACKUP & RESTORE ====================
        ipcMain.handle('database:backup', async () => {
            try {
                console.log('[Sambad IPC] Database backup requested');
                // Export data from database
                const contacts = db.contacts.getAll();
                const groups = db.groups.getAll();
                const campaigns = db.campaigns.list(); // Use list() since campaigns.getAll may not exist
                const backupData = {
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    appVersion: app.getVersion(),
                    data: {
                        contacts,
                        groups,
                        campaigns
                    }
                };
                // Show save dialog
                const result = await dialog.showSaveDialog({
                    title: 'Save WaPro Backup',
                    defaultPath: `wapro_backup_${new Date().toISOString().slice(0, 10)}.wap`,
                    filters: [
                        { name: 'WaPro Backup', extensions: ['wap'] }
                    ]
                });
                if (result.canceled || !result.filePath) {
                    return { success: false, error: 'Backup cancelled' };
                }
                // Write JSON to .wap file
                fs_1.default.writeFileSync(result.filePath, JSON.stringify(backupData, null, 2), 'utf8');
                console.log('[Sambad IPC] Database backup saved to:', result.filePath);
                return {
                    success: true,
                    message: `Backup saved successfully (${contacts.length} contacts, ${campaigns.length} campaigns)`,
                    path: result.filePath
                };
            }
            catch (error) {
                console.error('[Sambad IPC] Database backup error:', error);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('database:restore', async () => {
            try {
                console.log('[Sambad IPC] Database restore requested');
                // Show open dialog
                const result = await dialog.showOpenDialog({
                    title: 'Select WaPro Backup',
                    filters: [
                        { name: 'WaPro Backup', extensions: ['wap'] }
                    ],
                    properties: ['openFile']
                });
                if (result.canceled || result.filePaths.length === 0) {
                    return { success: false, error: 'Restore cancelled' };
                }
                const backupPath = result.filePaths[0];
                // Read and parse backup file
                const fileContent = fs_1.default.readFileSync(backupPath, 'utf8');
                const backupData = JSON.parse(fileContent);
                // Validate backup format
                if (!backupData.version || !backupData.data) {
                    return { success: false, error: 'Invalid backup file format' };
                }
                const { contacts, groups, campaigns } = backupData.data;
                // Clear existing data using direct SQL (in order to avoid foreign key conflicts)
                console.log('[Sambad IPC] Clearing existing data...');
                const database = db.getDatabase();
                database.prepare('DELETE FROM group_contacts').run();
                database.prepare('DELETE FROM campaigns').run();
                database.prepare('DELETE FROM contacts').run();
                database.prepare('DELETE FROM groups').run();
                // Import groups first (needed for relationships)
                let groupsImported = 0;
                if (groups && Array.isArray(groups)) {
                    for (const group of groups) {
                        try {
                            db.groups.create({ name: group.name });
                            groupsImported++;
                        }
                        catch (e) {
                            console.warn('[Sambad IPC] Skipped duplicate group:', group.name);
                        }
                    }
                }
                // Import contacts
                let contactsImported = 0;
                if (contacts && Array.isArray(contacts)) {
                    for (const contact of contacts) {
                        try {
                            db.contacts.create({
                                name: contact.name,
                                phone: contact.phone,
                                variables: contact.variables
                            });
                            contactsImported++;
                        }
                        catch (e) {
                            console.warn('[Sambad IPC] Skipped duplicate contact:', contact.phone);
                        }
                    }
                }
                // Import campaigns (without media paths)
                let campaignsImported = 0;
                if (campaigns && Array.isArray(campaigns)) {
                    for (const campaign of campaigns) {
                        try {
                            db.campaigns.create({
                                name: campaign.name,
                                status: 'draft', // Reset status on import
                                message_template: campaign.message_template,
                                delay_preset: campaign.delay_preset,
                                delay_min: campaign.delay_min,
                                delay_max: campaign.delay_max
                            });
                            campaignsImported++;
                        }
                        catch (e) {
                            console.warn('[Sambad IPC] Skipped campaign:', campaign.name);
                        }
                    }
                }
                console.log('[Sambad IPC] Database restored from:', backupPath);
                return {
                    success: true,
                    message: `Restored: ${contactsImported} contacts, ${groupsImported} groups, ${campaignsImported} campaigns. Please restart to see changes.`
                };
            }
            catch (error) {
                console.error('[Sambad IPC] Database restore error:', error);
                return { success: false, error: error.message };
            }
        });
        // Window control handlers for custom title bar
        ipcMain.on('window:minimize', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win)
                win.minimize();
        });
        ipcMain.on('window:maximize', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
                if (win.isMaximized()) {
                    win.unmaximize();
                }
                else {
                    win.maximize();
                }
            }
        });
        ipcMain.on('window:close', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win)
                win.close();
        });
        console.log('[Sambad IPC] IPC handlers registered successfully');
    }
    catch (error) {
        console.error('[Sambad IPC] Registration Error:', error.message);
    }
}
async function addLog(mainWindow, level, category, message, data) {
    try {
        const log = {
            timestamp: Date.now(),
            level,
            category,
            message,
            data: data ? JSON.stringify(data) : undefined
        };
        const db = await Promise.resolve().then(() => __importStar(require('./db/index.js')));
        const id = db.logs.create(log);
        if (mainWindow) {
            mainWindow.webContents.send('console:newLog', { ...log, id });
        }
    }
    catch (error) {
        console.error('[Sambad IPC] Failed to add log:', error);
    }
}
//# sourceMappingURL=ipc.js.map