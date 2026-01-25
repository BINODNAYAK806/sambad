export declare class ErrorLogger {
    private static logPath;
    private static logStream;
    static initialize(): void;
    static log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void;
    static error(message: string, error?: Error | any): void;
    static info(message: string, data?: any): void;
    static warn(message: string, data?: any): void;
    static debug(message: string, data?: any): void;
    static getLogPath(): string | null;
    static getLogContents(maxLines?: number): Promise<string>;
    static clearLog(): void;
    static close(): void;
}
//# sourceMappingURL=errorLogger.d.ts.map