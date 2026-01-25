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
export declare function registerDevice(mobile: string, deviceId: string): Promise<DeviceRegistrationResult>;
/**
 * Validates a license key against the server.
 */
export declare function validateLicense(licenseKey: string, deviceId: string): Promise<LicenseValidationResult>;
//# sourceMappingURL=api.d.ts.map