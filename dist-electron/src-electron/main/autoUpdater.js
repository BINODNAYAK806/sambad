"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoUpdater = void 0;
// Robust Electron import for CommonJS
const { app, BrowserWindow, dialog } = require('electron');
const log = require('electron-log');
const logManager_1 = require("./logManager");
class AutoUpdater {
    mainWindow = null;
    updateCheckInProgress = false;
    _autoUpdater = null;
    constructor() {
        logManager_1.logManager.info('system', 'AutoUpdater initialized');
    }
    get autoUpdater() {
        if (!this._autoUpdater) {
            const { autoUpdater } = require('electron-updater');
            this._autoUpdater = autoUpdater;
            this.setupAutoUpdater();
        }
        return this._autoUpdater;
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    setupAutoUpdater() {
        const updater = this._autoUpdater;
        if (!updater)
            return;
        // Configure logger here to ensure app is ready if needed, 
        // though electron-updater usually handles this if called late enough.
        updater.logger = log;
        updater.logger.transports.file.level = 'info';
        updater.autoDownload = false;
        updater.autoInstallOnAppQuit = true;
        updater.on('checking-for-update', () => {
            logManager_1.logManager.info('system', 'Checking for updates...');
            this.updateCheckInProgress = true;
        });
        updater.on('update-available', (info) => {
            logManager_1.logManager.info('system', 'Update available', {
                version: info.version,
                releaseDate: info.releaseDate,
            });
            this.updateCheckInProgress = false;
            // Notify renderer
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('update:available', info);
                dialog
                    .showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Update Available',
                    message: `A new version (${info.version}) is available. Would you like to download it now?`,
                    buttons: ['Download', 'Later'],
                    defaultId: 0,
                    cancelId: 1,
                })
                    .then((result) => {
                    if (result.response === 0) {
                        logManager_1.logManager.info('system', 'User chose to download update');
                        updater.downloadUpdate();
                    }
                    else {
                        logManager_1.logManager.info('system', 'User postponed update');
                    }
                });
            }
        });
        updater.on('update-not-available', (info) => {
            logManager_1.logManager.info('system', 'Update not available', { version: info.version });
            this.updateCheckInProgress = false;
            // Notify renderer
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('update:not-available');
            }
        });
        updater.on('error', (error) => {
            logManager_1.logManager.error('system', 'Update error', error);
            this.updateCheckInProgress = false;
            // Notify renderer
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('update:error', error.message);
                dialog.showMessageBox(this.mainWindow, {
                    type: 'error',
                    title: 'Update Error',
                    message: 'An error occurred while checking for updates.',
                    detail: error.message,
                    buttons: ['OK'],
                });
            }
        });
        updater.on('download-progress', (progress) => {
            const progressPercent = Math.round(progress.percent);
            logManager_1.logManager.debug('system', `Download progress: ${progressPercent}%`, {
                transferred: progress.transferred,
                total: progress.total,
                bytesPerSecond: progress.bytesPerSecond,
            });
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.setProgressBar(progress.percent / 100);
                this.mainWindow.webContents.send('update:download-progress', {
                    percent: progressPercent,
                    transferred: progress.transferred,
                    total: progress.total,
                });
            }
        });
        updater.on('update-downloaded', (info) => {
            logManager_1.logManager.info('system', 'Update downloaded', { version: info.version });
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.setProgressBar(-1);
                // Notify renderer
                this.mainWindow.webContents.send('update:downloaded', info);
                dialog
                    .showMessageBox(this.mainWindow, {
                    type: 'info',
                    title: 'Update Ready',
                    message: `Update ${info.version} has been downloaded. The application will restart to install the update.`,
                    buttons: ['Restart Now', 'Restart Later'],
                    defaultId: 0,
                    cancelId: 1,
                })
                    .then((result) => {
                    if (result.response === 0) {
                        logManager_1.logManager.info('system', 'Installing update and restarting...');
                        updater.quitAndInstall(false, true);
                    }
                    else {
                        logManager_1.logManager.info('system', 'Update will be installed on next restart');
                    }
                });
            }
        });
    }
    checkForUpdates() {
        if (!this.updateCheckInProgress) {
            logManager_1.logManager.info('system', 'Manual update check triggered');
            this.autoUpdater.checkForUpdates().catch((error) => {
                logManager_1.logManager.error('system', 'Failed to check for updates', error);
            });
        }
        else {
            logManager_1.logManager.warn('system', 'Update check already in progress');
        }
    }
    checkForUpdatesAndNotify() {
        if (!this.updateCheckInProgress) {
            logManager_1.logManager.info('system', 'Automatic update check triggered');
            this.autoUpdater.checkForUpdatesAndNotify().catch((error) => {
                logManager_1.logManager.error('system', 'Failed to check for updates', error);
            });
        }
    }
    quitAndInstall() {
        logManager_1.logManager.info('system', 'Quitting and installing update');
        this.autoUpdater.quitAndInstall(false, true);
    }
}
exports.AutoUpdater = AutoUpdater;
//# sourceMappingURL=autoUpdater.js.map