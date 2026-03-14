"use strict";
/**
 * NEW Production-Grade Campaign Execution
 *
 * This file contains the refactored campaign execution logic using
 * the service layer architecture (CampaignExecutor, ServerRotationManager, ServerHealthMonitor)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCampaignWithServices = executeCampaignWithServices;
exports.pauseCurrentCampaign = pauseCurrentCampaign;
exports.resumeCurrentCampaign = resumeCurrentCampaign;
exports.stopCurrentCampaign = stopCurrentCampaign;
const CampaignExecutor_js_1 = require("./services/CampaignExecutor.js");
const db = __importStar(require("./db/index.js"));
let currentExecutor = null;
/**
 * Execute a campaign using the new service-based architecture
 */
async function executeCampaignWithServices(campaignTask, whatsAppClient, mainWindow) {
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
    let runId = null;
    try {
        const campaign = await db.campaigns.getById(campaignTask.campaignId);
        const campaignName = campaign?.name || `Campaign ${campaignTask.campaignId}`;
        runId = db.campaignRuns.create(campaignTask.campaignId, campaignName, totalMessages);
        console.log(`[Campaign Service] Created run record: ${runId}`);
    }
    catch (runErr) {
        console.warn('[Campaign Service] Failed to create run record:', runErr.message);
    }
    // Create executor instance
    const executor = new CampaignExecutor_js_1.CampaignExecutor(whatsAppClient, mainWindow);
    currentExecutor = executor;
    try {
        // Update campaign status to running
        db.campaigns.update(campaignTask.campaignId, {
            status: 'running',
            started_at: new Date().toISOString()
        });
        // Execute campaign
        const result = await executor.execute(campaignTask, strategy, selectedServerId, runId ? parseInt(runId.toString()) : null);
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
    }
    catch (error) {
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
    }
    finally {
        currentExecutor = null;
    }
}
/**
 * Pause the currently running campaign
 */
function pauseCurrentCampaign() {
    if (currentExecutor) {
        currentExecutor.pause();
    }
}
/**
 * Resume the currently paused campaign
 */
function resumeCurrentCampaign() {
    if (currentExecutor) {
        currentExecutor.resume();
    }
}
/**
 * Stop the currently running campaign
 */
function stopCurrentCampaign() {
    if (currentExecutor) {
        currentExecutor.stop();
    }
}
//# sourceMappingURL=campaignExecutionService.js.map