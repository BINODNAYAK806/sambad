try {
    const electron = require('electron');
    if (electron && electron.app) {
        global.electronApp = electron.app;
        global.electronBrowserWindow = electron.BrowserWindow;
        global.electronDialog = electron.dialog;
        global.electronIpcMain = electron.ipcMain;
        global.electronShell = electron.shell;
        global.electronSafeStorage = electron.safeStorage;
        console.log('[InitElectron] APIs successfully captured and attached to global');
    } else {
        console.warn('[InitElectron] Failed to capture Electron APIs. Result was:', typeof electron);
    }
} catch (e) {
    console.error('[InitElectron] Fatal error during capture:', e.message);
}
