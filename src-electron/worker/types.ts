import type { DelayPreset } from './delayHelper.js';

export interface CampaignTask {
  campaignId: string;
  runId?: number; // Added for tracking history
  messages: MessageTask[];
  delaySettings: {
    preset: DelayPreset;
    minDelay?: number;
    maxDelay?: number;
  };
}

export interface MessageTask {
  id: string;
  recipientNumber: string;
  recipientName?: string;
  templateText: string;
  variables?: Record<string, string>;
  mediaAttachments?: MediaAttachment[];
  templateImage?: {
    url: string;
    type: string;
    filename?: string;
  };
}

export interface MediaAttachment {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
}

export interface WorkerMessage {
  type: 'INITIALIZE' | 'START_CAMPAIGN' | 'PAUSE_CAMPAIGN' | 'RESUME_CAMPAIGN' | 'STOP_CAMPAIGN' | 'DISCONNECT' | 'LOGOUT' | 'HEALTH_CHECK' | 'SOFT_RESTART' | 'SHUTDOWN';
  payload?: CampaignTask | {
    userDataPath: string;
    supabaseUrl?: string;
    supabaseKey?: string;
    accountId?: string;
    licenseKey?: string;
  };
}

export interface WorkerResponse {
  type: 'QR_CODE' | 'READY' | 'PROGRESS' | 'COMPLETE' | 'ERROR' | 'PAUSED' | 'RESUMED' | 'MESSAGE_SENT' | 'MESSAGE_FAILED' | 'HEALTH_RESPONSE';
  data?: {
    qrCode?: string;
    campaignId?: string;
    runId?: number; // Added for tracking history
    messageId?: string;
    recipientNumber?: string;
    recipientName?: string;
    status?: 'sent' | 'failed' | 'ready' | 'initializing' | 'paused' | 'completed' | 'stopped';
    error?: string;
    stack?: string;
    totalMessages?: number;
    sentCount?: number;
    failedCount?: number;
    progress?: number;
  };
}

export interface MessageResult {
  messageId: string;
  recipientNumber: string;
  status: 'sent' | 'failed';
  error?: string;
  sentAt?: Date;
}
