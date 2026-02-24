import { BrowserWindow } from 'electron';
export declare class AutoUpdater {
    private mainWindow;
    private updateCheckInProgress;
    constructor();
    setMainWindow(window: BrowserWindow): void;
    private setupAutoUpdater;
    checkForUpdates(): void;
    checkForUpdatesAndNotify(): void;
    quitAndInstall(): void;
}
export declare const appUpdater: AutoUpdater;
//# sourceMappingURL=autoUpdater.d.ts.map