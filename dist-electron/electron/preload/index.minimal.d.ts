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
declare const api: {
    app: {
        getInfo: () => Promise<AppInfo>;
        getPath: (name: string) => Promise<string>;
        quit: () => Promise<void>;
    };
    db: {
        query: (sql: string, params?: any[]) => Promise<DbResult>;
        insert: (table: string, data: any) => Promise<DbResult>;
        update: (table: string, id: any, data: any) => Promise<DbResult>;
        delete: (table: string, id: any) => Promise<DbResult>;
    };
    contacts: {
        list: () => Promise<DbResult<Contact[]>>;
        create: (contact: Omit<Contact, "id">) => Promise<DbResult>;
        update: (id: number, contact: Partial<Contact>) => Promise<DbResult>;
        delete: (id: number) => Promise<DbResult>;
    };
    campaigns: {
        list: () => Promise<DbResult<Campaign[]>>;
        create: (campaign: Omit<Campaign, "id">) => Promise<DbResult>;
        update: (id: number, campaign: Partial<Campaign>) => Promise<DbResult>;
        delete: (id: number) => Promise<DbResult>;
        start: (id: number) => Promise<DbResult>;
        stop: (id: number) => Promise<DbResult>;
    };
    campaignWorker: {
        start: (campaign: CampaignTask) => Promise<DbResult>;
        pause: () => Promise<DbResult>;
        resume: () => Promise<DbResult>;
        stop: () => Promise<DbResult>;
        getStatus: () => Promise<DbResult<{
            exists: boolean;
            ready: boolean;
        }>>;
        onQrCode: (callback: (qrCode: string) => void) => () => Electron.IpcRenderer;
        onReady: (callback: () => void) => () => Electron.IpcRenderer;
        onProgress: (callback: (progress: CampaignProgress) => void) => () => Electron.IpcRenderer;
        onComplete: (callback: (data: CampaignProgress) => void) => () => Electron.IpcRenderer;
        onError: (callback: (data: CampaignProgress) => void) => () => Electron.IpcRenderer;
        onPaused: (callback: (campaignId?: string) => void) => () => Electron.IpcRenderer;
        onResumed: (callback: (campaignId?: string) => void) => () => Electron.IpcRenderer;
    };
    console: {
        open: () => Promise<DbResult>;
        close: () => Promise<DbResult>;
        toggle: () => Promise<DbResult>;
        getLogs: () => Promise<DbResult<LogEntry[]>>;
        clearLogs: () => Promise<DbResult>;
        onNewLog: (callback: (log: LogEntry) => void) => () => Electron.IpcRenderer;
        onLogsCleared: (callback: () => void) => () => Electron.IpcRenderer;
    };
};
export type ElectronAPI = typeof api;
export {};
//# sourceMappingURL=index.minimal.d.ts.map