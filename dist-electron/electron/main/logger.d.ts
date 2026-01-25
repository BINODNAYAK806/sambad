export declare enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    DEBUG = "DEBUG"
}
declare class Logger {
    private logPath;
    constructor();
    private formatMessage;
    private write;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map