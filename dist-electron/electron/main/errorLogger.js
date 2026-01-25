import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
export class ErrorLogger {
    static logPath = null;
    static logStream = null;
    static initialize() {
        try {
            const userDataPath = app.getPath('userData');
            this.logPath = path.join(userDataPath, 'error.log');
            // Ensure the directory exists
            if (!fs.existsSync(userDataPath)) {
                fs.mkdirSync(userDataPath, { recursive: true });
            }
            console.log('[ErrorLogger] Initialized at:', this.logPath);
            // Write initial log entry
            this.log('info', '='.repeat(80));
            this.log('info', `Sambad Error Log Initialized - ${new Date().toISOString()}`);
            this.log('info', `Platform: ${process.platform} | Arch: ${process.arch} | Node: ${process.version}`);
            this.log('info', `App Version: ${app.getVersion()} | Packaged: ${app.isPackaged}`);
            this.log('info', `User Data Path: ${userDataPath}`);
            this.log('info', '='.repeat(80));
        }
        catch (error) {
            console.error('[ErrorLogger] Failed to initialize:', error);
        }
    }
    static log(level, message, data) {
        if (!this.logPath) {
            console.warn('[ErrorLogger] Not initialized, cannot write log');
            return;
        }
        try {
            const timestamp = new Date().toISOString();
            const levelStr = level.toUpperCase().padEnd(5);
            let logEntry = `[${timestamp}] [${levelStr}] ${message}`;
            if (data) {
                if (typeof data === 'object') {
                    logEntry += `\n${JSON.stringify(data, null, 2)}`;
                }
                else {
                    logEntry += `\n${data}`;
                }
            }
            logEntry += '\n';
            // Append to file synchronously to ensure log is written even if app crashes
            fs.appendFileSync(this.logPath, logEntry, 'utf8');
            // Also log to console
            const consoleMethod = level === 'error' ? console.error :
                level === 'warn' ? console.warn :
                    level === 'debug' ? console.debug :
                        console.log;
            consoleMethod(`[ErrorLogger] ${message}`, data || '');
        }
        catch (error) {
            console.error('[ErrorLogger] Failed to write log:', error);
        }
    }
    static error(message, error) {
        const errorData = {};
        if (error) {
            errorData.message = error.message || String(error);
            if (error.stack) {
                errorData.stack = error.stack;
            }
            if (error.code) {
                errorData.code = error.code;
            }
        }
        this.log('error', message, Object.keys(errorData).length > 0 ? errorData : undefined);
    }
    static info(message, data) {
        this.log('info', message, data);
    }
    static warn(message, data) {
        this.log('warn', message, data);
    }
    static debug(message, data) {
        this.log('debug', message, data);
    }
    static getLogPath() {
        return this.logPath;
    }
    static async getLogContents(maxLines = 500) {
        if (!this.logPath || !fs.existsSync(this.logPath)) {
            return 'No log file found';
        }
        try {
            const content = fs.readFileSync(this.logPath, 'utf8');
            const lines = content.split('\n');
            // Return last N lines
            if (lines.length > maxLines) {
                return '... (log truncated) ...\n\n' + lines.slice(-maxLines).join('\n');
            }
            return content;
        }
        catch (error) {
            return `Error reading log file: ${error}`;
        }
    }
    static clearLog() {
        if (!this.logPath)
            return;
        try {
            fs.writeFileSync(this.logPath, '');
            this.log('info', '='.repeat(80));
            this.log('info', `Log cleared - ${new Date().toISOString()}`);
            this.log('info', '='.repeat(80));
        }
        catch (error) {
            console.error('[ErrorLogger] Failed to clear log:', error);
        }
    }
    static close() {
        if (this.logStream) {
            this.logStream.end();
            this.logStream = null;
        }
    }
}
//# sourceMappingURL=errorLogger.js.map