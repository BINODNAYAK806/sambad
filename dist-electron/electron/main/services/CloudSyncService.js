"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudSyncService = exports.CloudSyncService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const store_1 = require("../sentinel/store");
const index_1 = require("../db/index");
const logManager_1 = require("../logManager");
class CloudSyncService {
    supabase = null;
    isSyncing = false;
    licenseKey = null;
    get db() {
        return (0, index_1.initDatabase)();
    }
    constructor() {
        this.initializeClient();
    }
    initializeClient() {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            logManager_1.logManager.error('system', '[Cloud Sync] Missing Supabase credentials in .env');
            return;
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }
    /**
     * Run all sync operations in sequence.
     * Based on user request, this only syncs contact phone numbers once a week.
     */
    async syncAll() {
        if (this.isSyncing)
            return;
        this.isSyncing = true;
        try {
            this.licenseKey = (0, store_1.getLicense)();
            if (!this.licenseKey) {
                // If the app is unauthenticated (no license), we can't sync cloud data safely.
                this.isSyncing = false;
                return;
            }
            if (!this.supabase) {
                this.initializeClient();
                if (!this.supabase)
                    throw new Error('Supabase client failed to initialize');
            }
            logManager_1.logManager.info('system', '[Cloud Sync] Starting background sync (Contacts Only)...');
            await this.syncDeletes();
            await this.syncContacts();
            logManager_1.logManager.info('system', '[Cloud Sync] Background sync complete.');
        }
        catch (error) {
            logManager_1.logManager.error('system', '[Cloud Sync] Sync failed:', error);
        }
        finally {
            this.isSyncing = false;
        }
    }
    // ---------------------------------------------------------
    // 0. Sync Deletes (Contacts Only)
    // ---------------------------------------------------------
    async syncDeletes() {
        const pending = this.db.prepare(`SELECT * FROM sync_deletes WHERE table_name = 'contacts' LIMIT 500`).all();
        if (pending.length === 0)
            return;
        try {
            const localIds = pending.map(r => r.local_id);
            const { error } = await this.supabase.from('contacts').delete()
                .eq('license_key', this.licenseKey)
                .in('local_id', localIds);
            if (error)
                throw error;
            // Clean up sync_deletes locally
            const deleteIds = pending.map(r => r.id);
            const stmt = this.db.prepare(`DELETE FROM sync_deletes WHERE id = ?`);
            const transaction = this.db.transaction((ids) => {
                for (const id of ids)
                    stmt.run(id);
            });
            transaction(deleteIds);
            logManager_1.logManager.info('system', `[Cloud Sync] Propagated ${pending.length} deletes to cloud.`);
        }
        catch (err) {
            logManager_1.logManager.error('system', `[Cloud Sync] Failed to sync deletes: ${err.message}`);
        }
    }
    // ---------------------------------------------------------
    // 1. Sync Contacts (Phone Numbers Only)
    // ---------------------------------------------------------
    async syncContacts() {
        // Find contacts that were updated after they were last synced,
        // or have never been synced.
        const pending = this.db.prepare(`
            SELECT * FROM contacts 
            WHERE last_synced_at IS NULL 
               OR last_updated_at > last_synced_at
        `).all();
        if (pending.length === 0)
            return;
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
        const { error } = await this.supabase.from('contacts').upsert(payload, {
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
            for (const id of updates)
                markSynced.run(timestamp, id);
        });
        transaction(pending.map(r => r.id));
        logManager_1.logManager.info('system', `[Cloud Sync] Synced ${pending.length} contact phone numbers.`);
    }
}
exports.CloudSyncService = CloudSyncService;
// Export a singleton instance
exports.cloudSyncService = new CloudSyncService();
//# sourceMappingURL=CloudSyncService.js.map