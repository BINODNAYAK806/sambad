import { BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { logManager } from './logManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let consoleWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

export function createConsoleWindow(): BrowserWindow {
  if (consoleWindow && !consoleWindow.isDestroyed()) {
    consoleWindow.focus();
    return consoleWindow;
  }

  logManager.info('system', 'Creating console window');

  consoleWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    title: 'Sambad Console',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  consoleWindow.once('ready-to-show', () => {
    consoleWindow?.show();
    logManager.info('browser', 'Console window shown');
  });

  if (isDev) {
    consoleWindow.loadURL(`${VITE_DEV_SERVER_URL}/console.html`);
  } else {
    consoleWindow.loadFile(path.join(__dirname, '../../renderer/console.html'));
  }

  consoleWindow.on('closed', () => {
    logManager.info('browser', 'Console window closed');
    consoleWindow = null;
    logManager.setConsoleWindow(null);
  });

  logManager.setConsoleWindow(consoleWindow);

  return consoleWindow;
}

export function getConsoleWindow(): BrowserWindow | null {
  return consoleWindow;
}

export function closeConsoleWindow(): void {
  if (consoleWindow && !consoleWindow.isDestroyed()) {
    logManager.info('browser', 'Closing console window');
    consoleWindow.close();
  }
}

export function toggleConsoleWindow(): void {
  if (consoleWindow && !consoleWindow.isDestroyed()) {
    if (consoleWindow.isVisible()) {
      consoleWindow.hide();
      logManager.info('browser', 'Console window hidden');
    } else {
      consoleWindow.show();
      consoleWindow.focus();
      logManager.info('browser', 'Console window shown');
    }
  } else {
    createConsoleWindow();
  }
}
