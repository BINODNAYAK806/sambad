import { BrowserWindow } from 'electron';
export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
    message: string;
    data?: any;
}
declare class LogManager {
    private logs;
    private maxLogs;
    private consoleWindow;
    setConsoleWindow(window: BrowserWindow | null): void;
    log(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any): void;
    info(category: LogEntry['category'], message: string, data?: any): void;
    warn(category: LogEntry['category'], message: string, data?: any): void;
    error(category: LogEntry['category'], message: string, data?: any): void;
    debug(category: LogEntry['category'], message: string, data?: any): void;
    getLogs(): LogEntry[];
    clearLogs(): void;
    getLogsByCategory(category: LogEntry['category']): LogEntry[];
    getLogsByLevel(level: LogEntry['level']): LogEntry[];
}
export declare const logManager: LogManager;
export {};
//# sourceMappingURL=logManager.d.ts.map