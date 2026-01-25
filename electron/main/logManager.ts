import { BrowserWindow } from 'electron';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
  message: string;
  data?: any;
}

class LogManager {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private consoleWindow: BrowserWindow | null = null;

  setConsoleWindow(window: BrowserWindow | null): void {
    this.consoleWindow = window;
  }

  log(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any): void {
    const entry: LogEntry = {
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

    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `[${category.toUpperCase()}] ${message}`,
      data || ''
    );

    if (this.consoleWindow && !this.consoleWindow.isDestroyed()) {
      this.consoleWindow.webContents.send('console:newLog', entry);
    }
  }

  info(category: LogEntry['category'], message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  warn(category: LogEntry['category'], message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  error(category: LogEntry['category'], message: string, data?: any): void {
    this.log('error', category, message, data);
  }

  debug(category: LogEntry['category'], message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    if (this.consoleWindow && !this.consoleWindow.isDestroyed()) {
      this.consoleWindow.webContents.send('console:logsCleared');
    }
  }

  getLogsByCategory(category: LogEntry['category']): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }
}

export const logManager = new LogManager();
