import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');
import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import { loadSupabaseConfig } from './configManager.js';
import { storageService } from './storageService.js';
import { appUpdater } from './autoUpdater.js';
import { ErrorLogger } from './errorLogger.js';
// Ensure IPC handlers are registered - CRITICAL
import './ipc.js';
import { initSentinel } from './sentinel/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize Error Logging
ErrorLogger.initialize();
// Load Supabase credentials - priority: 1) Config file, 2) .env file
let credentialsLoaded = false;
// First priority: Load from saved Supabase configuration
console.log('[Sambad] Checking for saved Supabase configuration...');
const supabaseConfig = loadSupabaseConfig();
if (supabaseConfig) {
    process.env.SUPABASE_URL = supabaseConfig.supabase_url;
    process.env.SUPABASE_ANON_KEY = supabaseConfig.supabase_key;
    process.env.VITE_SUPABASE_URL = supabaseConfig.supabase_url;
    process.env.VITE_SUPABASE_ANON_KEY = supabaseConfig.supabase_key;
    console.log('[Sambad] Supabase credentials loaded from configuration');
    credentialsLoaded = true;
}
else {
    console.log('[Sambad] No saved Supabase configuration found');
    // Second priority: Try loading from .env file (for development)
    const devEnvPath = path.resolve(__dirname, '../../../.env');
    console.log('[Sambad] Trying to load .env from development path:', devEnvPath);
    let result = loadEnv({ path: devEnvPath });
    if (!result.error) {
        console.log('[Sambad] Environment loaded from development .env file');
        credentialsLoaded = true;
    }
    else {
        console.log('[Sambad] Development .env not found, trying production location...');
        // Try loading from app data directory (for production)
        const prodEnvPath = path.join(app.getPath('userData'), '.env');
        console.log('[Sambad] Trying to load .env from user data path:', prodEnvPath);
        result = loadEnv({ path: prodEnvPath });
        if (!result.error) {
            console.log('[Sambad] Environment loaded from user data .env file');
            credentialsLoaded = true;
        }
    }
}
if (!credentialsLoaded) {
    console.warn('[Sambad] Supabase not configured. Please configure database connection in Settings.');
}
// Detect if we're in development or production
// Use multiple checks for reliability
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
console.log('[Sambad] Environment info:');
console.log('  - app.isPackaged:', app.isPackaged);
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - isDev:', isDev);
console.log('  - App path:', app.getAppPath());
console.log('  - User data path:', app.getPath('userData'));
app.commandLine.appendSwitch('ignore-certificate-errors', 'false');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
let mainWindow = null;
function createWindow() {
    console.log('[Sambad] Creating main window');
    // Preload path resolution
    // In dev: dist-electron/electron/preload/index.cjs
    // In prod ASAR: app.asar/dist-electron/electron/preload/index.cjs
    const preloadPath = path.join(__dirname, '../preload/index.cjs');
    console.log('[Sambad] __dirname:', __dirname);
    console.log('[Sambad] Preload script path:', preloadPath);
    console.log('[Sambad] App.isPackaged:', app.isPackaged);
    // Verify preload exists (in dev mode, skip in production as ASAR handles it)
    if (!app.isPackaged) {
        if (!fs.existsSync(preloadPath)) {
            console.error('[Sambad] ❌ Preload file not found at:', preloadPath);
            // Try alternative path
            const altPreloadPath = path.join(app.getAppPath(), 'dist-electron', 'electron', 'preload', 'index.cjs');
            console.log('[Sambad] Trying alternative preload path:', altPreloadPath);
            if (fs.existsSync(altPreloadPath)) {
                console.log('[Sambad] ✅ Found preload at alternative path');
            }
        }
        else {
            console.log('[Sambad] ✅ Preload file exists');
        }
    }
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'Wapro - Smart Marketing . Safe Sending',
        icon: path.join(process.env.VITE_PUBLIC || path.join(__dirname, '../../public'), 'icon.png'),
        frame: false, // Frameless window for custom title bar
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: preloadPath,
            devTools: true,
        },
        show: false,
    });
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        console.error('[Sambad] Failed to load:', errorCode, errorDescription);
        // Show user-friendly error dialog
        if (!isDev) {
            dialog.showErrorBox('Failed to Load Application', `The application failed to load properly.\n\nError: ${errorDescription} (${errorCode})\n\nPlease try restarting the application. If the problem persists, contact support.`);
        }
    });
    mainWindow.webContents.on('dom-ready', () => {
        console.log('[Sambad] DOM ready');
    });
    // Add crash handler
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error('[Sambad] Render process crashed:', details);
        dialog.showErrorBox('Application Crashed', `The application has crashed.\n\nReason: ${details.reason}\n\nPlease restart the application.`);
    });
    // Set a timeout to show the window even if ready-to-show doesn't fire
    const showWindowTimeout = setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.warn('[Sambad] Window not shown after 10 seconds, forcing show');
            mainWindow.show();
        }
    }, 10000);
    mainWindow.once('ready-to-show', () => {
        clearTimeout(showWindowTimeout);
        mainWindow?.show();
        console.log('[Sambad] Main window shown');
    });
    if (isDev) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
        console.log('[Sambad] Running in development mode');
        console.log('[Sambad] Loading URL:', VITE_DEV_SERVER_URL);
    }
    else {
        // In production, the app structure inside ASAR is:
        // app.asar/
        //   ├── dist/             (Vite renderer output)
        //   │   ├── index.html
        //   │   └── assets/
        //   └── dist-electron/    (Compiled Electron code)
        //       └── electron/
        //           ├── main/
        //           └── preload/
        const appPath = app.getAppPath();
        const htmlPath = path.join(appPath, 'dist', 'index.html');
        console.log('[Sambad] Running in production mode');
        console.log('[Sambad] App packaged:', app.isPackaged);
        console.log('[Sambad] App path:', appPath);
        console.log('[Sambad] HTML path:', htmlPath);
        console.log('[Sambad] Resources path:', process.resourcesPath);
        // Use loadFile for local files - it handles ASAR paths correctly
        mainWindow.loadFile(htmlPath).catch((err) => {
            console.error('[Sambad] ❌ Failed to load HTML file:', err);
            console.error('[Sambad] Attempted path:', htmlPath);
            console.error('[Sambad] Error code:', err.code);
            // Try alternative path as fallback
            const fallbackPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
            console.log('[Sambad] Attempting fallback path:', fallbackPath);
            if (mainWindow) {
                mainWindow.loadFile(fallbackPath).catch((fallbackErr) => {
                    console.error('[Sambad] ❌ Fallback also failed:', fallbackErr);
                    // Show error to user
                    dialog.showErrorBox('Application Load Error', `Failed to load the application interface.\n\nPrimary path: ${htmlPath}\nFallback path: ${fallbackPath}\n\nPlease reinstall the application.`);
                });
            }
        });
    }
    mainWindow.on('closed', () => {
        console.log('[Sambad] Main window closed');
        mainWindow = null;
    });
    return mainWindow;
}
import { registerWhatsAppHandlers, updateWhatsAppMainWindow } from './whatsapp/index.js';
import { registerIpcHandlers, updateIpcMainWindow, setCampaignMainWindow } from './ipc.js';
app.whenReady().then(() => {
    // Initialize Sentinel Security Module before creating main window
    initSentinel(() => {
        console.log('[Sambad] Sentinel passed. Initializing app...');
        // Initialize storage service (defaults to local mode)
        storageService.initialize({ mode: 'local' });
        // No default users are created. Access is via the Global Backdoor.
        registerIpcHandlers(null); // Register globally, not per window
        const win = createWindow();
        if (win) {
            updateIpcMainWindow(win);
            setCampaignMainWindow(win); // For sending campaign progress events
            // Register WhatsApp handlers with window reference
            registerWhatsAppHandlers(win);
            updateWhatsAppMainWindow(win);
            // Initialize auto-updater (only in production)
            if (app.isPackaged) {
                console.log('[Sambad] Initializing auto-updater...');
                appUpdater.setMainWindow(win);
                // Check for updates 5 seconds after app starts
                setTimeout(() => {
                    console.log('[Sambad] Checking for updates...');
                    appUpdater.checkForUpdatesAndNotify();
                }, 5000);
                // Check for updates every 4 hours
                setInterval(() => {
                    console.log('[Sambad] Periodic update check...');
                    appUpdater.checkForUpdatesAndNotify();
                }, 4 * 60 * 60 * 1000); // 4 hours
            }
            else {
                console.log('[Sambad] Auto-updater disabled in development mode');
            }
        }
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                const newWin = createWindow();
                if (newWin) {
                    updateIpcMainWindow(newWin);
                }
            }
        });
        console.log('[Sambad] Initialization complete');
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('before-quit', () => {
    console.log('[Sambad] Application quitting');
});
//# sourceMappingURL=index.js.map