import Database from 'better-sqlite3';
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
    id?: number;
    phone: string;
    name: string;
    vars_json?: string;
    variables?: ContactVariables;
};
export type Group = {
    id?: number;
    name: string;
};
export type Campaign = {
    id?: number;
    name: string;
    status: string;
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
};
export type GroupContact = {
    group_id: number;
    contact_id: number;
};
export type LogEntry = {
    id?: number;
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
    message: string;
    data?: string;
};
export type SystemSetting = {
    key: string;
    value: string;
};
export type User = {
    id?: number;
    username: string;
    password_hash: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
};
export type StaffPermission = {
    id?: number;
    user_id: number;
    module_name: string;
    can_create: number;
    can_read: number;
    can_update: number;
    can_delete: number;
    hide_mobile: number;
};
export type CampaignMedia = {
    id: string;
    campaign_id: number;
    file_name: string;
    file_type: 'image' | 'document';
    file_size: number;
    file_data?: Buffer;
    file_path?: string;
    caption?: string;
    created_at?: string;
};
export declare function initDatabase(): Database.Database;
export declare function getSystemSetting(key: string): string | null;
export declare function setSystemSetting(key: string, value: string): void;
export declare function getDatabase(): Database.Database;
export declare const contacts: {
    list: () => any[];
    getById: (id: number) => any | undefined;
    create: (contact: Omit<Contact, "id">) => number;
    update: (id: number, contact: Partial<Contact>) => void;
    delete: (id: number) => void;
    bulkCreate: (contactsList: Omit<Contact, "id">[]) => number[];
    findDuplicates: () => Contact[];
    removeDuplicates: () => number;
    checkExisting: (phones: string[]) => string[];
    getAll(): Contact[];
    deleteAll(): void;
};
export declare const groups: {
    list: () => Group[];
    getById: (id: number) => Group | undefined;
    create: (group: Omit<Group, "id">) => number;
    update: (id: number, group: Partial<Group>) => void;
    delete: (id: number) => void;
    addContact: (groupId: number, contactId: number) => void;
    removeContact: (groupId: number, contactId: number) => void;
    getContacts: (groupId: number) => Contact[];
    bulkAddContactsToMultipleGroups: (groupIds: number[], contactIds: number[]) => void;
    getAll(): Group[];
    deleteAll(): void;
};
export declare const campaigns: {
    list: () => Campaign[];
    getById: (id: number) => Campaign | undefined;
    create: (campaign: Omit<Campaign, "id">) => number;
    update: (id: number, campaign: Partial<Campaign>) => void;
    updateProgress: (id: number, sentCount: number, failedCount: number, status?: string) => void;
    delete: (id: number) => void;
    addContact: (campaignId: number, contactId: number) => void;
    addContacts: (campaignId: number, contactIds: number[]) => void;
    removeContact: (campaignId: number, contactId: number) => void;
    clearContacts: (campaignId: number) => void;
    getContacts: (campaignId: number) => Contact[];
};
export declare const campaignMedia: {
    listByCampaign: (campaignId: number) => CampaignMedia[];
    create: (media: Omit<CampaignMedia, "created_at">) => void;
    delete: (id: string) => void;
    deleteAll: (campaignId: number) => void;
};
export declare const logs: {
    list: (limit?: number) => LogEntry[];
    create: (log: Omit<LogEntry, "id">) => number;
    clear: () => void;
    deleteOld: (daysToKeep: number) => number;
};
export type CampaignMessage = {
    id: string;
    campaign_id: number;
    contact_id?: number;
    recipient_number: string;
    recipient_name?: string;
    template_text: string;
    resolved_text?: string;
    status: 'pending' | 'sent' | 'failed';
    error_message?: string;
    sent_at?: string;
    created_at?: string;
    updated_at?: string;
};
export declare const campaignMessages: {
    create: (message: Omit<CampaignMessage, "created_at" | "updated_at">) => void;
    updateStatus: (messageId: string, status: "sent" | "failed", error?: string) => void;
    getByCampaign: (campaignId: number) => CampaignMessage[];
    getStats: (campaignId: number) => {
        sent: number;
        failed: number;
        pending: number;
    };
    getFailedMessages: (campaignId: number) => any[];
    deleteAll: (campaignId: number) => void;
};
export declare const campaignRuns: {
    create: (campaignId: number, campaignName: string, totalCount: number) => number;
    update: (runId: number, sentCount: number, failedCount: number, status?: string) => void;
    list: () => any[];
    listByCampaign: (campaignId: number) => any[];
    getById: (runId: number) => any;
    addMessage: (runId: number, recipientNumber: string, recipientName: string, status: string, errorMessage?: string) => void;
    getFailedMessages: (runId: number) => any[];
    delete: (runId: number) => void;
};
export declare const reports: {
    generate: () => any;
    getFailedMessages: (campaignId: number) => any[];
};
export declare function closeDatabase(): void;
//# sourceMappingURL=index.d.ts.map