/**
 * CampaignExecutor
 *
 * Orchestrates campaign message sending with rotation strategies.
 * Handles message execution, error recovery, and progress tracking.
 */
import { WhatsAppClientSingleton } from '../whatsapp/WhatsAppClient.js';
import type { CampaignTask, ExecutionResult, SendingStrategy } from '../types/campaign.js';
import type { BrowserWindow } from 'electron';
export declare class CampaignExecutor {
    private whatsAppClient;
    private mainWindow;
    private rotationManager;
    private healthMonitor;
    private isPaused;
    private shouldStop;
    private sentCount;
    private failedCount;
    private errors;
    private pollResultCreated;
    constructor(whatsAppClient: WhatsAppClientSingleton, mainWindow: BrowserWindow | null);
    /**
     * Execute a campaign with the specified strategy
     * @param campaignTask - Campaign task with messages and settings
     * @param strategy - 'single' or 'rotational'
     * @param designatedServerId - Server ID for single strategy
     * @returns Execution result with statistics
     */
    execute(campaignTask: CampaignTask, strategy: SendingStrategy, designatedServerId?: number): Promise<ExecutionResult>;
    /**
     * Select the appropriate server based on strategy
     */
    private selectServer;
    /**
     * Send a single message via the specified server
     */
    private sendMessage;
    /**
     * Personalize message with variable substitution
     */
    private personalizeMessage;
    /**
     * Apply delay between messages
     */
    private applyDelay;
    /**
     * Send progress update to frontend
     */
    private sendProgressUpdate;
    /**
     * Pause execution
     */
    pause(): void;
    /**
     * Resume execution
     */
    resume(): void;
    /**
     * Stop execution
     */
    stop(): void;
    /**
     * Reset execution state
     */
    private reset;
    /**
     * Helper delay function
     */
    private delay;
}
//# sourceMappingURL=CampaignExecutor.d.ts.map