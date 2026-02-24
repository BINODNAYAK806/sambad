import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
const STORE_FILE = 'sentinel.enc';
function getStorePath() {
    return path.join(app.getPath('userData'), STORE_FILE);
}
/**
 * Saves the license key securely.
 * Uses Electron's safeStorage if available (OS keychain), otherwise simple obscuration (dev fallback).
 */
export function saveLicense(licenseKey) {
    try {
        const filePath = getStorePath();
        let buffer;
        if (safeStorage.isEncryptionAvailable()) {
            buffer = safeStorage.encryptString(licenseKey);
        }
        else {
            console.warn('[Sentinel] safeStorage unavailable. Using insecure fallback.');
            buffer = Buffer.from(licenseKey, 'utf-8'); // Plain text fallback (only for dev/linux without keychain)
        }
        fs.writeFileSync(filePath, buffer);
        return true;
    }
    catch (error) {
        console.error('[Sentinel] Failed to save license:', error);
        return false;
    }
}
/**
 * Retrieves the stored license key.
 */
export function getLicense() {
    try {
        const filePath = getStorePath();
        if (!fs.existsSync(filePath))
            return null;
        const buffer = fs.readFileSync(filePath);
        if (safeStorage.isEncryptionAvailable()) {
            try {
                return safeStorage.decryptString(buffer);
            }
            catch {
                // If decryption fails (e.g. key changed), treat as no license
                return null;
            }
        }
        else {
            return buffer.toString('utf-8');
        }
    }
    catch (error) {
        console.error('[Sentinel] Failed to read license:', error);
        return null;
    }
}
/**
 * Clears the stored license.
 */
export function clearLicense() {
    try {
        const filePath = getStorePath();
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('[Sentinel] Failed to clear license:', error);
    }
}
//# sourceMappingURL=store.js.map