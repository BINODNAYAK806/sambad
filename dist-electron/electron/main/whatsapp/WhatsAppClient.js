/**
 * WhatsAppClient - Baileys Integration
 *
 * Uses @whiskeysockets/baileys - a native WhatsApp protocol implementation
 * More stable than Puppeteer-based solutions, actively maintained
 */
import { app } from 'electron';
import * as path from 'path';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, } from '@whiskeysockets/baileys';
import pino from 'pino';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as QRCode from 'qrcode';
class WhatsAppClientSingleton {
    static instance;
    sock = null;
    mainWindow = null;
    state = 'idle';
    lastError = null;
    userDataPath;
    phoneNumber = null;
    authState = null;
    saveCreds = null;
    // Manual Store for contacts and chats
    contacts = {};
    storeFile;
    isDirty = false;
    constructor() {
        this.userDataPath = app.getPath('userData');
        this.storeFile = path.join(this.userDataPath, 'baileys_store_v3.json');
        console.log('[WhatsApp] Baileys client singleton created');
        // Load Store
        this.loadStore();
        // Save store every 10s if dirty
        setInterval(() => {
            if (this.isDirty) {
                this.saveStore();
            }
        }, 10_000);
    }
    loadStore() {
        try {
            if (fs.existsSync(this.storeFile)) {
                const data = fs.readFileSync(this.storeFile, 'utf-8');
                const parsed = JSON.parse(data);
                if (parsed.contacts) {
                    this.contacts = parsed.contacts;
                    console.log(`[WhatsApp] Loaded ${Object.keys(this.contacts).length} contacts from store`);
                }
            }
        }
        catch (error) {
            console.error('[WhatsApp] Failed to load store:', error);
        }
    }
    saveStore() {
        try {
            const data = JSON.stringify({ contacts: this.contacts });
            fs.writeFileSync(this.storeFile, data, 'utf-8');
            this.isDirty = false;
        }
        catch (error) {
            console.error('[WhatsApp] Failed to save store:', error);
        }
    }
    static getInstance() {
        if (!WhatsAppClientSingleton.instance) {
            WhatsAppClientSingleton.instance = new WhatsAppClientSingleton();
        }
        return WhatsAppClientSingleton.instance;
    }
    setMainWindow(window) {
        this.mainWindow = window;
        console.log('[WhatsApp] MainWindow set');
    }
    getStatus() {
        return {
            state: this.state,
            isReady: this.state === 'ready',
            error: this.lastError || undefined,
            phoneNumber: this.phoneNumber || undefined,
        };
    }
    log(message) {
        console.log(message);
        this.sendToRenderer('whatsapp:log', message);
    }
    async initialize() {
        if (this.state === 'initializing' || this.state === 'ready') {
            this.log('[WhatsApp] Already initializing or ready, skipping');
            return;
        }
        this.state = 'initializing';
        this.lastError = null;
        this.log('[WhatsApp] Starting Baileys initialization...');
        // Force send initializing status
        this.sendToRenderer('whatsapp:status', this.getStatus());
        try {
            const authDir = path.join(this.userDataPath, '.baileys_auth');
            this.log(`[WhatsApp] Auth directory: ${authDir}`);
            const { state, saveCreds } = await useMultiFileAuthState(authDir);
            this.authState = state;
            this.saveCreds = saveCreds;
            this.log('[WhatsApp] Auth state loaded');
            // Create a custom stream to send Baileys logs to frontend
            const logStream = {
                write: (msg) => {
                    try {
                        const parsed = JSON.parse(msg);
                        this.log(`[Baileys] ${parsed.level}: ${parsed.msg}`);
                    }
                    catch (e) {
                        this.log(`[Baileys] ${msg.trim()}`);
                    }
                }
            };
            const logger = pino({ level: 'debug' }, logStream);
            this.log('[WhatsApp] Fetching latest WhatsApp version...');
            const { version, isLatest } = await fetchLatestBaileysVersion();
            this.log(`[WhatsApp] Using version v${version.join('.')}, isLatest: ${isLatest}`);
            this.sock = makeWASocket({
                version,
                auth: this.authState,
                logger,
                printQRInTerminal: false,
                browser: Browsers.ubuntu('Chrome'),
                connectTimeoutMs: 60000,
            });
            // Set up event listeners BEFORE any connection logic to ensure we don't miss anything
            this.setupEventListeners();
            this.log('[WhatsApp] Baileys socket created and listening');
        }
        catch (err) {
            console.error('[WhatsApp] Initialization failed:', err);
            this.log(`[WhatsApp] Initialization failed: ${err.message}`);
            this.state = 'error';
            this.lastError = err.message || 'Unknown initialization error';
            this.sendToRenderer('whatsapp:error', { error: this.lastError });
            throw err;
        }
    }
    setupEventListeners() {
        if (!this.sock)
            return;
        // --- Manual Store Sync Listeners ---
        // 1. Initial history/set events (Full sync)
        this.sock.ev.on('messaging-history.set', ({ contacts, chats }) => {
            this.log(`[WhatsApp] DEBUG: messaging-history.set fired. Contacts: ${contacts?.length || 0}, Chats: ${chats?.length || 0}`);
            if (contacts) {
                contacts.forEach(c => {
                    this.contacts[c.id] = { ...this.contacts[c.id], ...c };
                });
                this.isDirty = true;
            }
            if (chats) {
                chats.forEach(chat => {
                    if (chat.id.endsWith('@s.whatsapp.net')) {
                        const existing = this.contacts[chat.id] || {};
                        const c = chat;
                        this.contacts[chat.id] = {
                            ...existing,
                            id: chat.id,
                            name: chat.name || existing.name || '',
                            notify: c.notify || existing.notify || ''
                        };
                    }
                });
                this.isDirty = true;
            }
        });
        // Some versions use .set instead of messaging-history.set
        this.sock.ev.on('contacts.set', ({ contacts }) => {
            this.log(`[WhatsApp] DEBUG: contacts.set fired. Count: ${contacts?.length || 0}`);
            if (contacts) {
                contacts.forEach((c) => {
                    this.contacts[c.id] = { ...this.contacts[c.id], ...c };
                });
                this.isDirty = true;
            }
        });
        this.sock.ev.on('chats.set', ({ chats }) => {
            this.log(`[WhatsApp] DEBUG: chats.set fired. Count: ${chats?.length || 0}`);
            if (chats) {
                chats.forEach((chat) => {
                    if (chat.id.endsWith('@s.whatsapp.net')) {
                        const existing = this.contacts[chat.id] || {};
                        this.contacts[chat.id] = {
                            ...existing,
                            id: chat.id,
                            name: chat.name || existing.name || '',
                            notify: chat.notify || existing.notify || ''
                        };
                    }
                });
                this.isDirty = true;
            }
        });
        // 2. Contacts upsert/update
        this.sock.ev.on('contacts.upsert', (update) => {
            this.log(`[WhatsApp] DEBUG: contacts.upsert fired. Count: ${update?.length || 0}`);
            let count = 0;
            update.forEach(c => {
                if (c.id && c.id.endsWith('@s.whatsapp.net')) {
                    this.contacts[c.id] = { ...this.contacts[c.id], ...c };
                    count++;
                }
            });
            if (count > 0) {
                this.isDirty = true;
            }
        });
        this.sock.ev.on('contacts.update', (update) => {
            let count = 0;
            update.forEach(c => {
                if (c.id && this.contacts[c.id]) {
                    Object.assign(this.contacts[c.id], c);
                    count++;
                }
            });
            if (count > 0) {
                this.isDirty = true;
                this.log(`[WhatsApp] Contacts Update: Refreshed ${count} contacts`);
            }
        });
        // 3. Chats upsert/update (Critical for contacts that haven't been "saved" but exist in chat list)
        this.sock.ev.on('chats.upsert', (updates) => {
            this.log(`[WhatsApp] DEBUG: chats.upsert fired. Count: ${updates?.length || 0}`);
            let count = 0;
            updates.forEach(chat => {
                if (chat.id.endsWith('@s.whatsapp.net')) {
                    const existing = this.contacts[chat.id] || {};
                    const c = chat;
                    this.contacts[chat.id] = {
                        ...existing,
                        id: chat.id,
                        name: chat.name || existing.name || '',
                        notify: c.notify || existing.notify || ''
                    };
                    count++;
                }
            });
            if (count > 0) {
                this.isDirty = true;
                this.log(`[WhatsApp] Chats Upsert: Captured ${count} contacts from chat list`);
            }
        });
        this.sock.ev.on('chats.update', (updates) => {
            this.log(`[WhatsApp] DEBUG: chats.update fired. Count: ${updates?.length || 0}`);
            let count = 0;
            updates.forEach(chat => {
                if (chat.id && chat.id.endsWith('@s.whatsapp.net')) {
                    const existing = this.contacts[chat.id] || {};
                    const c = chat;
                    if (chat.name || c.notify) {
                        this.contacts[chat.id] = {
                            ...existing,
                            name: chat.name || existing.name || '',
                            notify: c.notify || existing.notify || ''
                        };
                        count++;
                    }
                }
            });
            if (count > 0) {
                this.isDirty = true;
                this.log(`[WhatsApp] Chats Update: Updated ${count} contact names`);
            }
        });
        // 4. Message upsert (Capture JIDs from incoming/outgoing traffic)
        this.sock.ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                const jid = msg.key.remoteJid;
                if (jid && jid.endsWith('@s.whatsapp.net')) {
                    if (!this.contacts[jid]) {
                        this.contacts[jid] = {
                            id: jid,
                            name: msg.pushName || '',
                            notify: msg.pushName || ''
                        };
                        this.isDirty = true;
                        this.log(`[WhatsApp] DEBUG: Discovered contact ${jid} from message traffic`);
                    }
                    else if (msg.pushName && !this.contacts[jid].name) {
                        this.contacts[jid].name = msg.pushName;
                        this.isDirty = true;
                    }
                }
            });
        });
        // 5. Message receipts (Another source of JIDs)
        this.sock.ev.on('message-receipt.update', (updates) => {
            updates.forEach(update => {
                const jid = update.key.remoteJid;
                if (jid && jid.endsWith('@s.whatsapp.net') && !this.contacts[jid]) {
                    this.contacts[jid] = { id: jid, name: '' };
                    this.isDirty = true;
                    this.log(`[WhatsApp] DEBUG: Discovered contact ${jid} from receipt`);
                }
            });
        });
        // --- Connection Updates ---
        // Connection updates (QR, connected, disconnected)
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            // QR Code
            if (qr) {
                this.log('[WhatsApp] QR Code received');
                this.state = 'qr';
                try {
                    const dataUrl = await QRCode.toDataURL(qr);
                    this.sendToRenderer('whatsapp:qr_code', { qrCode: dataUrl });
                }
                catch (err) {
                    console.error('[WhatsApp] Failed to generate QR:', err);
                    this.log(`[WhatsApp] Failed to generate QR: ${err.message}`);
                    this.sendToRenderer('whatsapp:qr_code', { qrCode: qr });
                }
            }
            // Connected
            if (connection === 'open') {
                this.log('[WhatsApp] Connected and ready!');
                this.state = 'ready';
                // Get phone number
                if (this.sock?.user?.id) {
                    this.phoneNumber = this.sock.user.id.split(':')[0];
                    this.log(`[WhatsApp] Logged in as: ${this.phoneNumber}`);
                }
                this.sendToRenderer('whatsapp:authenticated', {});
                this.sendToRenderer('whatsapp:ready', { phoneNumber: this.phoneNumber });
            }
            // Disconnected
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                this.log(`[WhatsApp] Connection closed. StatusCode: ${statusCode}, Reconnect: ${shouldReconnect}`);
                if (statusCode === DisconnectReason.loggedOut) {
                    this.state = 'disconnected';
                    this.sendToRenderer('whatsapp:disconnected', { reason: 'Logged out' });
                }
                else if (shouldReconnect) {
                    // Auto-reconnect on network issues
                    this.log('[WhatsApp] Auto-reconnecting...');
                    this.state = 'idle';
                    setTimeout(() => this.initialize(), 3000);
                }
                else {
                    this.state = 'error';
                    this.lastError = 'Connection failed';
                    this.sendToRenderer('whatsapp:error', { error: this.lastError });
                }
            }
        });
        // Credentials update (save session)
        this.sock.ev.on('creds.update', this.saveCreds);
    }
    async disconnect() {
        if (this.sock) {
            try {
                await this.sock?.logout();
                console.log('[WhatsApp] Disconnected');
            }
            catch (err) {
                console.error('[WhatsApp] Error disconnecting:', err);
            }
            this.sock = null;
        }
        this.state = 'idle';
    }
    async logout() {
        this.log('[WhatsApp] Logout requested...');
        // 1. Call Baileys logout if connected
        if (this.sock) {
            try {
                await this.sock.logout();
                this.log('[WhatsApp] Baileys logout successful');
            }
            catch (err) {
                console.error('[WhatsApp] Error during Baileys logout:', err);
            }
            this.sock = null;
        }
        // 2. Clear session files
        const authDir = path.join(this.userDataPath, '.baileys_auth');
        try {
            if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                this.log('[WhatsApp] Session files cleared successfully');
            }
        }
        catch (err) {
            console.error('[WhatsApp] Error clearing session files:', err);
        }
        // 3. Reset state
        this.state = 'idle';
        this.authState = null;
        this.saveCreds = null;
        this.phoneNumber = null;
        // 4. Notify frontend
        this.sendToRenderer('whatsapp:disconnected', { reason: 'logout' });
        this.sendToRenderer('whatsapp:status', this.getStatus());
        this.log('[WhatsApp] Logout complete - session cleared');
    }
    async sendMessage(chatId, content, options) {
        if (this.state !== 'ready' || !this.sock) {
            throw new Error('WhatsApp client is not ready');
        }
        const jid = this.formatJid(chatId);
        // If content is media (has mimetype, data, filename)
        if (content.mimetype && content.data) {
            const buffer = Buffer.from(content.data, 'base64');
            const messageContent = {};
            // Determine media type
            if (content.mimetype.startsWith('image/')) {
                messageContent.image = buffer;
            }
            else if (content.mimetype.startsWith('video/')) {
                messageContent.video = buffer;
            }
            else if (content.mimetype === 'application/pdf') {
                messageContent.document = buffer;
                messageContent.fileName = content.filename || 'document.pdf';
            }
            else {
                messageContent.document = buffer;
                messageContent.fileName = content.filename || 'file';
            }
            // Add caption if provided
            if (options?.caption) {
                messageContent.caption = options.caption;
            }
            return await this.sock.sendMessage(jid, messageContent);
        }
        // Text message
        return await this.sock.sendMessage(jid, { text: content });
    }
    async getNumberId(number) {
        if (!this.sock)
            return null;
        try {
            const jid = this.formatJid(number);
            const results = await this.sock.onWhatsApp(jid);
            if (!results || results.length === 0) {
                return null;
            }
            const [result] = results;
            if (result?.exists) {
                return { _serialized: result.jid };
            }
            return null;
        }
        catch (err) {
            console.error('[WhatsApp] Error checking number:', err);
            return null;
        }
    }
    getMessageMedia() {
        // Return a helper object for creating media messages
        return {
            fromFilePath: (filePath) => {
                const data = fs.readFileSync(filePath);
                const base64 = data.toString('base64');
                const mimetype = mime.lookup(filePath) || 'application/octet-stream';
                const filename = path.basename(filePath);
                return {
                    mimetype,
                    data: base64,
                    filename
                };
            }
        };
    }
    formatJid(phoneNumber) {
        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        // If already has @s.whatsapp.net suffix, return as is
        if (phoneNumber.includes('@')) {
            return phoneNumber;
        }
        // Add WhatsApp suffix
        return `${cleaned}@s.whatsapp.net`;
    }
    async getAllContacts() {
        const rawValues = Object.values(this.contacts);
        // Simple mapping: ID and Name
        const result = rawValues
            .filter((c) => c.id && c.id.endsWith('@s.whatsapp.net'))
            .map((c) => ({
            id: c.id,
            name: c.name || c.notify || c.verifiedName || '',
            // Fallback to phone number if no name
            displayName: c.name || c.notify || c.verifiedName || c.id.split('@')[0]
        }))
            .sort((a, b) => (a.name || 'z').localeCompare(b.name || 'z'));
        console.log(`[WhatsApp] getAllContacts: Returning ${result.length} user contacts`);
        return result;
    }
    async getAllGroups() {
        if (!this.sock)
            return [];
        try {
            const groups = await this.sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);
            return groupList.map((g) => ({
                id: g.id,
                subject: g.subject,
                creation: g.creation,
                owner: g.owner,
                desc: g.desc,
                participants: g.participants.map((p) => {
                    const realJid = p.jid || p.id;
                    const phone = realJid ? realJid.split('@')[0] : null;
                    const isLid = p.id && p.id.includes('@lid') && !p.jid;
                    return {
                        id: p.id,
                        jid: p.jid,
                        phone: phone,
                        isLinkedDevice: isLid,
                        admin: p.admin
                    };
                })
            }));
        }
        catch (error) {
            console.error('[WhatsApp] Failed to fetch groups:', error);
            return [];
        }
    }
    // Fetch detailed participants for a specific group (includes phone_number attr)
    async getGroupParticipantsDetailed(groupJid) {
        if (!this.sock)
            return [];
        try {
            const metadata = await this.sock.groupMetadata(groupJid);
            return metadata.participants.map((p) => {
                const realJid = p.jid || p.id;
                const phone = realJid ? realJid.split('@')[0] : null;
                const isLid = p.id && p.id.includes('@lid') && !p.jid;
                return {
                    id: p.id,
                    jid: p.jid,
                    phone: phone,
                    isLinkedDevice: isLid,
                    admin: p.admin
                };
            });
        }
        catch (error) {
            console.error('[WhatsApp] Failed to fetch group participants:', error);
            return [];
        }
    }
    sendToRenderer(channel, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
}
export const whatsAppClient = WhatsAppClientSingleton.getInstance();
//# sourceMappingURL=WhatsAppClient.js.map