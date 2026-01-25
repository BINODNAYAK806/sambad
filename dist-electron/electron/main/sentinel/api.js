import { createClient } from '@supabase/supabase-js';
import { getSentinelConfig } from '../configManager.js';
// Dedicated Supabase client for Licensing (Always connects to Master)
const sentinelConfig = getSentinelConfig();
const sentinelSupabase = createClient(sentinelConfig.url, sentinelConfig.key);
/**
 * Registers a new device or retrieves existing license.
 */
export async function registerDevice(mobile, deviceId) {
    const { data, error } = await sentinelSupabase.rpc('register_device', {
        p_mobile: mobile,
        p_device_id: deviceId
    });
    if (error) {
        console.error('[Sentinel] Registration failed:', error);
        return { success: false, message: error.message };
    }
    return data;
}
/**
 * Validates a license key against the server.
 */
export async function validateLicense(licenseKey, deviceId) {
    const { data, error } = await sentinelSupabase.rpc('validate_license', {
        p_license_key: licenseKey,
        p_device_id: deviceId
    });
    if (error) {
        console.error('[Sentinel] Validation failed:', error);
        // Fail closed on API error (security first)
        return { valid: false, reason: 'network_error' };
    }
    return data;
}
//# sourceMappingURL=api.js.map