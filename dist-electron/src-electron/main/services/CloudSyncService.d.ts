export declare class CloudSyncService {
    private supabase;
    private isSyncing;
    private licenseKey;
    private get db();
    constructor();
    private initializeClient;
    /**
     * Run all sync operations in sequence.
     * Based on user request, this only syncs contact phone numbers once a week.
     */
    syncAll(): Promise<void>;
    private syncDeletes;
    private syncContacts;
}
export declare const cloudSyncService: CloudSyncService;
//# sourceMappingURL=CloudSyncService.d.ts.map