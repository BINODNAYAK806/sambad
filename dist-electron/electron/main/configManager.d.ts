export interface SupabaseConfig {
    supabase_url: string;
    supabase_key: string;
    saved_at?: string;
    app_version?: string;
}
export declare function hasSupabaseConfig(): boolean;
export declare function loadSupabaseConfig(): SupabaseConfig | null;
export declare function getSentinelConfig(): {
    url: string;
    key: string;
};
export declare function saveSupabaseConfig(supabaseUrl: string, supabaseKey: string): boolean;
export declare function clearSupabaseConfig(): boolean;
export declare function validateSupabaseCredentials(supabaseUrl: string, supabaseKey: string): {
    valid: boolean;
    error?: string;
};
export declare function getSupabaseStatus(): {
    configured: boolean;
    supabaseUrl?: string;
    savedAt?: string;
};
//# sourceMappingURL=configManager.d.ts.map