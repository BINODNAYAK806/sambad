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

export type ContactVariables = {
  v1?: string;
  v2?: string;
  v3?: string;
  v4?: string;
  v5?: string;
  v6?: string;
  v7?: string;
  v8?: string;
  v9?: string;
  v10?: string;
};

export type Contact = {
  id: number;
  name: string;
  phone: string;
  status?: string;
  email?: string;
  tags?: string[];
  variables?: ContactVariables;
  groups?: Group[];
};

export type Campaign = {
  id: number;
  name: string;
  status: string;
  contacts?: number;
  message?: string;
  scheduledAt?: string;
  message_template?: string;
  group_id?: number;
  delay_preset?: string;
  delay_min?: number;
  delay_max?: number;
  sent_count?: number;
  failed_count?: number;
  total_count?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  template_image_path?: string;
  template_image_name?: string;
  template_image_size?: number;
  template_image_type?: string;
  sending_strategy?: 'single' | 'rotational';
  server_id?: number;
  is_poll?: boolean;
  poll_question?: string;
  poll_options?: string;
};

export type Group = {
  id: number;
  name: string;
};

export type CampaignTask = {
  campaignId: number;
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
  templateImage?: {
    url: string;
    type: string;
    filename?: string;
  };
};

export type MediaAttachment = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
};

