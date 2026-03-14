import { createClient } from '@supabase/supabase-js';
import { getSentinelConfig } from '../configManager.js';

// Dedicated Supabase client for Licensing (Always connects to Master)
const sentinelConfig = getSentinelConfig();
const sentinelSupabase = createClient(sentinelConfig.url, sentinelConfig.key);

export interface DeviceRegistrationResult {
    success: boolean;
    message?: string;
    is_new?: boolean;
    license_key?: string;
    expires_at?: string;
}

export interface LicenseValidationResult {
    valid: boolean;
    reason?: string;
    expires_at?: string;
}

/**
 * Registers a new device or retrieves existing license.
 */
export async function registerDevice(mobile: string, deviceId: string): Promise<DeviceRegistrationResult> {
    const { data, error } = await sentinelSupabase.rpc('register_device', {
        p_mobile: mobile,
        p_device_id: deviceId
    });

    if (error) {
        console.error('[Sentinel] Registration failed:', error);
        return { success: false, message: error.message };
    }

    return data as DeviceRegistrationResult;
}

/**
 * Validates a license key against the server.
 */
export async function validateLicense(licenseKey: string, deviceId: string): Promise<LicenseValidationResult> {
    const { data, error } = await sentinelSupabase.rpc('validate_license', {
        p_license_key: licenseKey,
        p_device_id: deviceId
    });

    if (error) {
        console.error('[Sentinel] Validation failed:', error);
        // Fail closed on API error (security first)
        return { valid: false, reason: 'network_error' };
    }

    return data as LicenseValidationResult;
}
