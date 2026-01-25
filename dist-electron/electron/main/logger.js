import path from 'path';
import fs from 'fs';
import { app } from 'electron';
export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    logPath;
    constructor() {
        // Write logs to user data directory
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) {
            try {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            catch (err) {
                // Fallback or ignore if fails during construction
            }
        }
        this.logPath = path.join(logsDir, 'main.log');
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
    }
    write(level, message, meta) {
        const logLine = this.formatMessage(level, message, meta);
        // Console output for development
        if (level === LogLevel.ERROR) {
            console.error(logLine);
        }
        else {
            console.log(logLine);
        }
        // Persist to file
        try {
            fs.appendFileSync(this.logPath, logLine);
        }
        catch (err) {
            // Failed to write to log file
        }
    }
    info(message, meta) {
        this.write(LogLevel.INFO, message, meta);
    }
    warn(message, meta) {
        this.write(LogLevel.WARN, message, meta);
    }
    error(message, meta) {
        this.write(LogLevel.ERROR, message, meta);
    }
    debug(message, meta) {
        if (!app.isPackaged) {
            this.write(LogLevel.DEBUG, message, meta);
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map