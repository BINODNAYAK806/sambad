/**
 * NEW Production-Grade Campaign Execution
 *
 * This file contains the refactored campaign execution logic using
 * the service layer architecture (CampaignExecutor, ServerRotationManager, ServerHealthMonitor)
 */
import type { BrowserWindow } from 'electron';
import { WhatsAppClientSingleton } from './whatsapp/WhatsAppClient.js';
/**
 * Execute a campaign using the new service-based architecture
 */
export declare function executeCampaignWithServices(campaignTask: any, whatsAppClient: WhatsAppClientSingleton, mainWindow: BrowserWindow | null): Promise<void>;
/**
 * Pause the currently running campaign
 */
export declare function pauseCurrentCampaign(): void;
/**
 * Resume the currently paused campaign
 */
export declare function resumeCurrentCampaign(): void;
/**
 * Stop the currently running campaign
 */
export declare function stopCurrentCampaign(): void;
//# sourceMappingURL=campaignExecutionService.d.ts.map