import { contextBridge, ipcRenderer } from 'electron';

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
  arch: string;
  electron: string;
  chrome: string;
  node: string;
  v8: string;
};

export type DbResult<T = any> = {
  success: boolean;
  data?: T;
  id?: number;
  error?: string;
  message?: string;
};

export type Contact = {
  id: number;
  name: string;
  phone: string;
  status: string;
  email?: string;
  tags?: string[];
};

export type Campaign = {
  id: number;
  name: string;
  status: string;
  contacts: number;
  message?: string;
  scheduledAt?: string;
};

export type Group = {
  id: number;
  name: string;
};

export type CampaignTask = {
  campaignId: string;
  messages: MessageTask[];
  delaySettings: {
    preset: string;
    minDelay?: number;
    maxDelay?: number;
  };
};

export type MessageTask = {
  id: string;
  recipientNumber: string;
  recipientName?: string;
  templateText: string;
  variables?: Record<string, string>;
  mediaAttachments?: MediaAttachment[];
};

export type MediaAttachment = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
};

export type CampaignProgress = {
  campaignId?: string;
  messageId?: string;
  recipientNumber?: string;
  status?: 'sent' | 'failed';
  error?: string;
  totalMessages?: number;
  sentCount?: number;
  failedCount?: number;
  progress?: number;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
  message: string;
  data?: any;
};

