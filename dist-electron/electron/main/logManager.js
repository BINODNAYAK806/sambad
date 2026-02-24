class LogManager {
    logs = [];
    maxLogs = 1000;
    consoleWindow = null;
    setConsoleWindow(window) {
        this.consoleWindow = window;
    }
    log(level, category, message, data) {
        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
            level,
            category,
            message,
            data,
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${category.toUpperCase()}] ${message}`, data || '');
        if (this.consoleWindow && !this.consoleWindow.isDestroyed()) {
            this.consoleWindow.webContents.send('console:newLog', entry);
        }
    }
    info(category, message, data) {
        this.log('info', category, message, data);
    }
    warn(category, message, data) {
        this.log('warn', category, message, data);
    }
    error(category, message, data) {
        this.log('error', category, message, data);
    }
    debug(category, message, data) {
        this.log('debug', category, message, data);
    }
    getLogs() {
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
        if (this.consoleWindow && !this.consoleWindow.isDestroyed()) {
            this.consoleWindow.webContents.send('console:logsCleared');
        }
    }
    getLogsByCategory(category) {
        return this.logs.filter((log) => log.category === category);
    }
    getLogsByLevel(level) {
        return this.logs.filter((log) => log.level === level);
    }
}
export const logManager = new LogManager();
//# sourceMappingURL=logManager.js.map