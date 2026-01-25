import updater from 'electron-updater';
import { dialog } from 'electron';
import log from 'electron-log';
import { logManager } from './logManager.js';
const { autoUpdater } = updater;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
export class AutoUpdater {
    mainWindow = null;
    updateCheckInProgress = false;
    constructor() {
        this.setupAutoUpdater();
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    setupAutoUpdater() {
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.on('checking-for-update', () => {
            logManager.info('system', 'Checking for updates...');
            this.updateCheckInProgress = true;
        });
        autoUpdater.on('update-available', (info) => {
            logManager.info('system', 'Update available', {
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
                        logManager.info('system', 'User chose to download update');
                        autoUpdater.downloadUpdate();
                    }
                    else {
                        logManager.info('system', 'User postponed update');
                    }
                });
            }
        });
        autoUpdater.on('update-not-available', (info) => {
            logManager.info('system', 'Update not available', { version: info.version });
            this.updateCheckInProgress = false;
            // Notify renderer
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('update:not-available');
            }
        });
        autoUpdater.on('error', (error) => {
            logManager.error('system', 'Update error', error);
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
        autoUpdater.on('download-progress', (progress) => {
            const progressPercent = Math.round(progress.percent);
            logManager.debug('system', `Download progress: ${progressPercent}%`, {
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
        autoUpdater.on('update-downloaded', (info) => {
            logManager.info('system', 'Update downloaded', { version: info.version });
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
                        logManager.info('system', 'Installing update and restarting...');
                        autoUpdater.quitAndInstall(false, true);
                    }
                    else {
                        logManager.info('system', 'Update will be installed on next restart');
                    }
                });
            }
        });
    }
    checkForUpdates() {
        if (!this.updateCheckInProgress) {
            logManager.info('system', 'Manual update check triggered');
            autoUpdater.checkForUpdates().catch((error) => {
                logManager.error('system', 'Failed to check for updates', error);
            });
        }
        else {
            logManager.warn('system', 'Update check already in progress');
        }
    }
    checkForUpdatesAndNotify() {
        if (!this.updateCheckInProgress) {
            logManager.info('system', 'Automatic update check triggered');
            autoUpdater.checkForUpdatesAndNotify().catch((error) => {
                logManager.error('system', 'Failed to check for updates', error);
            });
        }
    }
    quitAndInstall() {
        logManager.info('system', 'Quitting and installing update');
        autoUpdater.quitAndInstall(false, true);
    }
}
export const appUpdater = new AutoUpdater();
//# sourceMappingURL=autoUpdater.js.map