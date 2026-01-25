import { BrowserWindow, ipcMain, app } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getDeviceFingerprint } from './hardware.js';
import { getLicense, saveLicense } from './store.js';
import { validateLicense, registerDevice } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sentinelWindow: BrowserWindow | null = null;
let onSuccessCallback: (() => void) | null = null;

// internal state to prevent main window launch loop if sentinel fails
let isValidationInProgress = false;

export async function initSentinel(onSuccess: () => void) {
    onSuccessCallback = onSuccess;

    if (isValidationInProgress) return;
    isValidationInProgress = true;

    try {
        const deviceId = getDeviceFingerprint();
        const storedLicense = getLicense();

        console.log('[Sentinel] Device ID:', deviceId);
        console.log('[Sentinel] Stored License:', storedLicense ? 'Present' : 'Missing');

        if (storedLicense) {
            // Validate existing license
            const result = await validateLicense(storedLicense, deviceId);

            if (result.valid) {
                console.log('[Sentinel] Silent validation passed. Launching app.');
                isValidationInProgress = false;
                onSuccess();
                return;
            } else {
                console.warn('[Sentinel] Validation failed:', result.reason);
                // If expired or mismatch, clear local storage and show UI
                if (result.reason === 'device_mismatch' || result.reason === 'expired' || result.reason === 'suspended') {
                    // clearLicense(); // Optional: keep it to pre-fill? Better to force re-entry.
                }
                showSentinelWindow(result.reason);
            }
        } else {
            // No license, show registration
            showSentinelWindow('missing');
        }
    } catch (error) {
        console.error('[Sentinel] Initialization Error:', error);
        showSentinelWindow('error');
    }
}



const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function showSentinelWindow(reason?: string) {
    if (sentinelWindow) {
        sentinelWindow.focus();
        return;
    }

    // Determine preload path (same as main app or specific)
    // Determine preload path (same as main app or specific)
    const preload = path.join(__dirname, '../../preload/index.cjs'); // Adjust path based on build structure
    // Robust production path resolution
    const appPath = app.getAppPath();
    const indexHtml = path.join(appPath, 'dist', 'index.html');

    sentinelWindow = new BrowserWindow({
        width: 450,
        height: 600,
        frame: false, // Custom UI style
        resizable: false,
        webPreferences: {
            preload,
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Security Check',
        backgroundColor: '#09090b', // zinc-950
        show: false // Don't show until ready to prevent white flash
    });

    // Don't open DevTools in production
    if (isDev) {
        sentinelWindow.webContents.openDevTools({ mode: 'detach' });
    }

    sentinelWindow.once('ready-to-show', () => {
        sentinelWindow?.show();
    });

    if (isDev) {
        sentinelWindow.loadURL(`${VITE_DEV_SERVER_URL}#/sentinel?reason=${reason || ''}`);
    } else {
        // In production, use the hash option correctly with loadFile
        sentinelWindow.loadFile(indexHtml, { hash: `/sentinel?reason=${reason || ''}` });
    }

    sentinelWindow.on('closed', () => {
        sentinelWindow = null;
        // If closed without success, quit app (unless validation passed)
        if (isValidationInProgress) {
            console.log('[Sentinel] Window closed without validation. Quitting.');
            app.quit();
        }
    });

    // Setup Sentinel-specific IPC handlers
    setupIPC();
}

function setupIPC() {
    ipcMain.handle('sentinel:register', async (_, { mobile }) => {
        try {
            const deviceId = getDeviceFingerprint();
            const result = await registerDevice(mobile, deviceId);
            return result;
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    });

    ipcMain.handle('sentinel:activate', async (_, { licenseKey }) => {
        try {
            const deviceId = getDeviceFingerprint();
            const result = await validateLicense(licenseKey, deviceId);

            if (result.valid) {
                saveLicense(licenseKey);
                // Close sentinel and launch main app
                isValidationInProgress = false;
                if (sentinelWindow) {
                    // Remove close listener to prevent app quit
                    sentinelWindow.removeAllListeners('closed');
                    sentinelWindow.close();
                }
                if (onSuccessCallback) onSuccessCallback();
                return { success: true };
            } else {
                return { success: false, reason: result.reason };
            }
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    });

    ipcMain.handle('sentinel:get-device-id', () => {
        return getDeviceFingerprint();
    });
}
