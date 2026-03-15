"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDevice = registerDevice;
exports.validateLicense = validateLicense;
const supabase_js_1 = require("@supabase/supabase-js");
const configManager_js_1 = require("../configManager.js");
// Dedicated Supabase client for Licensing (Always connects to Master)
const sentinelConfig = (0, configManager_js_1.getSentinelConfig)();
const sentinelSupabase = (0, supabase_js_1.createClient)(sentinelConfig.url, sentinelConfig.key);
/**
 * Registers a new device or retrieves existing license.
 */
async function registerDevice(mobile, deviceId) {
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
async function validateLicense(licenseKey, deviceId) {
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