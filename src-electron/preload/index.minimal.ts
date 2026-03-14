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
    create: (contact: Omit<Contact, 'id'>): Promise<DbResult> =>
      ipcRenderer.invoke('contacts:create', contact),
    update: (id: number, contact: Partial<Contact>): Promise<DbResult> =>
      ipcRenderer.invoke('contacts:update', id, contact),
    delete: (id: number): Promise<DbResult> =>
      ipcRenderer.invoke('contacts:delete', id),
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
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
