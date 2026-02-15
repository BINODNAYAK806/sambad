/**
 * Hybrid Storage Service
 *
 * This service implements a production-ready, hybrid storage architecture:
 *
 * 1. LOCAL STORAGE (SQLite in userData):
 *    - WhatsApp session data (.wwebjs_auth folder)
 *    - Application logs and error logs
 *    - Fallback storage when offline
 *
 * 2. CLOUD STORAGE (Supabase):
 *    - Contacts (phone, name, variables)
 *    - Groups and group memberships
 *    - Campaigns and campaign messages
 *    - Analytics and reports
 *
 * Security: Session data NEVER leaves the local machine.
 * Business data is synced to cloud for multi-device access.
 */
import { SupabaseClient } from '@supabase/supabase-js';
export type StorageMode = 'cloud' | 'local' | 'hybrid';
export interface StorageConfig {
    mode: StorageMode;
    supabaseUrl?: string;
    supabaseKey?: string;
}
export declare class StorageService {
    private supabase;
    private mode;
    private localDb;
    constructor(config?: StorageConfig);
    initialize(config: StorageConfig): void;
    getMode(): StorageMode;
    isCloudAvailable(): boolean;
    /**
     * CONTACTS - Always use cloud when available, fallback to local
     */
    getContacts(): Promise<any[]>;
    createContact(contact: any): Promise<any>;
    updateContact(id: number, updates: any): Promise<void>;
    deleteContact(id: number): Promise<void>;
    addContact(contact: any): Promise<boolean>;
    /**
     * GROUPS - Cloud with local fallback
     */
    getGroups(): Promise<any[]>;
    createGroup(group: {
        name: string;
    }): Promise<any>;
    /**
     * CAMPAIGNS - Cloud with local fallback
     */
    getCampaigns(): Promise<any[]>;
    getCampaignWithMessages(id: number | string): Promise<any>;
    createCampaign(campaign: any): Promise<any>;
    updateCampaign(id: number, updates: any): Promise<void>;
    updateCampaignProgress(id: number, sentCount: number, failedCount: number, status?: string): Promise<void>;
    deleteCampaign(id: number): Promise<void>;
    /**
     * Get Supabase client (for worker thread)
     */
    getSupabaseClient(): SupabaseClient | null;
    /**
     * Get Supabase credentials (for worker thread)
     */
    getSupabaseCredentials(): {
        url: string;
        key: string;
    } | null;
    /**
     * CAMPAIGN MEDIA - Local-first
     */
    getCampaignMedia(campaignId: number): Promise<any[]>;
    createCampaignMedia(media: any): Promise<void>;
    deleteCampaignMedia(id: string): Promise<void>;
    updateCampaignMessageStatus(messageId: string, status: 'sent' | 'failed', errorMsg?: string): Promise<void>;
    close(): void;
}
export declare const storageService: StorageService;
//# sourceMappingURL=storageService.d.ts.map