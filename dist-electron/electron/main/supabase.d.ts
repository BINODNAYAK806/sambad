import { SupabaseClient } from '@supabase/supabase-js';
export declare let supabase: SupabaseClient | null;
export declare let currentSupabaseUrl: string | null;
export declare let currentSupabaseKey: string | null;
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
    company_id?: string;
    phone: string;
    name: string;
    vars_json?: any;
    variables?: ContactVariables;
    created_at?: string;
    updated_at?: string;
};
export type Group = {
    id?: number;
    company_id?: string;
    name: string;
    created_at?: string;
};
export type Campaign = {
    id?: number;
    company_id?: string;
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
    template_image_data?: string;
};
export type CampaignMessage = {
    id: string;
    company_id?: string;
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
export type LogEntry = {
    id?: number;
    company_id?: string;
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
    message: string;
    data?: string;
    created_at?: string;
};
export declare function initializeSupabase(customUrl?: string, customKey?: string): SupabaseClient | null;
export declare function getSupabase(): SupabaseClient;
export declare function testConnection(retries?: number): Promise<boolean>;
export declare function getTenantContext(): Promise<{
    client: SupabaseClient<any, "public", "public", any, any>;
    companyId: string;
}>;
export declare const contacts: {
    list: () => Promise<Contact[]>;
    listWithGroups: () => Promise<Contact[]>;
    create: (contact: Omit<Contact, "id">) => Promise<number>;
    bulkCreate: (contactsList: Omit<Contact, "id">[]) => Promise<number[]>;
    update: (id: number, contact: Partial<Contact>) => Promise<void>;
    delete: (id: number) => Promise<void>;
    findDuplicates: () => Promise<Contact[]>;
    removeDuplicates: () => Promise<number>;
};
export declare const groups: {
    list: () => Promise<Group[]>;
    create: (group: Omit<Group, "id">) => Promise<number>;
    update: (id: number, group: Partial<Group>) => Promise<void>;
    delete: (id: number) => Promise<void>;
    addContact: (groupId: number, contactId: number) => Promise<void>;
    removeContact: (groupId: number, contactId: number) => Promise<void>;
    bulkAddContacts: (groupId: number, contactIds: number[]) => Promise<void>;
    getContacts: (groupId: number) => Promise<Contact[]>;
    findOrCreate: (name: string) => Promise<number>;
    bulkAddContactsToMultipleGroups: (groupIds: number[], contactIds: number[]) => Promise<void>;
};
export declare const campaigns: {
    list: () => Promise<Campaign[]>;
    create: (campaign: Omit<Campaign, "id">) => Promise<number>;
    update: (id: number, campaign: Partial<Campaign>) => Promise<void>;
    delete: (id: number) => Promise<void>;
    addContact: (campaignId: number, contactId: number) => Promise<void>;
    addContacts: (campaignId: number, contactIds: number[]) => Promise<void>;
    removeContact: (campaignId: number, contactId: number) => Promise<void>;
    clearContacts: (campaignId: number) => Promise<void>;
    getContacts: (campaignId: number) => Promise<Contact[]>;
};
export declare const campaignMessages: {
    create: (message: Omit<CampaignMessage, "created_at" | "updated_at">) => Promise<void>;
    getFailed: (campaignId?: number) => Promise<any[]>;
    updateStatus: (messageId: string, status: "sent" | "failed", errorStr?: string) => Promise<void>;
    getByCampaign: (campaignId: number) => Promise<CampaignMessage[]>;
};
export declare const campaignMedia: {
    add: (campaignId: number, media: any) => Promise<string>;
    list: (campaignId: number) => Promise<any[]>;
    delete: (id: string) => Promise<void>;
};
export declare const logs: {
    list: (limit?: number) => Promise<LogEntry[]>;
    create: (log: Omit<LogEntry, "id">) => Promise<number>;
    clear: () => Promise<void>;
};
export declare const reports: {
    generate: () => Promise<any>;
};
//# sourceMappingURL=supabase.d.ts.map