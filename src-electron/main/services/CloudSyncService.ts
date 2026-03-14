import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getLicense } from '../sentinel/store';
import { initDatabase } from '../db/index';
import { logManager } from '../logManager';

export class CloudSyncService {
    private supabase: SupabaseClient | null = null;
    private isSyncing = false;
    private licenseKey: string | null = null;

    private get db() {
        return initDatabase();
    }

    constructor() {
        this.initializeClient();
    }

    private initializeClient() {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            logManager.error('system', '[Cloud Sync] Missing Supabase credentials in .env');
            return;
        }

        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }

    /**
     * Run all sync operations in sequence.
     * Based on user request, this only syncs contact phone numbers once a week.
     */
    public async syncAll(): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;
        
        try {
            this.licenseKey = getLicense();
            if (!this.licenseKey) {
                // If the app is unauthenticated (no license), we can't sync cloud data safely.
                this.isSyncing = false;
                return;
            }

            if (!this.supabase) {
                this.initializeClient();
                if (!this.supabase) throw new Error('Supabase client failed to initialize');
            }

            logManager.info('system', '[Cloud Sync] Starting background sync (Contacts Only)...');

            await this.syncDeletes();
            await this.syncContacts();

        logManager.info('system', '[Cloud Sync] Background sync complete.');
    } catch (error: any) {
        // Specifically catch Supabase schema errors to avoid spamming or crashing
        if (error.message?.includes('Could not find the table') || error.message?.includes('schema cache')) {
            logManager.warn('system', `[Cloud Sync] Supabase table missing or schema outdated: ${error.message}. Please ensure Supabase is configured.`);
        } else {
            logManager.error('system', '[Cloud Sync] Sync failed:', error);
        }
    } finally {
        this.isSyncing = false;
    }
}

    // ---------------------------------------------------------
    // 0. Sync Deletes (Contacts Only)
    // ---------------------------------------------------------
    private async syncDeletes() {
        const pending = this.db.prepare(`SELECT * FROM sync_deletes WHERE table_name = 'contacts' LIMIT 500`).all() as any[];
        if (pending.length === 0) return;

        try {
            const localIds = pending.map(r => r.local_id);
            const { error } = await this.supabase!.from('contacts').delete()
                .eq('license_key', this.licenseKey)
                .in('local_id', localIds);
            
            if (error) throw error;
            
            // Clean up sync_deletes locally
            const deleteIds = pending.map(r => r.id);
            const stmt = this.db.prepare( `DELETE FROM sync_deletes WHERE id = ?` );
            const transaction = this.db.transaction((ids) => {
                for (const id of ids) stmt.run(id);
            });
            transaction(deleteIds);
            
            logManager.info('system', `[Cloud Sync] Propagated ${pending.length} deletes to cloud.`);
        } catch (err: any) {
            logManager.error('system', `[Cloud Sync] Failed to sync deletes: ${err.message}`);
        }
    }

    // ---------------------------------------------------------
    // 1. Sync Contacts (Phone Numbers Only)
    // ---------------------------------------------------------
    private async syncContacts() {
        // Find contacts that were updated after they were last synced,
        // or have never been synced.
        const pending = this.db.prepare(`
            SELECT * FROM contacts 
            WHERE last_synced_at IS NULL 
               OR last_updated_at > last_synced_at
        `).all() as any[];

        if (pending.length === 0) return;

        // ONLY payload the phone number and name. Strip PII (variables).
        const payload = pending.map(row => ({
            license_key: this.licenseKey,
            local_id: row.id,
            phone: row.phone,
            name: row.name, // Include actual contact name
            vars_json: null, // Do not sync PII variables
            is_deleted: row.is_deleted === 1,
            last_updated_at: row.last_updated_at
        }));

        const { error } = await this.supabase!.from('contacts').upsert(payload, { 
            onConflict: 'license_key, local_id'
        });

        if (error) {
            throw new Error(`Contacts sync failed: ${error.message}`);
        }

        // Mark as synced locally
        const timestamp = new Date().toISOString();
        const markSynced = this.db.prepare(`UPDATE contacts SET last_synced_at = ? WHERE id = ?`);
        
        // Transaction for speed
        const transaction = this.db.transaction((updates) => {
            for (const id of updates) markSynced.run(timestamp, id);
        });
        transaction(pending.map(r => r.id));
        
        logManager.info('system', `[Cloud Sync] Synced ${pending.length} contact phone numbers.`);
    }
}

// Export a singleton instance
export const cloudSyncService = new CloudSyncService();
