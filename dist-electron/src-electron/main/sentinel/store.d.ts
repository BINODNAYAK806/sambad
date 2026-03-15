/**
 * Saves the license key securely.
 * Uses Electron's safeStorage if available (OS keychain), otherwise simple obscuration (dev fallback).
 */
export declare function saveLicense(licenseKey: string): boolean;
/**
 * Retrieves the stored license key.
 */
export declare function getLicense(): string | null;
/**
 * Clears the stored license.
 */
export declare function clearLicense(): void;
//# sourceMappingURL=store.d.ts.map