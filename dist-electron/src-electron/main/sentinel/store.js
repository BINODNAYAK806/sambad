"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveLicense = saveLicense;
exports.getLicense = getLicense;
exports.clearLicense = clearLicense;
const { app, safeStorage } = require('electron');
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const STORE_FILE = 'sentinel.enc';
function getStorePath() {
    return path.join(app.getPath('userData'), STORE_FILE);
}
/**
 * Saves the license key securely.
 * Uses Electron's safeStorage if available (OS keychain), otherwise simple obscuration (dev fallback).
 */
function saveLicense(licenseKey) {
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
function getLicense() {
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
function clearLicense() {
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