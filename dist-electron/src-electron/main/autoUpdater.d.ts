export declare class AutoUpdater {
    private mainWindow;
    private updateCheckInProgress;
    private _autoUpdater;
    constructor();
    private get autoUpdater();
    setMainWindow(window: any): void;
    private setupAutoUpdater;
    checkForUpdates(): void;
    checkForUpdatesAndNotify(): void;
    quitAndInstall(): void;
}
//# sourceMappingURL=autoUpdater.d.ts.map