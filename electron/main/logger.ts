import path from 'path';
import fs from 'fs';
// Robust Electron import for CommonJS
const { app } = require('electron');

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

class Logger {
    private _logPath: string | null = null;

    constructor() {
        // Initialization moved to getLogPath() for lazy loading
    }

    private getLogPath(): string {
        if (this._logPath) return this._logPath;

        try {
            const userDataPath = app.getPath('userData');
            const logsDir = path.join(userDataPath, 'logs');
            
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            
            this._logPath = path.join(logsDir, 'main.log');
            return this._logPath;
        } catch (err) {
            // Backup fallback if app is not ready
            return path.join(process.cwd(), 'main.log');
        }
    }

    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
    }

    private write(level: LogLevel, message: string, meta?: any) {
        const logLine = this.formatMessage(level, message, meta);

        // Console output for development
        if (level === LogLevel.ERROR) {
            console.error(logLine);
        } else {
            console.log(logLine);
        }

        // Persist to file
        try {
            fs.appendFileSync(this.getLogPath(), logLine);
        } catch (err) {
            // Failed to write to log file
        }
    }

    info(message: string, meta?: any) {
        this.write(LogLevel.INFO, message, meta);
    }

    warn(message: string, meta?: any) {
        this.write(LogLevel.WARN, message, meta);
    }

    error(message: string, meta?: any) {
        this.write(LogLevel.ERROR, message, meta);
    }

    debug(message: string, meta?: any) {
        try {
            if (app && !app.isPackaged) {
                this.write(LogLevel.DEBUG, message, meta);
            }
        } catch (err) {
            // If app is not ready, we can still log debug to console in dev
            if (process.env.NODE_ENV === 'development') {
                this.write(LogLevel.DEBUG, message, meta);
            }
        }
    }
}

export const logger = new Logger();
