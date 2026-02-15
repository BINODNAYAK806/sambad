/**
 * Type definitions for the campaign execution system
 */

export interface CampaignTask {
    campaignId: number;
    messages: CampaignMessage[];
    delaySettings: DelaySettings;
    sendingStrategy?: 'single' | 'rotational';
    sending_strategy?: 'single' | 'rotational';
    serverId?: number;
    server_id?: number;
    isPoll?: boolean;
    pollQuestion?: string;
    pollOptions?: string[];
}

export interface CampaignMessage {
    recipientNumber: string;
    recipientName?: string;
    templateText: string;
    variables?: Record<string, string>;
    mediaAttachments?: MediaAttachment[];
    templateImage?: {
        path: string;
        name: string;
    };
}

export interface MediaAttachment {
    path: string;
    type: 'image' | 'video' | 'document';
    filename: string;
}

export interface DelaySettings {
    preset: 'very-short' | 'short' | 'medium' | 'long' | 'very-long' | 'manual';
    minDelay?: number;
    maxDelay?: number;
}

export interface ExecutionResult {
    success: boolean;
    sentCount: number;
    failedCount: number;
    errors: ExecutionError[];
}

export interface SendResult {
    success: boolean;
    error?: string;
    serverId: number;
    timestamp: Date;
}

export interface ExecutionError {
    messageIndex: number;
    recipientNumber: string;
    error: string;
    serverId: number;
}

export interface ServerRotationState {
    currentIndex: number;
    totalMessages: number;
    messagesSentPerServer: Record<number, number>;
}

export interface HealthStatus {
    serverId: number;
    isReady: boolean;
    lastChecked: Date;
    error?: string;
}

export type SendingStrategy = 'single' | 'rotational';
