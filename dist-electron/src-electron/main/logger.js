"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Robust Electron import for CommonJS
const { app } = require('electron');
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    _logPath = null;
    constructor() {
        // Initialization moved to getLogPath() for lazy loading
    }
    getLogPath() {
        if (this._logPath)
            return this._logPath;
        try {
            const userDataPath = app.getPath('userData');
            const logsDir = path_1.default.join(userDataPath, 'logs');
            if (!fs_1.default.existsSync(logsDir)) {
                fs_1.default.mkdirSync(logsDir, { recursive: true });
            }
            this._logPath = path_1.default.join(logsDir, 'main.log');
            return this._logPath;
        }
        catch (err) {
            // Backup fallback if app is not ready
            return path_1.default.join(process.cwd(), 'main.log');
        }
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
            fs_1.default.appendFileSync(this.getLogPath(), logLine);
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
        try {
            if (app && !app.isPackaged) {
                this.write(LogLevel.DEBUG, message, meta);
            }
        }
        catch (err) {
            // If app is not ready, we can still log debug to console in dev
            if (process.env.NODE_ENV === 'development') {
                this.write(LogLevel.DEBUG, message, meta);
            }
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map