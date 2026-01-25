import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log('[Sambad] Creating main window');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Sambad',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('[Sambad] Main window shown');
  });

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
    console.log('[Sambad] Running in development mode');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    console.log('[Sambad] Running in production mode');
  }

  mainWindow.on('closed', () => {
    console.log('[Sambad] Main window closed');
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  ipcMain.handle('app:getInfo', async () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      v8: process.versions.v8,
    };
  });

  ipcMain.handle('app:getPath', async (_event, name: string) => {
    return app.getPath(name as any);
  });

  ipcMain.handle('app:quit', async () => {
    app.quit();
  });

  ipcMain.handle('db:query', async (_event, sql: string, params?: any[]) => {
    console.log('[Sambad] DB Query (stub):', sql, params);
    return { success: true, data: [], message: 'Query executed (stub)' };
  });

  ipcMain.handle('db:insert', async (_event, table: string, data: any) => {
    console.log('[Sambad] DB Insert (stub):', table, data);
    return { success: true, id: Date.now(), message: 'Record inserted (stub)' };
  });

  ipcMain.handle('db:update', async (_event, table: string, id: any, data: any) => {
    console.log('[Sambad] DB Update (stub):', table, id, data);
    return { success: true, message: 'Record updated (stub)' };
  });

  ipcMain.handle('db:delete', async (_event, table: string, id: any) => {
    console.log('[Sambad] DB Delete (stub):', table, id);
    return { success: true, message: 'Record deleted (stub)' };
  });

  ipcMain.handle('contacts:list', async () => {
    console.log('[Sambad] Contacts List (stub)');
    return { success: true, data: [] };
  });

  ipcMain.handle('contacts:create', async (_event, contact: any) => {
    console.log('[Sambad] Create Contact (stub):', contact);
    return { success: true, id: Date.now(), message: 'Contact created (stub)' };
  });

  ipcMain.handle('contacts:update', async (_event, id: number, contact: any) => {
    console.log('[Sambad] Update Contact (stub):', id, contact);
    return { success: true, message: 'Contact updated (stub)' };
  });

  ipcMain.handle('contacts:delete', async (_event, id: number) => {
    console.log('[Sambad] Delete Contact (stub):', id);
    return { success: true, message: 'Contact deleted (stub)' };
  });

  ipcMain.handle('campaigns:list', async () => {
    console.log('[Sambad] Campaigns List (stub)');
    return { success: true, data: [] };
  });

  ipcMain.handle('campaigns:create', async (_event, campaign: any) => {
    console.log('[Sambad] Create Campaign (stub):', campaign);
    return { success: true, id: Date.now(), message: 'Campaign created (stub)' };
  });

  ipcMain.handle('campaigns:update', async (_event, id: number, campaign: any) => {
    console.log('[Sambad] Update Campaign (stub):', id, campaign);
    return { success: true, message: 'Campaign updated (stub)' };
  });

  ipcMain.handle('campaigns:delete', async (_event, id: number) => {
    console.log('[Sambad] Delete Campaign (stub):', id);
    return { success: true, message: 'Campaign deleted (stub)' };
  });

  ipcMain.handle('campaigns:start', async (_event, id: number) => {
    console.log('[Sambad] Start Campaign (stub):', id);
    return { success: true, message: 'Campaign started (stub)' };
  });

  ipcMain.handle('campaigns:stop', async (_event, id: number) => {
    console.log('[Sambad] Stop Campaign (stub):', id);
    return { success: true, message: 'Campaign stopped (stub)' };
  });

  ipcMain.handle('campaign:start', async (_event, campaign: any) => {
    console.log('[Sambad] Campaign Worker Start (stub):', campaign);
    return { success: true, message: 'Campaign worker started (stub)' };
  });

  ipcMain.handle('campaign:pause', async () => {
    console.log('[Sambad] Campaign Worker Pause (stub)');
    return { success: true, message: 'Campaign paused (stub)' };
  });

  ipcMain.handle('campaign:resume', async () => {
    console.log('[Sambad] Campaign Worker Resume (stub)');
    return { success: true, message: 'Campaign resumed (stub)' };
  });

  ipcMain.handle('campaign:stop', async () => {
    console.log('[Sambad] Campaign Worker Stop (stub)');
    return { success: true, message: 'Campaign stopped (stub)' };
  });

  ipcMain.handle('campaign:status', async () => {
    console.log('[Sambad] Campaign Worker Status (stub)');
    return { success: true, status: { exists: false, ready: false } };
  });

  ipcMain.handle('console:open', async () => {
    console.log('[Sambad] Console Open (stub)');
    return { success: true };
  });

  ipcMain.handle('console:close', async () => {
    console.log('[Sambad] Console Close (stub)');
    return { success: true };
  });

  ipcMain.handle('console:toggle', async () => {
    console.log('[Sambad] Console Toggle (stub)');
    return { success: true };
  });

  ipcMain.handle('console:getLogs', async () => {
    console.log('[Sambad] Get Console Logs (stub)');
    return { success: true, logs: [] };
  });

  ipcMain.handle('console:clearLogs', async () => {
    console.log('[Sambad] Clear Console Logs (stub)');
    return { success: true };
  });

  console.log('[Sambad] IPC handlers registered');
}
