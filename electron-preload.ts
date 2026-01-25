import { contextBridge, ipcRenderer } from 'electron';

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
  electron: string;
  chrome: string;
  node: string;
};

const electronAPI = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:getInfo'),
  getPath: (name: string): Promise<string> => ipcRenderer.invoke('app:getPath', name),
  quit: (): void => ipcRenderer.send('app:quit'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
