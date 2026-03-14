"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_dns_1 = require("node:dns");
(0, node_dns_1.setDefaultResultOrder)('ipv4first');
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, dialog } = require('electron');
console.log('[Sambad] Starting Main Process...');
console.log('[Sambad] Electron app defined:', !!app);
const dotenv_1 = require("dotenv");
const configManager_1 = require("./configManager");
const storageService_1 = require("./storageService");
const autoUpdater_1 = require("./autoUpdater");
const errorLogger_1 = require("./errorLogger");
// Ensure IPC handlers are registered - CRITICAL
require("./ipc");
const index_1 = require("./sentinel/index");
const CloudSyncService_1 = require("./services/CloudSyncService");
// In CJS, __dirname and __filename are globally available
// We don't need to derive them from import.meta.url
// Initialize Error Logging
let credentialsLoaded = false;
let isDev = false;
function initializeEnvironment() {
    // Load Supabase credentials - priority: 1) Config file, 2) .env file
    // First priority: Load from saved Supabase configuration
    console.log('[Sambad] Checking for saved Supabase configuration...');
    const supabaseConfig = (0, configManager_1.loadSupabaseConfig)();
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
        let result = (0, dotenv_1.config)({ path: devEnvPath });
        if (!result.error) {
            console.log('[Sambad] Environment loaded from development .env file');
            credentialsLoaded = true;
        }
        else {
            console.log('[Sambad] Development .env not found, trying production location...');
            // Try loading from app data directory (for production)
            const prodEnvPath = path.join(app.getPath('userData'), '.env');
            console.log('[Sambad] Trying to load .env from user data path:', prodEnvPath);
            result = (0, dotenv_1.config)({ path: prodEnvPath });
            if (!result.error) {
                console.log('[Sambad] Environment loaded from user data .env file');
                credentialsLoaded = true;
            }
        }
    }
    if (!credentialsLoaded) {
        console.warn('[Sambad] Supabase not configured. Please configure database connection in Settings.');
    }
    isDev = app && !app.isPackaged && process.env.NODE_ENV !== 'production';
}
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
// Logging moved inside app.whenReady()
if (app && app.commandLine) {
    app.commandLine.appendSwitch('ignore-certificate-errors', 'false');
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}
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
    if (mainWindow) {
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
    }
    // Set a timeout to show the window even if ready-to-show doesn't fire
    const showWindowTimeout = setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.warn('[Sambad] Window not shown after 10 seconds, forcing show');
            mainWindow.show();
        }
    }, 10000);
    if (mainWindow) {
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
            //
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
    }
    if (mainWindow) {
        mainWindow.on('closed', () => {
            console.log('[Sambad] Main window closed');
            mainWindow = null;
        });
    }
    return mainWindow;
}
const index_2 = require("./whatsapp/index");
const ipc_1 = require("./ipc");
console.log('[Sambad] Electron version:', process.versions.electron);
if (!app) {
    console.error('[Sambad] ❌ CRITICAL: Electron app object is undefined!');
    console.log('[Sambad] Process keys:', Object.keys(process).join(', '));
    process.exit(1);
}
app.whenReady().then(() => {
    // Initialize environment and logging
    initializeEnvironment();
    console.log('[Sambad] Environment info:');
    console.log('  - app.isPackaged:', app.isPackaged);
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - isDev:', isDev);
    console.log('  - App path:', app.getAppPath());
    try {
        console.log('  - User data path:', app.getPath('userData'));
    }
    catch (e) { }
    // Initialize Error Logging now that app is ready
    errorLogger_1.ErrorLogger.initialize();
    // Initialize Sentinel Security Module before creating main window
    (0, index_1.initSentinel)(() => {
        console.log('[Sambad] Sentinel passed. Initializing app...');
        // Initialize storage service (defaults to local mode)
        storageService_1.storageService.initialize({ mode: 'local' });
        // Start Cloud Sync Service (Weekly Database Backup)
        console.log('[Sambad] Starting Cloud Sync Engine (Weekly Backup)...');
        CloudSyncService_1.cloudSyncService.syncAll().catch(e => console.error('[Sambad] Sync failed on boot:', e));
        // 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        setInterval(() => {
            CloudSyncService_1.cloudSyncService.syncAll().catch(e => console.error('[Sambad] Periodic sync failed:', e));
        }, ONE_WEEK_MS);
        // No default users are created. Access is via the Global Backdoor.
        // Register IPC handlers globally
        // We'll provide the appUpdater later if packaged
        (0, ipc_1.registerIpcHandlers)(null);
        const win = createWindow();
        if (win) {
            global.mainWindow = win; // Attach for global access
            (0, ipc_1.updateIpcMainWindow)(win);
            (0, ipc_1.setCampaignMainWindow)(win); // For sending campaign progress events
            // Register WhatsApp handlers with window reference
            (0, index_2.registerWhatsAppHandlers)(win);
            (0, index_2.updateWhatsAppMainWindow)(win);
            // Initialize auto-updater (only in production)
            if (app.isPackaged) {
                console.log('[Sambad] Initializing auto-updater...');
                const appUpdater = new autoUpdater_1.AutoUpdater();
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
                    (0, ipc_1.updateIpcMainWindow)(newWin);
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