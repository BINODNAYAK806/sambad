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
export declare class WhatsAppClientSingleton {
    private static instance;
    private socks;
    private mainWindow;
    private states;
    private lastErrors;
    private userDataPath;
    private phoneNumbers;
    private authStates;
    private saveCredsMap;
    private contactsMap;
    private isDirtyMap;
    private constructor();
    private getStoreFile;
    private loadStore;
    private saveStore;
    static getInstance(): WhatsAppClientSingleton;
    setMainWindow(window: BrowserWindow): void;
    getStatus(serverId?: number): WhatsAppStatus;
    getAllStatuses(): Record<number, WhatsAppStatus>;
    private lastLogTime;
    private log;
    initialize(serverId?: number): Promise<void>;
    private setupEventListeners;
    disconnect(serverId?: number): Promise<void>;
    logout(serverId?: number): Promise<void>;
    sendMessage(serverId: number, chatId: string, content: string | any, options?: any): Promise<any>;
    sendPoll(serverId: number, chatId: string, question: string, options: string[]): Promise<any>;
    getNumberId(serverId: number, number: string): Promise<any>;
    getMessageMedia(): any;
    private formatJid;
    getAllContacts(serverId?: number): Promise<any[]>;
    getAllGroups(serverId?: number): Promise<any[]>;
    getGroupParticipantsDetailed(serverId: number, groupJid: string): Promise<any[]>;
    private sendToRenderer;
}
export declare const whatsAppClient: WhatsAppClientSingleton;
//# sourceMappingURL=WhatsAppClient.d.ts.map