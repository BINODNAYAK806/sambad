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
export class WhatsAppClientSingleton {
    static instance;
    socks = {};
    mainWindow = null;
    states = {};
    lastErrors = {};
    userDataPath;
    phoneNumbers = {};
    authStates = {};
    saveCredsMap = {};
    // Manual Store for contacts and chats (Per server)
    contactsMap = {};
    isDirtyMap = {};
    constructor() {
        this.userDataPath = app.getPath('userData');
        console.log('[WhatsApp] Baileys multi-session client singleton created');
        // Initialize maps for 5 servers
        for (let i = 1; i <= 5; i++) {
            this.states[i] = 'idle';
            this.lastErrors[i] = null;
            this.phoneNumbers[i] = null;
            this.contactsMap[i] = {};
            this.isDirtyMap[i] = false;
            this.loadStore(i);
        }
        // Save stores every 10s if dirty
        setInterval(() => {
            for (let i = 1; i <= 5; i++) {
                if (this.isDirtyMap[i]) {
                    this.saveStore(i);
                }
            }
        }, 10_000);
    }
    getStoreFile(serverId) {
        return path.join(this.userDataPath, `baileys_store_v3_server_${serverId}.json`);
    }
    loadStore(serverId) {
        try {
            const storeFile = this.getStoreFile(serverId);
            if (fs.existsSync(storeFile)) {
                const data = fs.readFileSync(storeFile, 'utf-8');
                const parsed = JSON.parse(data);
                if (parsed.contacts) {
                    this.contactsMap[serverId] = parsed.contacts;
                    console.log(`[WhatsApp] [Server ${serverId}] Loaded ${Object.keys(this.contactsMap[serverId]).length} contacts from store`);
                }
            }
        }
        catch (error) {
            console.error(`[WhatsApp] [Server ${serverId}] Failed to load store:`, error);
        }
    }
    saveStore(serverId) {
        try {
            const storeFile = this.getStoreFile(serverId);
            const data = JSON.stringify({ contacts: this.contactsMap[serverId] });
            fs.writeFileSync(storeFile, data, 'utf-8');
            this.isDirtyMap[serverId] = false;
        }
        catch (error) {
            console.error(`[WhatsApp] [Server ${serverId}] Failed to save store:`, error);
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
    getStatus(serverId = 1) {
        return {
            state: this.states[serverId] || 'idle',
            isReady: this.states[serverId] === 'ready',
            error: this.lastErrors[serverId] || undefined,
            phoneNumber: this.phoneNumbers[serverId] || undefined,
        };
    }
    getAllStatuses() {
        const statuses = {};
        for (let i = 1; i <= 5; i++) {
            statuses[i] = this.getStatus(i);
        }
        return statuses;
    }
    lastLogTime = 0;
    log(serverId, message) {
        const fullMessage = `[Server ${serverId}] ${message}`;
        console.log(fullMessage);
        // Prevent frontend flooding: Buffer logs and send in batches/throttled
        // For immediate critical errors, we might want to send directly, but for general logs:
        // Simple throttling: Only send max 1 message per 100ms per server? 
        // Or just don't send Baileys debug/trace logs?
        // If message contains "Session error" or "Bad MAC", it's spam.
        if (message.includes('Bad MAC') || message.includes('Session error')) {
            const now = Date.now();
            if (now - this.lastLogTime < 2000)
                return; // Only 1 error per 2s
            this.lastLogTime = now;
        }
        this.sendToRenderer('whatsapp:log', { serverId, message: fullMessage });
    }
    async initialize(serverId = 1) {
        if (this.states[serverId] === 'initializing' || this.states[serverId] === 'ready') {
            this.log(serverId, 'Already initializing or ready, skipping');
            return;
        }
        this.states[serverId] = 'initializing';
        this.lastErrors[serverId] = null;
        this.log(serverId, 'Starting Baileys initialization...');
        // Force send initializing status
        this.sendToRenderer('whatsapp:status', { serverId, status: this.getStatus(serverId) });
        try {
            const authDir = path.join(this.userDataPath, `.baileys_auth_server_${serverId}`);
            this.log(serverId, `Auth directory: ${authDir}`);
            const { state, saveCreds } = await useMultiFileAuthState(authDir);
            this.authStates[serverId] = state;
            this.saveCredsMap[serverId] = saveCreds;
            this.log(serverId, 'Auth state loaded');
            // Create a custom stream to send Baileys logs to frontend
            const logStream = {
                write: (msg) => {
                    try {
                        const parsed = JSON.parse(msg);
                        this.log(serverId, `[Baileys] ${parsed.level}: ${parsed.msg}`);
                    }
                    catch (e) {
                        this.log(serverId, `[Baileys] ${msg.trim()}`);
                    }
                }
            };
            const logger = pino({ level: 'debug' }, logStream);
            this.log(serverId, 'Fetching latest WhatsApp version...');
            const { version, isLatest } = await fetchLatestBaileysVersion();
            this.log(serverId, `Using version v${version.join('.')}, isLatest: ${isLatest}`);
            const sock = makeWASocket({
                version,
                auth: this.authStates[serverId],
                logger,
                printQRInTerminal: false,
                browser: Browsers.ubuntu('Chrome'),
                connectTimeoutMs: 60000,
            });
            this.socks[serverId] = sock;
            // Set up event listeners BEFORE any connection logic to ensure we don't miss anything
            this.setupEventListeners(serverId);
            this.log(serverId, 'Baileys socket created and listening');
        }
        catch (err) {
            console.error(`[WhatsApp] [Server ${serverId}] Initialization failed:`, err);
            this.log(serverId, `Initialization failed: ${err.message}`);
            this.states[serverId] = 'error';
            this.lastErrors[serverId] = err.message || 'Unknown initialization error';
            this.sendToRenderer('whatsapp:error', { serverId, error: this.lastErrors[serverId] });
            throw err;
        }
    }
    setupEventListeners(serverId) {
        const sock = this.socks[serverId];
        if (!sock)
            return;
        // --- Manual Store Sync Listeners ---
        // 1. Initial history/set events (Full sync)
        sock.ev.on('messaging-history.set', ({ contacts, chats }) => {
            this.log(serverId, `DEBUG: messaging-history.set fired. Contacts: ${contacts?.length || 0}, Chats: ${chats?.length || 0}`);
            if (contacts) {
                contacts.forEach(c => {
                    this.contactsMap[serverId][c.id] = { ...this.contactsMap[serverId][c.id], ...c };
                });
                this.isDirtyMap[serverId] = true;
            }
            if (chats) {
                chats.forEach(chat => {
                    if (chat.id.endsWith('@s.whatsapp.net')) {
                        const existing = this.contactsMap[serverId][chat.id] || {};
                        const c = chat;
                        this.contactsMap[serverId][chat.id] = {
                            ...existing,
                            id: chat.id,
                            name: chat.name || existing.name || '',
                            notify: c.notify || existing.notify || ''
                        };
                    }
                });
                this.isDirtyMap[serverId] = true;
            }
        });
        // Some versions use .set instead of messaging-history.set
        sock.ev.on('contacts.set', ({ contacts }) => {
            this.log(serverId, `DEBUG: contacts.set fired. Count: ${contacts?.length || 0}`);
            if (contacts) {
                contacts.forEach((c) => {
                    this.contactsMap[serverId][c.id] = { ...this.contactsMap[serverId][c.id], ...c };
                });
                this.isDirtyMap[serverId] = true;
            }
        });
        sock.ev.on('chats.set', ({ chats }) => {
            this.log(serverId, `DEBUG: chats.set fired. Count: ${chats?.length || 0}`);
            if (chats) {
                chats.forEach((chat) => {
                    if (chat.id.endsWith('@s.whatsapp.net')) {
                        const existing = this.contactsMap[serverId][chat.id] || {};
                        this.contactsMap[serverId][chat.id] = {
                            ...existing,
                            id: chat.id,
                            name: chat.name || existing.name || '',
                            notify: chat.notify || existing.notify || ''
                        };
                    }
                });
                this.isDirtyMap[serverId] = true;
            }
        });
        // 2. Contacts upsert/update
        sock.ev.on('contacts.upsert', (update) => {
            this.log(serverId, `DEBUG: contacts.upsert fired. Count: ${update?.length || 0}`);
            let count = 0;
            update.forEach(c => {
                if (c.id && c.id.endsWith('@s.whatsapp.net')) {
                    this.contactsMap[serverId][c.id] = { ...this.contactsMap[serverId][c.id], ...c };
                    count++;
                }
            });
            if (count > 0) {
                this.isDirtyMap[serverId] = true;
            }
        });
        sock.ev.on('contacts.update', (update) => {
            let count = 0;
            update.forEach(c => {
                if (c.id && this.contactsMap[serverId][c.id]) {
                    Object.assign(this.contactsMap[serverId][c.id], c);
                    count++;
                }
            });
            if (count > 0) {
                this.isDirtyMap[serverId] = true;
                this.log(serverId, `Contacts Update: Refreshed ${count} contacts`);
            }
        });
        // 3. Chats upsert/update (Critical for contacts that haven't been "saved" but exist in chat list)
        sock.ev.on('chats.upsert', (updates) => {
            this.log(serverId, `DEBUG: chats.upsert fired. Count: ${updates?.length || 0}`);
            let count = 0;
            updates.forEach(chat => {
                if (chat.id.endsWith('@s.whatsapp.net')) {
                    const existing = this.contactsMap[serverId][chat.id] || {};
                    const c = chat;
                    this.contactsMap[serverId][chat.id] = {
                        ...existing,
                        id: chat.id,
                        name: chat.name || existing.name || '',
                        notify: c.notify || existing.notify || ''
                    };
                    count++;
                }
            });
            if (count > 0) {
                this.isDirtyMap[serverId] = true;
                this.log(serverId, `Chats Upsert: Captured ${count} contacts from chat list`);
            }
        });
        sock.ev.on('chats.update', (updates) => {
            this.log(serverId, `DEBUG: chats.update fired. Count: ${updates?.length || 0}`);
            let count = 0;
            updates.forEach(chat => {
                if (chat.id && chat.id.endsWith('@s.whatsapp.net')) {
                    const existing = this.contactsMap[serverId][chat.id] || {};
                    const c = chat;
                    if (chat.name || c.notify) {
                        this.contactsMap[serverId][chat.id] = {
                            ...existing,
                            name: chat.name || existing.name || '',
                            notify: c.notify || existing.notify || ''
                        };
                        count++;
                    }
                }
            });
            if (count > 0) {
                this.isDirtyMap[serverId] = true;
                this.log(serverId, `Chats Update: Updated ${count} contact names`);
            }
        });
        // 4. Message upsert (Capture JIDs from incoming/outgoing traffic)
        sock.ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                const jid = msg.key.remoteJid;
                if (jid && jid.endsWith('@s.whatsapp.net')) {
                    if (!this.contactsMap[serverId][jid]) {
                        this.contactsMap[serverId][jid] = {
                            id: jid,
                            name: msg.pushName || '',
                            notify: msg.pushName || ''
                        };
                        this.isDirtyMap[serverId] = true;
                        this.log(serverId, `DEBUG: Discovered contact ${jid} from message traffic`);
                    }
                    else if (msg.pushName && !this.contactsMap[serverId][jid].name) {
                        this.contactsMap[serverId][jid].name = msg.pushName;
                        this.isDirtyMap[serverId] = true;
                    }
                }
            });
        });
        // 5. Message receipts (Another source of JIDs)
        sock.ev.on('message-receipt.update', (updates) => {
            updates.forEach(update => {
                const jid = update.key.remoteJid;
                if (jid && jid.endsWith('@s.whatsapp.net') && !this.contactsMap[serverId][jid]) {
                    this.contactsMap[serverId][jid] = { id: jid, name: '' };
                    this.isDirtyMap[serverId] = true;
                }
            });
        });
        // ✅ Poll Vote Updates
        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                // Check if this is a poll vote update
                if (update.update?.pollUpdates && update.key?.id) {
                    const messageId = update.key.id;
                    const pollUpdates = update.update.pollUpdates;
                    this.log(serverId, `Poll votes received for message ${messageId}`);
                    for (const pollUpdate of pollUpdates) {
                        if (pollUpdate.pollUpdateMessageKey && pollUpdate.vote) {
                            const voterJid = pollUpdate.pollUpdateMessageKey.participant || pollUpdate.pollUpdateMessageKey.remoteJid;
                            const selectedOptions = pollUpdate.vote?.selectedOptions || [];
                            if (voterJid && selectedOptions.length > 0) {
                                // Get voter info
                                const contact = this.contactsMap[serverId][voterJid];
                                const voterName = contact?.name || contact?.notify || 'Unknown';
                                const voterPhone = voterJid.split('@')[0];
                                const selectedOption = selectedOptions[0]; // First option
                                this.log(serverId, `Poll vote: ${voterName} (${voterPhone}) voted for option ${selectedOption}`);
                                // Store in database - import at top of file
                                const { storePollVote } = require('../db/index');
                                storePollVote(messageId, voterJid, voterName, voterPhone, selectedOption);
                            }
                        }
                    }
                }
            }
        });
        // --- Connection Updates ---
        // Connection updates (QR, connected, disconnected)
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            // QR Code
            if (qr) {
                this.log(serverId, 'QR Code received');
                this.states[serverId] = 'qr';
                try {
                    const dataUrl = await QRCode.toDataURL(qr);
                    this.sendToRenderer('whatsapp:qr_code', { serverId, qrCode: dataUrl });
                }
                catch (err) {
                    console.error(`[WhatsApp] [Server ${serverId}] Failed to generate QR:`, err);
                    this.log(serverId, `Failed to generate QR: ${err.message}`);
                    this.sendToRenderer('whatsapp:qr_code', { serverId, qrCode: qr });
                }
            }
            // Connected
            if (connection === 'open') {
                this.log(serverId, 'Connected and ready!');
                this.states[serverId] = 'ready';
                // Get phone number
                if (sock.user?.id) {
                    this.phoneNumbers[serverId] = sock.user.id.split(':')[0];
                    this.log(serverId, `Logged in as: ${this.phoneNumbers[serverId]}`);
                }
                this.sendToRenderer('whatsapp:authenticated', { serverId });
                this.sendToRenderer('whatsapp:ready', { serverId, phoneNumber: this.phoneNumbers[serverId] });
                this.sendToRenderer('whatsapp:status', { serverId, status: this.getStatus(serverId) });
            }
            // Disconnected
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                this.log(serverId, `Connection closed. StatusCode: ${statusCode}, Reconnect: ${shouldReconnect}`);
                if (statusCode === DisconnectReason.loggedOut) {
                    this.states[serverId] = 'disconnected';
                    this.sendToRenderer('whatsapp:disconnected', { serverId, reason: 'Logged out' });
                }
                else if (shouldReconnect) {
                    // Auto-reconnect on network issues
                    this.log(serverId, 'Auto-reconnecting...');
                    this.states[serverId] = 'idle';
                    this.sendToRenderer('whatsapp:reconnecting', { serverId, message: 'Network connection lost. Reconnecting...' });
                    setTimeout(() => this.initialize(serverId), 3000);
                }
                else {
                    this.states[serverId] = 'error';
                    this.lastErrors[serverId] = 'Connection failed';
                    this.sendToRenderer('whatsapp:error', { serverId, error: this.lastErrors[serverId] });
                }
                this.sendToRenderer('whatsapp:status', { serverId, status: this.getStatus(serverId) });
            }
        });
        // Credentials update (save session)
        sock.ev.on('creds.update', this.saveCredsMap[serverId]);
    }
    async disconnect(serverId = 1) {
        const sock = this.socks[serverId];
        if (sock) {
            try {
                await sock.logout();
                console.log(`[WhatsApp] [Server ${serverId}] Disconnected`);
            }
            catch (err) {
                console.error(`[WhatsApp] [Server ${serverId}] Error disconnecting:`, err);
            }
            this.socks[serverId] = null;
        }
        this.states[serverId] = 'idle';
        this.sendToRenderer('whatsapp:status', { serverId, status: this.getStatus(serverId) });
    }
    async logout(serverId = 1) {
        this.log(serverId, 'Logout requested...');
        // 1. Call Baileys logout if connected
        const sock = this.socks[serverId];
        if (sock) {
            try {
                await sock.logout();
                this.log(serverId, 'Baileys logout successful');
            }
            catch (err) {
                console.error(`[WhatsApp] [Server ${serverId}] Error during Baileys logout:`, err);
            }
            this.socks[serverId] = null;
        }
        // 2. Clear session files
        const authDir = path.join(this.userDataPath, `.baileys_auth_server_${serverId}`);
        try {
            if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                this.log(serverId, 'Session files cleared successfully');
            }
        }
        catch (err) {
            console.error(`[WhatsApp] [Server ${serverId}] Error clearing session files:`, err);
        }
        // 3. Reset state
        this.states[serverId] = 'idle';
        this.authStates[serverId] = null;
        this.saveCredsMap[serverId] = null;
        this.phoneNumbers[serverId] = null;
        // 4. Notify frontend
        this.sendToRenderer('whatsapp:disconnected', { serverId, reason: 'logout' });
        this.sendToRenderer('whatsapp:status', { serverId, status: this.getStatus(serverId) });
        this.log(serverId, 'Logout complete - session cleared');
    }
    async sendMessage(serverId, chatId, content, options) {
        const sock = this.socks[serverId];
        if (this.states[serverId] !== 'ready' || !sock) {
            throw new Error(`WhatsApp server ${serverId} is not ready`);
        }
        const jid = this.formatJid(chatId);
        // If content is media (has mimetype, data, filename)
        if (content.mimetype && content.data) {
            console.log(`[WhatsApp] 📄 Sending media message to ${jid} - Mime: ${content.mimetype}`);
            const buffer = Buffer.from(content.data, 'base64');
            const messageContent = {};
            // Determine media type
            if (content.mimetype.startsWith('image/')) {
                messageContent.image = buffer;
                console.log(`[WhatsApp] 🖼️ Classified as IMAGE`);
            }
            else if (content.mimetype.startsWith('video/')) {
                messageContent.video = buffer;
                console.log(`[WhatsApp] 🎥 Classified as VIDEO`);
            }
            else if (content.mimetype === 'application/pdf') {
                messageContent.document = buffer;
                messageContent.fileName = content.filename || 'document.pdf';
                messageContent.mimetype = 'application/pdf';
                console.log(`[WhatsApp] 📄 Classified as PDF`);
            }
            else {
                messageContent.document = buffer;
                messageContent.fileName = content.filename || 'file';
                messageContent.mimetype = content.mimetype;
                console.log(`[WhatsApp] 📂 Classified as DOCUMENT`);
            }
            // Add caption if provided
            if (options?.caption) {
                console.log(`[WhatsApp] 🏷️ Adding caption to media: "${options.caption.substring(0, 50)}${options.caption.length > 50 ? '...' : ''}"`);
                messageContent.caption = options.caption;
            }
            else {
                console.warn(`[WhatsApp] ⚠️ No caption provided in options for media message`);
            }
            console.log(`[WhatsApp] 📤 Final Baileys Payload Keys: ${Object.keys(messageContent).join(', ')}`);
            const result = await sock.sendMessage(jid, messageContent);
            console.log(`[WhatsApp] ✅ Media message sent successfully`);
            return result;
        }
        // Text message
        return await sock.sendMessage(jid, { text: content });
    }
    async sendPoll(serverId, chatId, question, options) {
        const sock = this.socks[serverId];
        if (this.states[serverId] !== 'ready' || !sock) {
            throw new Error(`WhatsApp server ${serverId} is not ready`);
        }
        const jid = this.formatJid(chatId);
        return await sock.sendMessage(jid, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        });
    }
    async getNumberId(serverId, number) {
        const sock = this.socks[serverId];
        if (!sock)
            return null;
        try {
            const jid = this.formatJid(number);
            const results = await sock.onWhatsApp(jid);
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
            console.error(`[WhatsApp] [Server ${serverId}] Error checking number:`, err);
            return null;
        }
    }
    getMessageMedia() {
        // Return a helper object for creating media messages
        return {
            fromFilePath: (filePath, typeHint) => {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found: ${filePath}`);
                }
                const data = fs.readFileSync(filePath);
                const base64 = data.toString('base64');
                let mimetype = mime.lookup(filePath) || 'application/octet-stream';
                const filename = path.basename(filePath);
                // If mimetype detection failed, use the typeHint from DB
                if (mimetype === 'application/octet-stream' && typeHint) {
                    if (typeHint === 'image')
                        mimetype = 'image/jpeg';
                    else if (typeHint === 'video')
                        mimetype = 'video/mp4';
                    else if (typeHint === 'pdf')
                        mimetype = 'application/pdf';
                }
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
    async getAllContacts(serverId = 1) {
        const contacts = this.contactsMap[serverId] || {};
        const rawValues = Object.values(contacts);
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
        console.log(`[WhatsApp] [Server ${serverId}] getAllContacts: Returning ${result.length} user contacts`);
        return result;
    }
    async getAllGroups(serverId = 1) {
        const sock = this.socks[serverId];
        if (!sock)
            return [];
        try {
            const groups = await sock.groupFetchAllParticipating();
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
            console.error(`[WhatsApp] [Server ${serverId}] Failed to fetch groups:`, error);
            return [];
        }
    }
    // Fetch detailed participants for a specific group (includes phone_number attr)
    async getGroupParticipantsDetailed(serverId, groupJid) {
        const sock = this.socks[serverId];
        if (!sock)
            return [];
        try {
            const metadata = await sock.groupMetadata(groupJid);
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
            console.error(`[WhatsApp] [Server ${serverId}] Failed to fetch group participants:`, error);
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