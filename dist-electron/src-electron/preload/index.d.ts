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
declare const api: {
    app: {
        getInfo: () => Promise<AppInfo>;
        getPath: (name: string) => Promise<string>;
        quit: () => Promise<void>;
    };
    window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
    };
    database: {
        backup: () => Promise<DbResult>;
        restore: () => Promise<DbResult>;
    };
    db: {
        query: (sql: string, params?: any[]) => Promise<DbResult>;
        insert: (table: string, data: any) => Promise<DbResult>;
        update: (table: string, id: any, data: any) => Promise<DbResult>;
        delete: (table: string, id: any) => Promise<DbResult>;
    };
    contacts: {
        list: () => Promise<DbResult<Contact[]>>;
        test: () => Promise<any>;
        create: (contact: Omit<Contact, "id">) => Promise<DbResult>;
        update: (id: number, contact: Partial<Contact>) => Promise<DbResult>;
        delete: (id: number) => Promise<DbResult>;
        bulkCreate: (contactsList: Omit<Contact, "id">[]) => Promise<DbResult<number[]>>;
        findDuplicates: () => Promise<DbResult<Contact[]>>;
        removeDuplicates: () => Promise<DbResult<number>>;
        checkExisting: (phones: string[]) => Promise<DbResult<string[]>>;
    };
    campaigns: {
        list: () => Promise<DbResult<Campaign[]>>;
        create: (campaign: Omit<Campaign, "id">) => Promise<DbResult>;
        update: (id: number, campaign: Partial<Campaign>) => Promise<DbResult>;
        delete: (id: number) => Promise<DbResult>;
        start: (id: number) => Promise<DbResult>;
        stop: (id: number) => Promise<DbResult>;
        addMedia: (campaignId: number, media: {
            fileName: string;
            fileType: string;
            fileSize: number;
            fileData?: string | null;
            filePath?: string | null;
            caption?: string;
        }) => Promise<DbResult>;
        getMedia: (campaignId: number) => Promise<DbResult<any[]>>;
        deleteMedia: (mediaId: string) => Promise<DbResult>;
        addContact: (campaignId: number, contactId: number) => Promise<DbResult>;
        addContacts: (campaignId: number, contactIds: number[]) => Promise<DbResult>;
        removeContact: (campaignId: number, contactId: number) => Promise<DbResult>;
        clearContacts: (campaignId: number) => Promise<DbResult>;
        getContacts: (campaignId: number, skipMasking?: boolean) => Promise<DbResult<Contact[]>>;
        getFailedMessages: (campaignId: number) => Promise<DbResult<any[]>>;
        exportFailureReport: (campaignId: number, campaignName: string) => Promise<DbResult>;
    };
    campaignRuns: {
        list: () => Promise<DbResult<any[]>>;
        getById: (runId: number) => Promise<DbResult<any>>;
        getFailedMessages: (runId: number) => Promise<DbResult<any[]>>;
    };
    groups: {
        list: () => Promise<DbResult<Group[]>>;
        create: (group: Omit<Group, "id">) => Promise<DbResult>;
        update: (id: number, group: Partial<Group>) => Promise<DbResult>;
        delete: (id: number) => Promise<DbResult>;
        addContact: (groupId: number, contactId: number) => Promise<DbResult>;
        removeContact: (groupId: number, contactId: number) => Promise<DbResult>;
        getContacts: (groupId: number, skipMasking?: boolean) => Promise<DbResult<Contact[]>>;
        bulkAddContacts: (groupId: number, contactIds: number[]) => Promise<DbResult>;
        bulkAddContactsToMultipleGroups: (groupIds: number[], contactIds: number[]) => Promise<DbResult>;
        findOrCreate: (name: string) => Promise<DbResult<number>>;
    };
    campaign: {
        start: (campaign: CampaignTask) => Promise<DbResult>;
        pause: () => Promise<DbResult>;
        resume: () => Promise<DbResult>;
        stop: () => Promise<DbResult>;
        status: () => Promise<DbResult<{
            exists: boolean;
            ready: boolean;
        }>>;
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
    sentinel: {
        register: (mobile: string) => Promise<any>;
        activate: (licenseKey: string) => Promise<any>;
        getDeviceId: () => Promise<any>;
    };
    whatsapp: {
        connect: (serverId?: number) => Promise<DbResult>;
        disconnect: (serverId?: number) => Promise<DbResult>;
        logout: (serverId?: number) => Promise<DbResult>;
        clearSession: (serverId?: number) => Promise<DbResult>;
        sendPoll: (serverId: number, chatId: string, question: string, options: string[]) => Promise<DbResult>;
        getContacts: (serverId?: number) => Promise<DbResult<any[]>>;
        getGroups: (serverId?: number) => Promise<DbResult<any[]>>;
        getGroupParticipants: (serverId: number, groupJid: string) => Promise<DbResult<any[]>>;
        importContacts: (contacts: any[]) => Promise<DbResult>;
        importGroup: (serverId: number, group: any) => Promise<DbResult>;
        getStatus: (serverId?: number) => Promise<DbResult<{
            isConnected: boolean;
            isInitializing: boolean;
            phoneNumber?: string;
        }>>;
        getStatusAll: () => Promise<DbResult<{
            [key: number]: any;
        }>>;
        getPollVotes: (campaignId: number) => Promise<any>;
        getPollSummary: (campaignId: number) => Promise<any>;
        getPollServerStats: (campaignId: number) => Promise<any>;
        exportPollExcel: (campaignId: number) => Promise<any>;
        onQrCode: (callback: (data: {
            serverId: number;
            qrCode: string;
        }) => void) => () => Electron.IpcRenderer;
        onReady: (callback: (data: {
            serverId: number;
            phoneNumber?: string;
        }) => void) => () => Electron.IpcRenderer;
        onStatus: (callback: (data: {
            serverId: number;
            status: any;
        }) => void) => () => Electron.IpcRenderer;
        onAuthenticated: (callback: (data: {
            serverId: number;
        }) => void) => () => Electron.IpcRenderer;
        onDisconnected: (callback: (data: {
            serverId: number;
        }) => void) => () => Electron.IpcRenderer;
        onReconnecting: (callback: (data: {
            serverId: number;
        }) => void) => () => Electron.IpcRenderer;
        onLog: (callback: (data: {
            serverId: number;
            message: string;
        }) => void) => () => Electron.IpcRenderer;
        onError: (callback: (data: {
            serverId: number;
            error: string;
        }) => void) => () => Electron.IpcRenderer;
    };
    console: {
        open: () => Promise<DbResult>;
        close: () => Promise<DbResult>;
        toggle: () => Promise<DbResult>;
        getLogs: () => Promise<DbResult<LogEntry[]>>;
        clearLogs: () => Promise<DbResult>;
        exportLogs: () => Promise<DbResult<LogEntry[]>>;
        onNewLog: (callback: (log: LogEntry) => void) => () => Electron.IpcRenderer;
        onLogsCleared: (callback: () => void) => () => Electron.IpcRenderer;
    };
    reports: {
        generate: (params?: any) => Promise<DbResult>;
    };
    supabase: {
        getStatus: () => Promise<DbResult>;
        getConfig: () => Promise<DbResult>;
        saveConfig: (supabaseUrl: string, supabaseKey: string) => Promise<DbResult>;
        testConnection: () => Promise<DbResult>;
        clearConfig: () => Promise<DbResult>;
    };
    debug: {
        dumpLogs: () => Promise<DbResult>;
    };
    auth: {
        register: (data: any) => Promise<DbResult>;
        login: (credentials: any) => Promise<DbResult>;
        logout: () => Promise<DbResult>;
        forgotPassword: (email: string) => Promise<DbResult>;
        getSession: () => Promise<any>;
        getProfile: () => Promise<any>;
        getPermissions: () => Promise<any[]>;
        getSupportChallenge: () => Promise<DbResult<{
            challenge: string;
        }>>;
        verifySupportCode: (challenge: string, response: string) => Promise<DbResult>;
    };
    staff: {
        list: () => Promise<DbResult<any[]>>;
        updatePermission: (data: {
            userId: string;
            module: string;
            permissions: any;
        }) => Promise<DbResult>;
    };
    subscription: {
        getStatus: () => Promise<any>;
    };
    credentials: {
        has: () => Promise<DbResult<boolean>>;
        save: (supabaseUrl: string, supabaseKey: string) => Promise<DbResult>;
        test: () => Promise<DbResult>;
    };
    chromium: {
        getPath: () => Promise<any>;
        setPath: (chromiumPath: string) => Promise<any>;
    };
    license: {
        activate: (licenseKey: string, mobile: string) => Promise<DbResult>;
        startTrial: (mobile: string) => Promise<DbResult>;
        generate: (mobile: string) => Promise<DbResult<{
            licenseKey: string;
        }>>;
        getStatus: () => Promise<DbResult<{
            activated: boolean;
            inTrial: boolean;
            daysLeft: number;
            mobile: string | null;
            expiry?: string | null;
        }>>;
        checkBackdoor: (password: string) => Promise<{
            success: boolean;
        }>;
    };
    userAuth: {
        login: (username: string, password: string) => Promise<DbResult>;
        list: () => Promise<DbResult<any[]>>;
        create: (data: any) => Promise<DbResult>;
        updatePassword: (data: {
            userId: number;
            newPassword: string;
        }) => Promise<DbResult>;
        updateUsername: (data: {
            userId: number;
            newUsername: string;
        }) => Promise<DbResult>;
        delete: (userId: number) => Promise<DbResult>;
        getPermissions: (userId: number) => Promise<DbResult>;
        setPermissions: (userId: number, permissions: any) => Promise<DbResult>;
    };
    updater: {
        checkForUpdates: () => Promise<DbResult>;
        downloadUpdate: () => Promise<DbResult>;
        installUpdate: () => Promise<DbResult>;
        onUpdateAvailable: (callback: (info: any) => void) => () => Electron.IpcRenderer;
        onUpdateNotAvailable: (callback: () => void) => () => Electron.IpcRenderer;
        onDownloadProgress: (callback: (progress: any) => void) => () => Electron.IpcRenderer;
        onUpdateDownloaded: (callback: (info: any) => void) => () => Electron.IpcRenderer;
        onUpdateError: (callback: (error: string) => void) => () => Electron.IpcRenderer;
    };
    profile: {
        get: () => Promise<DbResult<any>>;
        save: (data: any) => Promise<DbResult>;
    };
    on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
    removeListener: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
};
export type ElectronAPI = typeof api;
export {};
//# sourceMappingURL=index.d.ts.map