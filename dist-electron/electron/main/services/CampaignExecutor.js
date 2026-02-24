/**
 * CampaignExecutor
 *
 * Orchestrates campaign message sending with rotation strategies.
 * Handles message execution, error recovery, and progress tracking.
 */
import { ServerRotationManager } from './ServerRotationManager.js';
import { ServerHealthMonitor } from './ServerHealthMonitor.js';
import * as path from 'path';
import { createPollResult, createCampaignMessage } from '../db/index.js';
export class CampaignExecutor {
    whatsAppClient;
    mainWindow;
    rotationManager;
    healthMonitor;
    isPaused = false;
    shouldStop = false;
    sentCount = 0;
    failedCount = 0;
    errors = [];
    pollResultCreated = false;
    constructor(whatsAppClient, mainWindow) {
        this.whatsAppClient = whatsAppClient;
        this.mainWindow = mainWindow;
        this.rotationManager = new ServerRotationManager();
        this.healthMonitor = new ServerHealthMonitor(whatsAppClient);
    }
    /**
     * Execute a campaign with the specified strategy
     * @param campaignTask - Campaign task with messages and settings
     * @param strategy - 'single' or 'rotational'
     * @param designatedServerId - Server ID for single strategy
     * @returns Execution result with statistics
     */
    async execute(campaignTask, strategy, designatedServerId = 1) {
        console.log(`[CampaignExecutor] 🚀 Starting execution - Strategy: ${strategy}, Designated Server: ${designatedServerId}`);
        console.log(`[CampaignExecutor] Total messages: ${campaignTask.messages.length}`);
        // Reset state
        this.reset();
        this.pollResultCreated = false;
        const totalMessages = campaignTask.messages.length;
        try {
            for (let i = 0; i < totalMessages; i++) {
                // Check for stop signal
                if (this.shouldStop) {
                    console.log('[CampaignExecutor] ⏹️ Stopped by user');
                    break;
                }
                // Wait while paused
                while (this.isPaused && !this.shouldStop) {
                    console.log('[CampaignExecutor] ⏸️ Paused, waiting...');
                    await this.delay(2000);
                }
                if (this.shouldStop)
                    break;
                // Select server based on strategy
                const serverId = await this.selectServer(strategy, designatedServerId, i);
                // Send message
                const message = campaignTask.messages[i];
                const result = await this.sendMessage(message, serverId, campaignTask);
                // Track result
                if (result.success) {
                    this.sentCount++;
                    console.log(`[CampaignExecutor] ✅ Sent ${this.sentCount}/${totalMessages} via Server ${serverId}`);
                }
                else {
                    this.failedCount++;
                    this.errors.push({
                        messageIndex: i,
                        recipientNumber: message.recipientNumber,
                        error: result.error || 'Unknown error',
                        serverId
                    });
                    console.log(`[CampaignExecutor] ❌ Failed ${this.failedCount}/${totalMessages} via Server ${serverId}: ${result.error}`);
                }
                // Send progress update
                this.sendProgressUpdate(i + 1, totalMessages, message, campaignTask.campaignId);
                // Apply delay before next message (except for last message)
                if (i < totalMessages - 1) {
                    await this.applyDelay(campaignTask.delaySettings);
                }
            }
            // Log final statistics
            this.rotationManager.logDistribution();
            return {
                success: true,
                sentCount: this.sentCount,
                failedCount: this.failedCount,
                errors: this.errors
            };
        }
        catch (error) {
            console.error('[CampaignExecutor] Fatal error:', error);
            return {
                success: false,
                sentCount: this.sentCount,
                failedCount: this.failedCount,
                errors: [...this.errors, {
                        messageIndex: -1,
                        recipientNumber: 'N/A',
                        error: error.message || 'Fatal execution error',
                        serverId: -1
                    }]
            };
        }
    }
    /**
     * Select the appropriate server based on strategy
     */
    async selectServer(strategy, designatedServerId, messageIndex) {
        if (strategy === 'single') {
            // Single server strategy - wait for the designated server
            const serverId = this.rotationManager.getSingleServer(designatedServerId);
            console.log(`[CampaignExecutor] 📍 Single Mode: Message ${messageIndex + 1} → Server ${serverId}`);
            // Wait for server to be ready
            while (!this.healthMonitor.isServerReady(serverId) && !this.shouldStop) {
                console.log(`[CampaignExecutor] ⏳ Waiting for Server ${serverId} to reconnect...`);
                await this.delay(2000);
            }
            return serverId;
        }
        else {
            // Rotational strategy
            const availableServers = this.healthMonitor.getAvailableServers();
            if (availableServers.length === 0) {
                console.log('[CampaignExecutor] ⚠️ No servers available, waiting...');
                const serverId = await this.healthMonitor.waitForAnyServer(60000);
                return this.rotationManager.getNextServer([serverId], messageIndex);
            }
            const serverId = this.rotationManager.getNextServer(availableServers, messageIndex);
            console.log(`[CampaignExecutor] 🔄 Rotational: Message ${messageIndex + 1} → Server ${serverId} (Available: ${availableServers.join(', ')})`);
            return serverId;
        }
    }
    /**
     * Send a single message via the specified server
     */
    async sendMessage(message, serverId, campaignTask) {
        try {
            // Format phone number
            let number = message.recipientNumber?.replace(/\D/g, '') || '';
            if (number.length < 10) {
                throw new Error('Invalid phone number');
            }
            // Validate number exists on WhatsApp
            const numberId = await this.whatsAppClient.getNumberId(serverId, number);
            if (!numberId) {
                throw new Error('Number not on WhatsApp');
            }
            const chatId = numberId._serialized;
            // Prepare message content
            const content = this.personalizeMessage(message.templateText, message.variables || {}, message.recipientName || '');
            console.log(`[CampaignExecutor] 📝 Final Personalized Content (Length: ${content.length}): "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
            // Track if content (caption/text) has been sent
            let contentSent = false;
            // 1. Send Poll (Exclusive)
            if (campaignTask.isPoll && campaignTask.pollQuestion && campaignTask.pollOptions) {
                const pollMessage = await this.whatsAppClient.sendPoll(serverId, chatId, campaignTask.pollQuestion, campaignTask.pollOptions);
                if (pollMessage && pollMessage.key && pollMessage.key.id) {
                    // Create campaign message record for each recipient
                    const campaignIdNum = parseInt(campaignTask.campaignId.toString());
                    if (!isNaN(campaignIdNum)) {
                        createCampaignMessage(campaignIdNum, pollMessage.key.id, message.recipientNumber || '', message.recipientName, campaignTask.pollQuestion, 'sent', serverId);
                        // Create poll result ONCE per campaign (not per message)
                        if (!this.pollResultCreated) {
                            createPollResult(campaignIdNum, pollMessage.key.id, campaignTask.pollQuestion, campaignTask.pollOptions);
                            this.pollResultCreated = true;
                            console.log(`[CampaignExecutor] 📊 Created poll result for campaign ${campaignIdNum}`);
                        }
                    }
                }
                contentSent = true;
                return { success: true, serverId, timestamp: new Date() };
            }
            else {
                // 2. Send Template Image
                if (message.templateImage && (message.templateImage.path || message.templateImage.url)) {
                    const filePath = message.templateImage.path || message.templateImage.url;
                    console.log(`[CampaignExecutor] 🖼️ Sending Template Image: ${filePath}`);
                    try {
                        const mediaObj = this.whatsAppClient.getMessageMedia().fromFilePath(filePath, 'image');
                        await this.whatsAppClient.sendMessage(serverId, chatId, mediaObj, { caption: content });
                        console.log(`[CampaignExecutor] ✅ Template Image Sent`);
                        contentSent = true;
                    }
                    catch (err) {
                        console.error(`[CampaignExecutor] ❌ Failed to send template image: ${err}`);
                    }
                }
                // 3. Send Media Attachments
                if (message.mediaAttachments && message.mediaAttachments.length > 0) {
                    console.log(`[CampaignExecutor] 📂 Sending ${message.mediaAttachments.length} Attachments to ${chatId}`);
                    for (let idx = 0; idx < message.mediaAttachments.length; idx++) {
                        const media = message.mediaAttachments[idx];
                        const filePath = media.path || media.url;
                        if (filePath) {
                            console.log(`[CampaignExecutor] 📄 Processing Attachment ${idx + 1}/${message.mediaAttachments.length}: ${filePath} (Type: ${media.type})`);
                            try {
                                const mediaObj = this.whatsAppClient.getMessageMedia().fromFilePath(filePath, media.type);
                                // Use media's own caption if available, otherwise fallback to main content if not yet sent
                                const captionToUse = media.caption || (!contentSent ? content : undefined);
                                const options = captionToUse ? { caption: captionToUse } : undefined;
                                if (options?.caption) {
                                    console.log(`[CampaignExecutor] 🏷️ Using caption for attachment: \"${options.caption.substring(0, 30)}...\"`);
                                }
                                await this.whatsAppClient.sendMessage(serverId, chatId, mediaObj, options);
                                console.log(`[CampaignExecutor] ✅ Attachment Sent: ${path.basename(filePath)}`);
                                if (!contentSent)
                                    contentSent = true;
                            }
                            catch (err) {
                                console.error(`[CampaignExecutor] ❌ Failed to send attachment ${filePath}: ${err}`);
                            }
                        }
                        else {
                            console.warn(`[CampaignExecutor] ⚠️ Attachment skipped: No path or url found`, media);
                        }
                    }
                }
                // 4. Send Text Fallback
                // If no media was sent (or failed) and no poll, send the text/caption itself
                if (!contentSent) {
                    await this.whatsAppClient.sendMessage(serverId, chatId, content);
                }
            }
            return {
                success: true,
                serverId,
                timestamp: new Date()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Unknown error',
                serverId,
                timestamp: new Date()
            };
        }
    }
    /**
     * Personalize message with variable substitution
     */
    personalizeMessage(template, variables, recipientName) {
        let result = template;
        // Replace {{name}} with recipient name
        result = result.replace(/\{\{name\}\}/gi, recipientName || '');
        // Replace v1-v10 variables (ensure empty values become blank)
        for (let i = 1; i <= 10; i++) {
            const key = `v${i}`;
            const value = variables[key] || ''; // Use empty string if not provided
            const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
            result = result.replace(pattern, value);
        }
        // Replace any other custom variables that might exist
        Object.keys(variables).forEach(key => {
            // Skip v1-v10 as already processed above
            if (!key.match(/^v\d+$/)) {
                const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
                result = result.replace(pattern, variables[key] || '');
            }
        });
        return result;
    }
    /**
     * Apply delay between messages
     */
    async applyDelay(settings) {
        console.log('[CampaignExecutor] 🔍 Processing Delay Settings:', JSON.stringify(settings, null, 2));
        let delayMs;
        const presets = {
            'very-short': { min: 1, max: 5 },
            'short': { min: 5, max: 20 },
            'medium': { min: 20, max: 50 },
            'long': { min: 50, max: 120 },
            'very-long': { min: 120, max: 300 },
            'manual': { min: 20, max: 50 } // Default for manual if not provided
        };
        if (settings.minDelay !== undefined && settings.maxDelay !== undefined &&
            settings.minDelay !== null && settings.maxDelay !== null) {
            // Use custom range (provided in seconds, convert to ms)
            const min = settings.minDelay * 1000;
            const max = settings.maxDelay * 1000;
            delayMs = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        else {
            // Use preset range (defined in seconds, convert to ms)
            const preset = presets[settings.preset] || presets.medium;
            const min = preset.min * 1000;
            const max = preset.max * 1000;
            delayMs = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        if (delayMs > 0) {
            console.log(`[CampaignExecutor] ⏱️ Resolved Delay: ${(delayMs / 1000).toFixed(1)}s (Range: ${settings.minDelay || 'preset'}-${settings.maxDelay || 'preset'})`);
            await this.delay(delayMs);
            console.log(`[CampaignExecutor] ✅ Delay finished, proceeding to next message`);
        }
    }
    /**
     * Send progress update to frontend
     */
    sendProgressUpdate(current, total, message, campaignId) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            const progress = Math.round((current / total) * 100);
            this.mainWindow.webContents.send('campaign:progress', {
                campaignId,
                progress,
                sentCount: this.sentCount,
                failedCount: this.failedCount,
                totalMessages: total,
                recipientNumber: message.recipientNumber,
                recipientName: message.recipientName
            });
        }
    }
    /**
     * Pause execution
     */
    pause() {
        this.isPaused = true;
        console.log('[CampaignExecutor] ⏸️ Paused');
    }
    /**
     * Resume execution
     */
    resume() {
        this.isPaused = false;
        console.log('[CampaignExecutor] ▶️ Resumed');
    }
    /**
     * Stop execution
     */
    stop() {
        this.shouldStop = true;
        console.log('[CampaignExecutor] ⏹️ Stopped');
    }
    /**
     * Reset execution state
     */
    reset() {
        this.isPaused = false;
        this.shouldStop = false;
        this.sentCount = 0;
        this.failedCount = 0;
        this.errors = [];
        this.rotationManager.reset();
    }
    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=CampaignExecutor.js.map