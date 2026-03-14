"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    app: {
        getInfo: () => electron_1.ipcRenderer.invoke('app:getInfo'),
        getPath: (name) => electron_1.ipcRenderer.invoke('app:getPath', name),
        quit: () => electron_1.ipcRenderer.invoke('app:quit'),
    },
    db: {
        query: (sql, params) => electron_1.ipcRenderer.invoke('db:query', sql, params),
        insert: (table, data) => electron_1.ipcRenderer.invoke('db:insert', table, data),
        update: (table, id, data) => electron_1.ipcRenderer.invoke('db:update', table, id, data),
        delete: (table, id) => electron_1.ipcRenderer.invoke('db:delete', table, id),
    },
    contacts: {
        list: () => electron_1.ipcRenderer.invoke('contacts:list'),
        create: (contact) => electron_1.ipcRenderer.invoke('contacts:create', contact),
        update: (id, contact) => electron_1.ipcRenderer.invoke('contacts:update', id, contact),
        delete: (id) => electron_1.ipcRenderer.invoke('contacts:delete', id),
    },
    campaigns: {
        list: () => electron_1.ipcRenderer.invoke('campaigns:list'),
        create: (campaign) => electron_1.ipcRenderer.invoke('campaigns:create', campaign),
        update: (id, campaign) => electron_1.ipcRenderer.invoke('campaigns:update', id, campaign),
        delete: (id) => electron_1.ipcRenderer.invoke('campaigns:delete', id),
        start: (id) => electron_1.ipcRenderer.invoke('campaigns:start', id),
        stop: (id) => electron_1.ipcRenderer.invoke('campaigns:stop', id),
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
    console: {
        open: () => electron_1.ipcRenderer.invoke('console:open'),
        close: () => electron_1.ipcRenderer.invoke('console:close'),
        toggle: () => electron_1.ipcRenderer.invoke('console:toggle'),
        getLogs: () => electron_1.ipcRenderer.invoke('console:getLogs'),
        clearLogs: () => electron_1.ipcRenderer.invoke('console:clearLogs'),
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
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
//# sourceMappingURL=index.minimal.js.map