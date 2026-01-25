export declare function setCampaignMainWindow(win: Electron.BrowserWindow): void;
export declare function updateIpcMainWindow(_mainWindow: Electron.BrowserWindow): void;
export declare function registerIpcHandlers(mainWindow: Electron.BrowserWindow | null): void;
export declare function addLog(mainWindow: Electron.BrowserWindow | null, level: 'info' | 'warn' | 'error' | 'debug', category: 'worker' | 'system' | 'browser' | 'ipc' | 'general', message: string, data?: any): Promise<void>;
//# sourceMappingURL=ipc.d.ts.map