const api = {
  app: {
    getInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:getInfo'),
    getPath: (name: string): Promise<string> => ipcRenderer.invoke('app:getPath', name),
    quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
  },

  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close'),
  },

  database: {
    backup: (): Promise<DbResult> => ipcRenderer.invoke('database:backup'),
    restore: (): Promise<DbResult> => ipcRenderer.invoke('database:restore'),
  },

  db: {
    query: (sql: string, params?: any[]): Promise<DbResult> =>
      ipcRenderer.invoke('db:query', sql, params),
    insert: (table: string, data: any): Promise<DbResult> =>
      ipcRenderer.invoke('db:insert', table, data),
    update: (table: string, id: any, data: any): Promise<DbResult> =>
      ipcRenderer.invoke('db:update', table, id, data),
    delete: (table: string, id: any): Promise<DbResult> =>
      ipcRenderer.invoke('db:delete', table, id),
  },

  contacts: {
    list: (): Promise<DbResult<Contact[]>> =>
      ipcRenderer.invoke('contacts:list'),
    test: () => ipcRenderer.invoke('credentials:test'),
    create: (contact: Omit<Contact, 'id'>): Promise<DbResult> =>
      ipcRenderer.invoke('contacts:create', contact),
    update: (id: number, contact: Partial<Contact>): Promise<DbResult> =>
      ipcRenderer.invoke('contacts:update', id, contact),
    delete: (id: number): Promise<DbResult> =>
      ipcRenderer.invoke('contacts:delete', id),
    bulkCreate: (contactsList: Omit<Contact, 'id'>[]): Promise<DbResult<number[]>> =>
      ipcRenderer.invoke('contacts:bulkCreate', contactsList),
    findDuplicates: (): Promise<DbResult<Contact[]>> =>
      ipcRenderer.invoke('contacts:findDuplicates'),
    removeDuplicates: (): Promise<DbResult<number>> =>
      ipcRenderer.invoke('contacts:removeDuplicates'),
    checkExisting: (phones: string[]): Promise<DbResult<string[]>> =>
      ipcRenderer.invoke('contacts:checkExisting', phones),
  },

  campaigns: {
    list: (): Promise<DbResult<Campaign[]>> =>
      ipcRenderer.invoke('campaigns:list'),
    create: (campaign: Omit<Campaign, 'id'>): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:create', campaign),
    update: (id: number, campaign: Partial<Campaign>): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:update', id, campaign),
    delete: (id: number): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:delete', id),
    start: (id: number): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:start', id),
    stop: (id: number): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:stop', id),
    addMedia: (campaignId: number, media: {
      fileName: string;
      fileType: string;
      fileSize: number;
      fileData?: string | null;
      filePath?: string | null;
      caption?: string;
    }): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:addMedia', campaignId, media),
    getMedia: (campaignId: number): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('campaigns:getMedia', campaignId),
    deleteMedia: (mediaId: string): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:deleteMedia', mediaId),
    addContact: (campaignId: number, contactId: number): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:addContact', campaignId, contactId),
    addContacts: (campaignId: number, contactIds: number[]): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:addContacts', campaignId, contactIds),
    removeContact: (campaignId: number, contactId: number): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:removeContact', campaignId, contactId),
    clearContacts: (campaignId: number): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:clearContacts', campaignId),
    getContacts: (campaignId: number, skipMasking?: boolean): Promise<DbResult<Contact[]>> =>
      ipcRenderer.invoke('campaigns:getContacts', campaignId, skipMasking),
    getFailedMessages: (campaignId: number): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('campaigns:getFailedMessages', campaignId),
    exportFailureReport: (campaignId: number, campaignName: string): Promise<DbResult> =>
      ipcRenderer.invoke('campaigns:exportFailureReport', campaignId, campaignName),
  },

  campaignRuns: {
    list: (): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('campaignRuns:list'),
    getById: (runId: number): Promise<DbResult<any>> =>
      ipcRenderer.invoke('campaignRuns:getByid', runId),
    getFailedMessages: (runId: number): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('campaignRuns:getFailedMessages', runId),
  },

  groups: {
    list: (): Promise<DbResult<Group[]>> =>
      ipcRenderer.invoke('groups:list'),
    create: (group: Omit<Group, 'id'>): Promise<DbResult> =>
      ipcRenderer.invoke('groups:create', group),
    update: (id: number, group: Partial<Group>): Promise<DbResult> =>
      ipcRenderer.invoke('groups:update', id, group),
    delete: (id: number): Promise<DbResult> =>
      ipcRenderer.invoke('groups:delete', id),
    addContact: (groupId: number, contactId: number): Promise<DbResult> =>
      ipcRenderer.invoke('groups:addContact', groupId, contactId),
    removeContact: (groupId: number, contactId: number): Promise<DbResult> =>
      ipcRenderer.invoke('groups:removeContact', groupId, contactId),
    getContacts: (groupId: number, skipMasking?: boolean): Promise<DbResult<Contact[]>> =>
      ipcRenderer.invoke('groups:getContacts', groupId, skipMasking),
    bulkAddContacts: (groupId: number, contactIds: number[]): Promise<DbResult> =>
      ipcRenderer.invoke('groups:bulkAddContacts', groupId, contactIds),
    bulkAddContactsToMultipleGroups: (groupIds: number[], contactIds: number[]): Promise<DbResult> =>
      ipcRenderer.invoke('groups:bulkAddContactsToMultipleGroups', groupIds, contactIds),
    findOrCreate: (name: string): Promise<DbResult<number>> =>
      ipcRenderer.invoke('groups:findOrCreate', name),
  },

  campaign: {
    start: (campaign: CampaignTask): Promise<DbResult> => {
      console.log('[Preload] Invoking campaign:start', campaign);
      return ipcRenderer.invoke('campaign:start', campaign);
    },
    pause: (): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:pause'),
    resume: (): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:resume'),
    stop: (): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:stop'),
    status: (): Promise<DbResult<{ exists: boolean; ready: boolean }>> =>
      ipcRenderer.invoke('campaign:status'),
  },

  campaignWorker: {
    start: (campaign: CampaignTask): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:start', campaign),
    pause: (): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:pause'),
    resume: (): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:resume'),
    stop: (): Promise<DbResult> =>
      ipcRenderer.invoke('campaign:stop'),
    getStatus: (): Promise<DbResult<{ exists: boolean; ready: boolean }>> =>
      ipcRenderer.invoke('campaign:status'),

    onQrCode: (callback: (qrCode: string) => void) => {
      const listener = (_event: any, data: { qrCode?: string }) => {
        if (data.qrCode) callback(data.qrCode);
      };
      ipcRenderer.on('campaign:qr_code', listener);
      return () => ipcRenderer.removeListener('campaign:qr_code', listener);
    },

    onReady: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('campaign:ready', listener);
      return () => ipcRenderer.removeListener('campaign:ready', listener);
    },

    onProgress: (callback: (progress: CampaignProgress) => void) => {
      const listener = (_event: any, data: CampaignProgress) => callback(data);
      ipcRenderer.on('campaign:progress', listener);
      return () => ipcRenderer.removeListener('campaign:progress', listener);
    },

    onComplete: (callback: (data: CampaignProgress) => void) => {
      const listener = (_event: any, data: CampaignProgress) => callback(data);
      ipcRenderer.on('campaign:complete', listener);
      return () => ipcRenderer.removeListener('campaign:complete', listener);
    },

    onError: (callback: (data: CampaignProgress) => void) => {
      const listener = (_event: any, data: CampaignProgress) => callback(data);
      ipcRenderer.on('campaign:error', listener);
      return () => ipcRenderer.removeListener('campaign:error', listener);
    },

    onPaused: (callback: (campaignId?: string) => void) => {
      const listener = (_event: any, data: { campaignId?: string }) => {
        callback(data.campaignId);
      };
      ipcRenderer.on('campaign:paused', listener);
      return () => ipcRenderer.removeListener('campaign:paused', listener);
    },

    onResumed: (callback: (campaignId?: string) => void) => {
      const listener = (_event: any, data: { campaignId?: string }) => {
        callback(data.campaignId);
      };
      ipcRenderer.on('campaign:resumed', listener);
      return () => ipcRenderer.removeListener('campaign:resumed', listener);
    },
  },

  sentinel: {
    register: (mobile: string) => ipcRenderer.invoke('sentinel:register', { mobile }),
    activate: (licenseKey: string) => ipcRenderer.invoke('sentinel:activate', { licenseKey }),
    getDeviceId: () => ipcRenderer.invoke('sentinel:get-device-id'),
  },

  whatsapp: {
    connect: (serverId?: number): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:connect', serverId),
    disconnect: (serverId?: number): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:disconnect', serverId),
    logout: (serverId?: number): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:logout', serverId),
    clearSession: (serverId?: number): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:clearSession', serverId),
    sendPoll: (serverId: number, chatId: string, question: string, options: string[]): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:send-poll', serverId, chatId, question, options),
    getContacts: (serverId?: number): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('whatsapp:get-contacts', serverId),
    getGroups: (serverId?: number): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('whatsapp:get-groups', serverId),
    getGroupParticipants: (serverId: number, groupJid: string): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('whatsapp:get-group-participants', serverId, groupJid),
    importContacts: (contacts: any[]): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:import-contacts', contacts),
    importGroup: (serverId: number, group: any): Promise<DbResult> =>
      ipcRenderer.invoke('whatsapp:import-group', serverId, group),
    getStatus: (serverId?: number): Promise<DbResult<{ isConnected: boolean; isInitializing: boolean; phoneNumber?: string }>> =>
      ipcRenderer.invoke('whatsapp:status', serverId),
    getStatusAll: (): Promise<DbResult<{ [key: number]: any }>> =>
      ipcRenderer.invoke('whatsapp:status-all'),
    getPollVotes: (campaignId: number) =>
      ipcRenderer.invoke('whatsapp:get-poll-votes', campaignId),
    getPollSummary: (campaignId: number) =>
      ipcRenderer.invoke('whatsapp:get-poll-summary', campaignId),
    getPollServerStats: (campaignId: number) =>
      ipcRenderer.invoke('whatsapp:get-poll-server-stats', campaignId),
    exportPollExcel: (campaignId: number) =>
      ipcRenderer.invoke('whatsapp:export-poll-excel', campaignId),

    onQrCode: (callback: (data: { serverId: number; qrCode: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:qr_code', listener);
      return () => ipcRenderer.removeListener('whatsapp:qr_code', listener);
    },

    onReady: (callback: (data: { serverId: number; phoneNumber?: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:ready', listener);
      return () => ipcRenderer.removeListener('whatsapp:ready', listener);
    },

    onStatus: (callback: (data: { serverId: number; status: any }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:status', listener);
      return () => ipcRenderer.removeListener('whatsapp:status', listener);
    },

    onAuthenticated: (callback: (data: { serverId: number }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:authenticated', listener);
      return () => ipcRenderer.removeListener('whatsapp:authenticated', listener);
    },

    onDisconnected: (callback: (data: { serverId: number }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:disconnected', listener);
      return () => ipcRenderer.removeListener('whatsapp:disconnected', listener);
    },

    onReconnecting: (callback: (data: { serverId: number }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:reconnecting', listener);
      return () => ipcRenderer.removeListener('whatsapp:reconnecting', listener);
    },

    onLog: (callback: (data: { serverId: number; message: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:log', listener);
      return () => ipcRenderer.removeListener('whatsapp:log', listener);
    },

    onError: (callback: (data: { serverId: number; error: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('whatsapp:error', listener);
      return () => ipcRenderer.removeListener('whatsapp:error', listener);
    },
  },

  console: {
    open: (): Promise<DbResult> =>
      ipcRenderer.invoke('console:open'),
    close: (): Promise<DbResult> =>
      ipcRenderer.invoke('console:close'),
    toggle: (): Promise<DbResult> =>
      ipcRenderer.invoke('console:toggle'),
    getLogs: (): Promise<DbResult<LogEntry[]>> =>
      ipcRenderer.invoke('console:getLogs'),
    clearLogs: (): Promise<DbResult> =>
      ipcRenderer.invoke('console:clearLogs'),
    exportLogs: (): Promise<DbResult<LogEntry[]>> =>
      ipcRenderer.invoke('logs:export'),

    onNewLog: (callback: (log: LogEntry) => void) => {
      const listener = (_event: any, log: LogEntry) => callback(log);
      ipcRenderer.on('console:newLog', listener);
      return () => ipcRenderer.removeListener('console:newLog', listener);
    },

    onLogsCleared: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('console:logsCleared', listener);
      return () => ipcRenderer.removeListener('console:logsCleared', listener);
    },
  },

  reports: {
    generate: (params?: any): Promise<DbResult> =>
      ipcRenderer.invoke('reports:generate', params),
  },

  supabase: {
    getStatus: (): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:getStatus'),
    getConfig: (): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:getConfig'),
    saveConfig: (supabaseUrl: string, supabaseKey: string): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:saveConfig', supabaseUrl, supabaseKey),
    testConnection: (): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:testConnection'),
    clearConfig: (): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:clearConfig'),
  },

  debug: {
    dumpLogs: (): Promise<DbResult> => ipcRenderer.invoke('debug:dumpLogs'),
  },

  auth: {
    register: (data: any): Promise<DbResult> => ipcRenderer.invoke('auth:register', data),
    login: (credentials: any): Promise<DbResult> => ipcRenderer.invoke('auth:login', credentials),
    logout: (): Promise<DbResult> => ipcRenderer.invoke('auth:logout'),
    forgotPassword: (email: string): Promise<DbResult> => ipcRenderer.invoke('auth:forgotPassword', email),
    getSession: (): Promise<any> => ipcRenderer.invoke('auth:getSession'),
    getProfile: (): Promise<any> => ipcRenderer.invoke('auth:getProfile'),
    getPermissions: (): Promise<any[]> => ipcRenderer.invoke('auth:getPermissions'),
    getSupportChallenge: (): Promise<DbResult<{ challenge: string }>> => ipcRenderer.invoke('auth:get-support-challenge'),
    verifySupportCode: (challenge: string, response: string): Promise<DbResult> =>
      ipcRenderer.invoke('auth:verify-support-code', { challenge, response }),
  },

  staff: {
    list: (): Promise<DbResult<any[]>> => ipcRenderer.invoke('staff:list'),
    updatePermission: (data: { userId: string, module: string, permissions: any }): Promise<DbResult> =>
      ipcRenderer.invoke('staff:updatePermission', data),
  },

  subscription: {
    getStatus: (): Promise<any> => ipcRenderer.invoke('subscription:getStatus'),
  },

  credentials: {
    has: (): Promise<DbResult<boolean>> =>
      ipcRenderer.invoke('supabase:getStatus').then(result => ({
        ...result,
        data: result.data?.configured || false
      })),
    save: (supabaseUrl: string, supabaseKey: string): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:saveConfig', supabaseUrl, supabaseKey),
    test: (): Promise<DbResult> =>
      ipcRenderer.invoke('supabase:testConnection'),
  },

  chromium: {
    getPath: () => ipcRenderer.invoke('chromium:getPath'),
    setPath: (chromiumPath: string) => ipcRenderer.invoke('chromium:setPath', chromiumPath),
  },

  license: {
    activate: (licenseKey: string, mobile: string): Promise<DbResult> =>
      ipcRenderer.invoke('license:activate', { licenseKey, mobile }),
    startTrial: (mobile: string): Promise<DbResult> =>
      ipcRenderer.invoke('license:start-trial', { mobile }),
    generate: (mobile: string): Promise<DbResult<{ licenseKey: string }>> =>
      ipcRenderer.invoke('license:generate', { mobile }),
    getStatus: (): Promise<DbResult<{ activated: boolean; inTrial: boolean; daysLeft: number; mobile: string | null; expiry?: string | null }>> =>
      ipcRenderer.invoke('license:status'),
    checkBackdoor: (password: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('license:check-backdoor', { password }),
  },

  userAuth: {
    login: (username: string, password: string): Promise<DbResult> =>
      ipcRenderer.invoke('auth:local-login', { username, password }),
    list: (): Promise<DbResult<any[]>> =>
      ipcRenderer.invoke('user:list'),
    create: (data: any): Promise<DbResult> =>
      ipcRenderer.invoke('user:create', data),
    updatePassword: (data: { userId: number; newPassword: string }): Promise<DbResult> =>
      ipcRenderer.invoke('user:update-password', data),
    updateUsername: (data: { userId: number; newUsername: string }): Promise<DbResult> =>
      ipcRenderer.invoke('user:update-username', data),
    delete: (userId: number): Promise<DbResult> =>
      ipcRenderer.invoke('user:delete', { userId }),
    getPermissions: (userId: number): Promise<DbResult> =>
      ipcRenderer.invoke('user:get-permissions', { userId }),
    setPermissions: (userId: number, permissions: any): Promise<DbResult> =>
      ipcRenderer.invoke('user:set-permissions', { userId, permissions }),
  },

  updater: {
    checkForUpdates: (): Promise<DbResult> => ipcRenderer.invoke('updater:check'),
    downloadUpdate: (): Promise<DbResult> => ipcRenderer.invoke('updater:download'),
    installUpdate: (): Promise<DbResult> => ipcRenderer.invoke('updater:install'),

    onUpdateAvailable: (callback: (info: any) => void) => {
      const listener = (_event: any, info: any) => callback(info);
      ipcRenderer.on('update:available', listener);
      return () => ipcRenderer.removeListener('update:available', listener);
    },

    onUpdateNotAvailable: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('update:not-available', listener);
      return () => ipcRenderer.removeListener('update:not-available', listener);
    },

    onDownloadProgress: (callback: (progress: any) => void) => {
      const listener = (_event: any, progress: any) => callback(progress);
      ipcRenderer.on('update:download-progress', listener);
      return () => ipcRenderer.removeListener('update:download-progress', listener);
    },

    onUpdateDownloaded: (callback: (info: any) => void) => {
      const listener = (_event: any, info: any) => callback(info);
      ipcRenderer.on('update:downloaded', listener);
      return () => ipcRenderer.removeListener('update:downloaded', listener);
    },

    onUpdateError: (callback: (error: string) => void) => {
      const listener = (_event: any, error: string) => callback(error);
      ipcRenderer.on('update:error', listener);
      return () => ipcRenderer.removeListener('update:error', listener);
    },
  },

  profile: {
    get: (): Promise<DbResult<any>> => ipcRenderer.invoke('profile:get'),
    save: (data: any): Promise<DbResult> => ipcRenderer.invoke('profile:save', data),
  },

  on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },

  removeListener: (channel: string, callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

console.log('[Preload] Starting preload script');
console.log('[Preload] contextBridge available:', typeof contextBridge !== 'undefined');
console.log('[Preload] ipcRenderer available:', typeof ipcRenderer !== 'undefined');

if (typeof contextBridge === 'undefined') {
  console.error('[Preload] CRITICAL: contextBridge is undefined! Context isolation might be disabled.');
}

if (typeof ipcRenderer === 'undefined') {
  console.error('[Preload] CRITICAL: ipcRenderer is undefined! Electron environment not detected.');
}

try {
  if (contextBridge && ipcRenderer) {
    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('[Preload] ✓ electronAPI successfully exposed to window object');
    console.log('[Preload] ✓ Available API namespaces:', Object.keys(api));
  } else {
    console.error('[Preload] ✗ Cannot expose API: missing contextBridge or ipcRenderer');
  }
} catch (error) {
  console.error('[Preload] ✗ FAILED to expose electronAPI:', error);
  console.error('[Preload] Error details:', error instanceof Error ? error.message : String(error));
}

console.log('[Preload] Preload script execution completed');

export type ElectronAPI = typeof api;