export type CampaignProgress = {
  campaignId?: number;
  messageId?: string;
  recipientNumber?: string;
  recipientName?: string;
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

export interface ElectronAPI {
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
    create: (contact: Omit<Contact, 'id'>) => Promise<DbResult>;
    update: (id: number, contact: Partial<Contact>) => Promise<DbResult>;
    delete: (id: number) => Promise<DbResult>;
    bulkCreate: (contactsList: Omit<Contact, 'id'>[]) => Promise<DbResult<number[]>>;
    findDuplicates: () => Promise<DbResult<Contact[]>>;
    removeDuplicates: () => Promise<DbResult<number>>;
    checkExisting: (phones: string[]) => Promise<DbResult<string[]>>;
  };

  campaigns: {
    list: () => Promise<DbResult<Campaign[]>>;
    create: (campaign: Omit<Campaign, 'id'>) => Promise<DbResult>;
    update: (id: number, campaign: Partial<Campaign>) => Promise<DbResult>;
    delete: (id: number) => Promise<DbResult>;
    start: (id: number) => Promise<DbResult>;
    stop: (id: number) => Promise<DbResult>;
    addMedia: (campaignId: number, media: {
      fileName: string;
      fileType: string;
      fileSize: number;
      fileData: string;
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

  campaign: {
    start: (campaign: CampaignTask) => Promise<DbResult>;
    pause: () => Promise<DbResult>;
    resume: () => Promise<DbResult>;
    stop: () => Promise<DbResult>;
    status: () => Promise<DbResult<{ exists: boolean; ready: boolean }>>;
  };

  groups: {
    list: () => Promise<DbResult<Group[]>>;
    create: (group: Omit<Group, 'id'>) => Promise<DbResult>;
    update: (id: number, group: Partial<Group>) => Promise<DbResult>;
    delete: (id: number) => Promise<DbResult>;
    addContact: (groupId: number, contactId: number) => Promise<DbResult>;
    removeContact: (groupId: number, contactId: number) => Promise<DbResult>;
    getContacts: (groupId: number, skipMasking?: boolean) => Promise<DbResult<Contact[]>>;
    bulkAddContacts: (groupId: number, contactIds: number[]) => Promise<DbResult>;
    bulkAddContactsToMultipleGroups: (groupIds: number[], contactIds: number[]) => Promise<DbResult>;
    findOrCreate: (name: string) => Promise<DbResult<number>>;
  };

  campaignWorker: {
    start: (campaign: CampaignTask) => Promise<DbResult>;
    pause: () => Promise<DbResult>;
    resume: () => Promise<DbResult>;
    stop: () => Promise<DbResult>;
    getStatus: () => Promise<DbResult<{ exists: boolean; ready: boolean }>>;
    onQrCode: (callback: (qrCode: string) => void) => () => void;
    onReady: (callback: () => void) => () => void;
    onProgress: (callback: (progress: CampaignProgress) => void) => () => void;
    onComplete: (callback: (data: CampaignProgress) => void) => () => void;
    onError: (callback: (data: CampaignProgress) => void) => () => void;
    onPaused: (callback: (campaignId?: string) => void) => () => void;
    onResumed: (callback: (campaignId?: string) => void) => () => void;
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
    getStatus: (serverId?: number) => Promise<DbResult<{ isConnected: boolean; isInitializing: boolean; isReady: boolean; phoneNumber?: string; qrCode?: string; error?: string | null }>>;
    getStatusAll: () => Promise<DbResult<{ [key: number]: any }>>;
    getPollVotes: (campaignId: number) => Promise<DbResult<any[]>>;
    getPollSummary: (campaignId: number) => Promise<DbResult<any>>;
    getPollServerStats: (campaignId: number) => Promise<DbResult<any[]>>;
    exportPollExcel: (campaignId: number) => Promise<DbResult<{ filePath: string }>>;
    onQrCode: (callback: (data: { serverId: number; qrCode: string }) => void) => () => void;
    onReady: (callback: (data: { serverId: number; phoneNumber?: string }) => void) => () => void;
    onStatus: (callback: (data: { serverId: number; status: any }) => void) => () => void;
    onAuthenticated: (callback: (data: { serverId: number }) => void) => () => void;
    onDisconnected: (callback: (data: { serverId: number }) => void) => () => void;
    onReconnecting: (callback: (data: { serverId: number }) => void) => () => void;
    onLog: (callback: (data: { serverId: number; message: string }) => void) => () => void;
    onError: (callback: (data: { serverId: number; error: string }) => void) => () => void;
  };

  console: {
    open: () => Promise<DbResult>;
    close: () => Promise<DbResult>;
    toggle: () => Promise<DbResult>;
    getLogs: () => Promise<DbResult<LogEntry[]>>;
    clearLogs: () => Promise<DbResult>;
    exportLogs: () => Promise<DbResult<LogEntry[]>>;
    onNewLog: (callback: (log: LogEntry) => void) => () => void;
    onLogsCleared: (callback: () => void) => () => void;
  };

  reports: {
    generate: (params?: any) => Promise<DbResult>;
  };

  debug: {
    dumpLogs: () => Promise<DbResult>;
  };

  account: {
    getStatus: () => Promise<DbResult<{ activated: boolean; accountId?: string; activatedAt?: string }>>;
    getConfig: () => Promise<DbResult<{ account_id: string; activated_at: string } | null>>;
    save: (accountId: string, licenseKey: string) => Promise<DbResult>;
    activate: (accountId: string, licenseKey: string) => Promise<DbResult>;
    deactivate: () => Promise<DbResult>;
    testConnection: () => Promise<DbResult>;
  };

  credentials: {
    has: () => Promise<DbResult<boolean>>;
    save: (supabaseUrl: string, supabaseKey: string) => Promise<DbResult>;
    test: () => Promise<DbResult>;
  };

  chromium: {
    getPath: () => Promise<DbResult<{ customPath: string; updatedAt: string } | null>>;
    setPath: (chromiumPath: string) => Promise<DbResult>;
  };

  license: {
    activate: (licenseKey: string, mobile: string) => Promise<DbResult>;
    startTrial: (mobile: string) => Promise<DbResult>;
    generate: (mobile: string) => Promise<DbResult<{ licenseKey: string }>>;
    getStatus: () => Promise<DbResult<{ activated: boolean; inTrial: boolean; daysLeft: number; mobile: string | null; expiry?: string | null }>>;
    checkBackdoor: (password: string) => Promise<{ success: boolean }>;
  };

  sentinel: {
    register: (mobile: string) => Promise<{ success: boolean; message?: string; license_key?: string }>;
    activate: (licenseKey: string) => Promise<{ success: boolean; reason?: string }>;
    getDeviceId: () => Promise<string>;
  };

  auth: {
    register: (data: any) => Promise<DbResult>;
    login: (credentials: any) => Promise<DbResult>;
    logout: () => Promise<DbResult>;
    forgotPassword: (email: string) => Promise<DbResult>;
    getSession: () => Promise<any>;
    getProfile: () => Promise<any>;
    getPermissions: () => Promise<any[]>;
    getSupportChallenge: () => Promise<DbResult<{ challenge: string }>>;
    verifySupportCode: (challenge: string, response: string) => Promise<DbResult>;
  },

  userAuth: {
    login: (username: string, password: string) => Promise<DbResult<any>>;
    list: () => Promise<DbResult<any[]>>;
    create: (data: any) => Promise<DbResult<any>>;
    updatePassword: (data: { userId: number, newPassword: string }) => Promise<DbResult<any>>;
    updateUsername: (data: { userId: number, newUsername: string }) => Promise<DbResult<any>>;
    delete: (userId: number) => Promise<DbResult<any>>;
    getPermissions: (userId: number) => Promise<DbResult<any[]>>;
    setPermissions: (userId: number, permissions: any) => Promise<DbResult<any>>;
  };

  updater: {
    checkForUpdates: () => Promise<DbResult>;
    downloadUpdate: () => Promise<DbResult>;
    installUpdate: () => Promise<DbResult>;
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void;
    onDownloadProgress: (callback: (progress: any) => void) => () => void;
    onUpdateDownloaded: (callback: (info: any) => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
  };

  profile: {
    get: () => Promise<DbResult<any>>;
    save: (data: any) => Promise<DbResult<any>>;
  };

  on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { };
