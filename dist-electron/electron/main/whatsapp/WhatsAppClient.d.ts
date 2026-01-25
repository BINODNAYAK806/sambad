/**
 * WhatsAppClient - Baileys Integration
 *
 * Uses @whiskeysockets/baileys - a native WhatsApp protocol implementation
 * More stable than Puppeteer-based solutions, actively maintained
 */
import { BrowserWindow } from 'electron';
export type WhatsAppState = 'idle' | 'initializing' | 'qr' | 'authenticated' | 'ready' | 'disconnected' | 'error';
export interface WhatsAppStatus {
    state: WhatsAppState;
    isReady: boolean;
    error?: string;
    phoneNumber?: string;
}
declare class WhatsAppClientSingleton {
    private static instance;
    private sock;
    private mainWindow;
    private state;
    private lastError;
    private userDataPath;
    private phoneNumber;
    private authState;
    private saveCreds;
    private contacts;
    private storeFile;
    private isDirty;
    private constructor();
    private loadStore;
    private saveStore;
    static getInstance(): WhatsAppClientSingleton;
    setMainWindow(window: BrowserWindow): void;
    getStatus(): WhatsAppStatus;
    private log;
    initialize(): Promise<void>;
    private setupEventListeners;
    disconnect(): Promise<void>;
    logout(): Promise<void>;
    sendMessage(chatId: string, content: string | any, options?: any): Promise<any>;
    getNumberId(number: string): Promise<any>;
    getMessageMedia(): any;
    private formatJid;
    getAllContacts(): Promise<any[]>;
    getAllGroups(): Promise<any[]>;
    getGroupParticipantsDetailed(groupJid: string): Promise<any[]>;
    private sendToRenderer;
}
export declare const whatsAppClient: WhatsAppClientSingleton;
export {};
//# sourceMappingURL=WhatsAppClient.d.ts.map