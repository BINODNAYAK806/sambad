import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

class Logger {
    private logPath: string;

    constructor() {
        // Write logs to user data directory
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) {
            try {
                fs.mkdirSync(logsDir, { recursive: true });
            } catch (err) {
                // Fallback or ignore if fails during construction
            }
        }
        this.logPath = path.join(logsDir, 'main.log');
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
            fs.appendFileSync(this.logPath, logLine);
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
        if (!app.isPackaged) {
            this.write(LogLevel.DEBUG, message, meta);
        }
    }
}

export const logger = new Logger();
