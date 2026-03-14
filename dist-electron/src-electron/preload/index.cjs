"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    app: {
        getInfo: () => electron_1.ipcRenderer.invoke('app:getInfo'),
        getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
        quit: () => electron_1.ipcRenderer.invoke('app:quit'),
    },
    window: {
        minimize: () => electron_1.ipcRenderer.send('window:minimize'),
        maximize: () => electron_1.ipcRenderer.send('window:maximize'),
        close: () => electron_1.ipcRenderer.send('window:close'),
    },
    database: {
        backup: () => electron_1.ipcRenderer.invoke('database:backup'),
        restore: () => electron_1.ipcRenderer.invoke('database:restore'),
    },
    db: {
        query: (sql, params) => electron_1.ipcRenderer.invoke('db:query', sql, params),
        insert: (table, data) => electron_1.ipcRenderer.invoke('db:insert', table, data),
        update: (table, id, data) => electron_1.ipcRenderer.invoke('db:update', table, id, data),
        delete: (table, id) => electron_1.ipcRenderer.invoke('db:delete', table, id),
    },
    contacts: {
        list: () => electron_1.ipcRenderer.invoke('contacts:list'),
        test: () => electron_1.ipcRenderer.invoke('credentials:test'),
        create: (contact) => electron_1.ipcRenderer.invoke('contacts:create', contact),
        update: (id, contact) => electron_1.ipcRenderer.invoke('contacts:update', id, contact),
        delete: (id) => electron_1.ipcRenderer.invoke('contacts:delete', id),
        bulkCreate: (contactsList) => electron_1.ipcRenderer.invoke('contacts:bulkCreate', contactsList),
        findDuplicates: () => electron_1.ipcRenderer.invoke('contacts:findDuplicates'),
        removeDuplicates: () => electron_1.ipcRenderer.invoke('contacts:removeDuplicates'),
        checkExisting: (phones) => electron_1.ipcRenderer.invoke('contacts:checkExisting', phones),
    },
    campaigns: {
        list: () => electron_1.ipcRenderer.invoke('campaigns:list'),
        create: (campaign) => electron_1.ipcRenderer.invoke('campaigns:create', campaign),
        update: (id, campaign) => electron_1.ipcRenderer.invoke('campaigns:update', id, campaign),
        delete: (id) => electron_1.ipcRenderer.invoke('campaigns:delete', id),
        start: (id) => electron_1.ipcRenderer.invoke('campaigns:start', id),
        stop: (id) => electron_1.ipcRenderer.invoke('campaigns:stop', id),
        addMedia: (campaignId, media) => electron_1.ipcRenderer.invoke('campaigns:addMedia', campaignId, media),
        getMedia: (campaignId) => electron_1.ipcRenderer.invoke('campaigns:getMedia', campaignId),
        deleteMedia: (mediaId) => electron_1.ipcRenderer.invoke('campaigns:deleteMedia', mediaId),
        addContact: (campaignId, contactId) => electron_1.ipcRenderer.invoke('campaigns:addContact', campaignId, contactId),
        addContacts: (campaignId, contactIds) => electron_1.ipcRenderer.invoke('campaigns:addContacts', campaignId, contactIds),
        removeContact: (campaignId, contactId) => electron_1.ipcRenderer.invoke('campaigns:removeContact', campaignId, contactId),
        clearContacts: (campaignId) => electron_1.ipcRenderer.invoke('campaigns:clearContacts', campaignId),
        getContacts: (campaignId, skipMasking) => electron_1.ipcRenderer.invoke('campaigns:getContacts', campaignId, skipMasking),
        getFailedMessages: (campaignId) => electron_1.ipcRenderer.invoke('campaigns:getFailedMessages', campaignId),
        exportFailureReport: (campaignId, campaignName) => electron_1.ipcRenderer.invoke('campaigns:exportFailureReport', campaignId, campaignName),
    },
    campaignRuns: {
        list: () => electron_1.ipcRenderer.invoke('campaignRuns:list'),
        getById: (runId) => electron_1.ipcRenderer.invoke('campaignRuns:getByid', runId),
        getFailedMessages: (runId) => electron_1.ipcRenderer.invoke('campaignRuns:getFailedMessages', runId),
    },
    groups: {
        list: () => electron_1.ipcRenderer.invoke('groups:list'),
        create: (group) => electron_1.ipcRenderer.invoke('groups:create', group),
        update: (id, group) => electron_1.ipcRenderer.invoke('groups:update', id, group),
        delete: (id) => electron_1.ipcRenderer.invoke('groups:delete', id),
        addContact: (groupId, contactId) => electron_1.ipcRenderer.invoke('groups:addContact', groupId, contactId),
        removeContact: (groupId, contactId) => electron_1.ipcRenderer.invoke('groups:removeContact', groupId, contactId),
        getContacts: (groupId, skipMasking) => electron_1.ipcRenderer.invoke('groups:getContacts', groupId, skipMasking),
        bulkAddContacts: (groupId, contactIds) => electron_1.ipcRenderer.invoke('groups:bulkAddContacts', groupId, contactIds),
        bulkAddContactsToMultipleGroups: (groupIds, contactIds) => electron_1.ipcRenderer.invoke('groups:bulkAddContactsToMultipleGroups', groupIds, contactIds),
        findOrCreate: (name) => electron_1.ipcRenderer.invoke('groups:findOrCreate', name),
    },
    campaign: {
        start: (campaign) => {
            console.log('[Preload] Invoking campaign:start', campaign);
            return electron_1.ipcRenderer.invoke('campaign:start', campaign);
        },
        pause: () => electron_1.ipcRenderer.invoke('campaign:pause'),
        resume: () => electron_1.ipcRenderer.invoke('campaign:resume'),
        stop: () => electron_1.ipcRenderer.invoke('campaign:stop'),
        status: () => electron_1.ipcRenderer.invoke('campaign:status'),
    },
    campaignWorker: {
        start: (campaign) => electron_1.ipcRenderer.invoke('campaign:start', campaign),
        pause: () => electron_1.ipcRenderer.invoke('campaign:pause'),
        resume: () => electron_1.ipcRenderer.invoke('campaign:resume'),
        stop: () => electron_1.ipcRenderer.invoke('campaign:stop'),
        getStatus: () => electron_1.ipcRenderer.invoke('campaign:status'),
        onQrCode: (callback) => {
            const listener = (_event, data) => {
                if (data.qrCode)
                    callback(data.qrCode);
            };
            electron_1.ipcRenderer.on('campaign:qr_code', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:qr_code', listener);
        },
        onReady: (callback) => {
            const listener = () => callback();
            electron_1.ipcRenderer.on('campaign:ready', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:ready', listener);
        },
        onProgress: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('campaign:progress', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:progress', listener);
        },
        onComplete: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('campaign:complete', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:complete', listener);
        },
        onError: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('campaign:error', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:error', listener);
        },
        onPaused: (callback) => {
            const listener = (_event, data) => {
                callback(data.campaignId);
            };
            electron_1.ipcRenderer.on('campaign:paused', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:paused', listener);
        },
        onResumed: (callback) => {
            const listener = (_event, data) => {
                callback(data.campaignId);
            };
            electron_1.ipcRenderer.on('campaign:resumed', listener);
            return () => electron_1.ipcRenderer.removeListener('campaign:resumed', listener);
        },
    },
    sentinel: {
        register: (mobile) => electron_1.ipcRenderer.invoke('sentinel:register', { mobile }),
        activate: (licenseKey) => electron_1.ipcRenderer.invoke('sentinel:activate', { licenseKey }),
        getDeviceId: () => electron_1.ipcRenderer.invoke('sentinel:get-device-id'),
    },
    whatsapp: {
        connect: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:connect', serverId),
        disconnect: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:disconnect', serverId),
        logout: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:logout', serverId),
        clearSession: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:clearSession', serverId),
        sendPoll: (serverId, chatId, question, options) => electron_1.ipcRenderer.invoke('whatsapp:send-poll', serverId, chatId, question, options),
        getContacts: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:get-contacts', serverId),
        getGroups: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:get-groups', serverId),
        getGroupParticipants: (serverId, groupJid) => electron_1.ipcRenderer.invoke('whatsapp:get-group-participants', serverId, groupJid),
        importContacts: (contacts) => electron_1.ipcRenderer.invoke('whatsapp:import-contacts', contacts),
        importGroup: (serverId, group) => electron_1.ipcRenderer.invoke('whatsapp:import-group', serverId, group),
        getStatus: (serverId) => electron_1.ipcRenderer.invoke('whatsapp:status', serverId),
        getStatusAll: () => electron_1.ipcRenderer.invoke('whatsapp:status-all'),
        getPollVotes: (campaignId) => electron_1.ipcRenderer.invoke('whatsapp:get-poll-votes', campaignId),
        getPollSummary: (campaignId) => electron_1.ipcRenderer.invoke('whatsapp:get-poll-summary', campaignId),
        getPollServerStats: (campaignId) => electron_1.ipcRenderer.invoke('whatsapp:get-poll-server-stats', campaignId),
        exportPollExcel: (campaignId) => electron_1.ipcRenderer.invoke('whatsapp:export-poll-excel', campaignId),
        onQrCode: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:qr_code', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:qr_code', listener);
        },
        onReady: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:ready', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:ready', listener);
        },
        onStatus: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:status', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:status', listener);
        },
        onAuthenticated: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:authenticated', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:authenticated', listener);
        },
        onDisconnected: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:disconnected', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:disconnected', listener);
        },
        onReconnecting: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:reconnecting', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:reconnecting', listener);
        },
        onLog: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:log', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:log', listener);
        },
        onError: (callback) => {
            const listener = (_event, data) => callback(data);
            electron_1.ipcRenderer.on('whatsapp:error', listener);
            return () => electron_1.ipcRenderer.removeListener('whatsapp:error', listener);
        },
    },
    console: {
        open: () => electron_1.ipcRenderer.invoke('console:open'),
        close: () => electron_1.ipcRenderer.invoke('console:close'),
        toggle: () => electron_1.ipcRenderer.invoke('console:toggle'),
        getLogs: () => electron_1.ipcRenderer.invoke('console:getLogs'),
        clearLogs: () => electron_1.ipcRenderer.invoke('console:clearLogs'),
        exportLogs: () => electron_1.ipcRenderer.invoke('logs:export'),
        onNewLog: (callback) => {
            const listener = (_event, log) => callback(log);
            electron_1.ipcRenderer.on('console:newLog', listener);
            return () => electron_1.ipcRenderer.removeListener('console:newLog', listener);
        },
        onLogsCleared: (callback) => {
            const listener = () => callback();
            electron_1.ipcRenderer.on('console:logsCleared', listener);
            return () => electron_1.ipcRenderer.removeListener('console:logsCleared', listener);
        },
    },
    reports: {
        generate: (params) => electron_1.ipcRenderer.invoke('reports:generate', params),
    },
    supabase: {
        getStatus: () => electron_1.ipcRenderer.invoke('supabase:getStatus'),
        getConfig: () => electron_1.ipcRenderer.invoke('supabase:getConfig'),
        saveConfig: (supabaseUrl, supabaseKey) => electron_1.ipcRenderer.invoke('supabase:saveConfig', supabaseUrl, supabaseKey),
        testConnection: () => electron_1.ipcRenderer.invoke('supabase:testConnection'),
        clearConfig: () => electron_1.ipcRenderer.invoke('supabase:clearConfig'),
    },
    debug: {
        dumpLogs: () => electron_1.ipcRenderer.invoke('debug:dumpLogs'),
    },
    auth: {
        register: (data) => electron_1.ipcRenderer.invoke('auth:register', data),
        login: (credentials) => electron_1.ipcRenderer.invoke('auth:login', credentials),
        logout: () => electron_1.ipcRenderer.invoke('auth:logout'),
        forgotPassword: (email) => electron_1.ipcRenderer.invoke('auth:forgotPassword', email),
        getSession: () => electron_1.ipcRenderer.invoke('auth:getSession'),
        getProfile: () => electron_1.ipcRenderer.invoke('auth:getProfile'),
        getPermissions: () => electron_1.ipcRenderer.invoke('auth:getPermissions'),
        getSupportChallenge: () => electron_1.ipcRenderer.invoke('auth:get-support-challenge'),
        verifySupportCode: (challenge, response) => electron_1.ipcRenderer.invoke('auth:verify-support-code', { challenge, response }),
    },
    staff: {
        list: () => electron_1.ipcRenderer.invoke('staff:list'),
        updatePermission: (data) => electron_1.ipcRenderer.invoke('staff:updatePermission', data),
    },
    subscription: {
        getStatus: () => electron_1.ipcRenderer.invoke('subscription:getStatus'),
    },
    credentials: {
        has: () => electron_1.ipcRenderer.invoke('supabase:getStatus').then(result => ({
            ...result,
            data: result.data?.configured || false
        })),
        save: (supabaseUrl, supabaseKey) => electron_1.ipcRenderer.invoke('supabase:saveConfig', supabaseUrl, supabaseKey),
        test: () => electron_1.ipcRenderer.invoke('supabase:testConnection'),
    },
    chromium: {
        getPath: () => electron_1.ipcRenderer.invoke('chromium:getPath'),
        setPath: (chromiumPath) => electron_1.ipcRenderer.invoke('chromium:setPath', chromiumPath),
    },
    license: {
        activate: (licenseKey, mobile) => electron_1.ipcRenderer.invoke('license:activate', { licenseKey, mobile }),
        startTrial: (mobile) => electron_1.ipcRenderer.invoke('license:start-trial', { mobile }),
        generate: (mobile) => electron_1.ipcRenderer.invoke('license:generate', { mobile }),
        getStatus: () => electron_1.ipcRenderer.invoke('license:status'),
        checkBackdoor: (password) => electron_1.ipcRenderer.invoke('license:check-backdoor', { password }),
    },
    userAuth: {
        login: (username, password) => electron_1.ipcRenderer.invoke('auth:local-login', { username, password }),
        list: () => electron_1.ipcRenderer.invoke('user:list'),
        create: (data) => electron_1.ipcRenderer.invoke('user:create', data),
        updatePassword: (data) => electron_1.ipcRenderer.invoke('user:update-password', data),
        updateUsername: (data) => electron_1.ipcRenderer.invoke('user:update-username', data),
        delete: (userId) => electron_1.ipcRenderer.invoke('user:delete', { userId }),
        getPermissions: (userId) => electron_1.ipcRenderer.invoke('user:get-permissions', { userId }),
        setPermissions: (userId, permissions) => electron_1.ipcRenderer.invoke('user:set-permissions', { userId, permissions }),
    },
    updater: {
        checkForUpdates: () => electron_1.ipcRenderer.invoke('updater:check'),
        downloadUpdate: () => electron_1.ipcRenderer.invoke('updater:download'),
        installUpdate: () => electron_1.ipcRenderer.invoke('updater:install'),
        onUpdateAvailable: (callback) => {
            const listener = (_event, info) => callback(info);
            electron_1.ipcRenderer.on('update:available', listener);
            return () => electron_1.ipcRenderer.removeListener('update:available', listener);
        },
        onUpdateNotAvailable: (callback) => {
            const listener = () => callback();
            electron_1.ipcRenderer.on('update:not-available', listener);
            return () => electron_1.ipcRenderer.removeListener('update:not-available', listener);
        },
        onDownloadProgress: (callback) => {
            const listener = (_event, progress) => callback(progress);
            electron_1.ipcRenderer.on('update:download-progress', listener);
            return () => electron_1.ipcRenderer.removeListener('update:download-progress', listener);
        },
        onUpdateDownloaded: (callback) => {
            const listener = (_event, info) => callback(info);
            electron_1.ipcRenderer.on('update:downloaded', listener);
            return () => electron_1.ipcRenderer.removeListener('update:downloaded', listener);
        },
        onUpdateError: (callback) => {
            const listener = (_event, error) => callback(error);
            electron_1.ipcRenderer.on('update:error', listener);
            return () => electron_1.ipcRenderer.removeListener('update:error', listener);
        },
    },
    profile: {
        get: () => electron_1.ipcRenderer.invoke('profile:get'),
        save: (data) => electron_1.ipcRenderer.invoke('profile:save', data),
    },
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, callback);
    },
    removeListener: (channel, callback) => {
        electron_1.ipcRenderer.removeListener(channel, callback);
    },
};
console.log('[Preload] Starting preload script');
console.log('[Preload] contextBridge available:', typeof electron_1.contextBridge !== 'undefined');
console.log('[Preload] ipcRenderer available:', typeof electron_1.ipcRenderer !== 'undefined');
if (typeof electron_1.contextBridge === 'undefined') {
    console.error('[Preload] CRITICAL: contextBridge is undefined! Context isolation might be disabled.');
}
if (typeof electron_1.ipcRenderer === 'undefined') {
    console.error('[Preload] CRITICAL: ipcRenderer is undefined! Electron environment not detected.');
}
try {
    if (electron_1.contextBridge && electron_1.ipcRenderer) {
        electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
        console.log('[Preload] ✓ electronAPI successfully exposed to window object');
        console.log('[Preload] ✓ Available API namespaces:', Object.keys(api));
    }
    else {
        console.error('[Preload] ✗ Cannot expose API: missing contextBridge or ipcRenderer');
    }
}
catch (error) {
    console.error('[Preload] ✗ FAILED to expose electronAPI:', error);
    console.error('[Preload] Error details:', error instanceof Error ? error.message : String(error));
}
console.log('[Preload] Preload script execution completed');
//# sourceMappingURL=index.js.map