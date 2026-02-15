/**
 * NEW Production-Grade Campaign Execution
 * 
 * This file contains the refactored campaign execution logic using
 * the service layer architecture (CampaignExecutor, ServerRotationManager, ServerHealthMonitor)
 */

import type { BrowserWindow } from 'electron';
import { WhatsAppClientSingleton } from './whatsapp/WhatsAppClient.js';
import { CampaignExecutor } from './services/CampaignExecutor.js';
import * as db from './db/index.js';

let currentExecutor: CampaignExecutor | null = null;

/**
 * Execute a campaign using the new service-based architecture
 */
export async function executeCampaignWithServices(
    campaignTask: any,
    whatsAppClient: WhatsAppClientSingleton,
    mainWindow: BrowserWindow | null
): Promise<void> {
    const totalMessages = campaignTask.messages?.length || 0;
    console.log(`[Campaign Service] 🚀 Starting execution - Messages: ${totalMessages}`);

    // Send initial started event
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('campaign:started', {
            campaignId: campaignTask.campaignId,
            messageCount: totalMessages
        });
    }

    // Determine strategy
    const strategy = campaignTask.sendingStrategy || campaignTask.sending_strategy || 'single';
    const selectedServerId = campaignTask.serverId || campaignTask.server_id || 1;

    console.log(`[Campaign Service] Strategy: ${strategy}, Server: ${selectedServerId}`);

    // Create campaign run record
    let runId: number | null = null;
    try {
        const campaign = await db.campaigns.getById(campaignTask.campaignId);
        const campaignName = campaign?.name || `Campaign ${campaignTask.campaignId}`;
        runId = db.campaignRuns.create(campaignTask.campaignId, campaignName, totalMessages);
        console.log(`[Campaign Service] Created run record: ${runId}`);
    } catch (runErr: any) {
        console.warn('[Campaign Service] Failed to create run record:', runErr.message);
    }

    // Create executor instance
    const executor = new CampaignExecutor(whatsAppClient, mainWindow);
    currentExecutor = executor;

    try {
        // Update campaign status to running
        db.campaigns.update(campaignTask.campaignId, {
            status: 'running',
            started_at: new Date().toISOString()
        });

        // Execute campaign
        const result = await executor.execute(
            campaignTask,
            strategy as 'single' | 'rotational',
            selectedServerId
        );

        // Update final statistics
        const completedAt = new Date().toISOString();
        db.campaigns.update(campaignTask.campaignId, {
            status: 'completed',
            sent_count: result.sentCount,
            failed_count: result.failedCount,
            completed_at: completedAt
        });

        if (runId) {
            db.campaignRuns.update(runId, result.sentCount, result.failedCount, 'completed');
        }

        // Send completion event
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('campaign:complete', {
                campaignId: campaignTask.campaignId,
                sentCount: result.sentCount,
                failedCount: result.failedCount
            });
        }

        console.log(`[Campaign Service] ✅ Completed: ${result.sentCount} sent, ${result.failedCount} failed`);

    } catch (error: any) {
        console.error('[Campaign Service] ❌ Execution failed:', error);

        db.campaigns.update(campaignTask.campaignId, {
            status: 'failed',
            completed_at: new Date().toISOString()
        });

        if (runId) {
            db.campaignRuns.update(runId, 0, 0, 'failed');
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('campaign:error', {
                campaignId: campaignTask.campaignId,
                error: error.message || 'Unknown error'
            });
        }
    } finally {
        currentExecutor = null;
    }
}

/**
 * Pause the currently running campaign
 */
export function pauseCurrentCampaign(): void {
    if (currentExecutor) {
        currentExecutor.pause();
    }
}

/**
 * Resume the currently paused campaign
 */
export function resumeCurrentCampaign(): void {
    if (currentExecutor) {
        currentExecutor.resume();
    }
}

/**
 * Stop the currently running campaign
 */
export function stopCurrentCampaign(): void {
    if (currentExecutor) {
        currentExecutor.stop();
    }
}
