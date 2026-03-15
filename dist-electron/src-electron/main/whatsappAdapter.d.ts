/**
 * WhatsApp Engine Adapter
 *
 * This file provides a safe interface to the WhatsApp engine.
 * The actual WhatsApp Web.js integration runs LOCALLY ONLY.
 *
 * IMPORTANT: This adapter contains STUB implementations.
 * To activate real WhatsApp functionality, follow the guide in:
 * WHATSAPP_ENGINE_IMPLEMENTATION.md
 *
 * Dependencies (for local activation):
 * - whatsapp-web.js
 * - puppeteer
 * - worker_threads
 *
 * Architecture:
 * - Worker thread isolates WhatsApp process
 * - IPC communication between main and worker
 * - Event-driven progress updates
 * - Session persistence for QR-less login
 */
export interface WhatsAppSessionStatus {
    initialized: boolean;
    authenticated: boolean;
    ready: boolean;
    qrCode?: string;
}
export interface CampaignExecutionParams {
    campaignId: string;
    messages: MessageTask[];
    delaySettings: DelaySettings;
}
export interface MessageTask {
    id: string;
    recipientNumber: string;
    recipientName?: string;
    templateText: string;
    variables?: Record<string, string>;
    mediaAttachments?: MediaAttachment[];
}
export interface MediaAttachment {
    id: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'document';
    caption?: string;
    filename?: string;
}
export interface DelaySettings {
    preset: string;
    minDelay?: number;
    maxDelay?: number;
}
export interface CampaignProgress {
    campaignId: string;
    messageId: string;
    recipientNumber: string;
    status: 'sent' | 'failed';
    error?: string;
    timestamp: number;
    totalMessages: number;
    sentCount: number;
    failedCount: number;
    progress: number;
}
export type WhatsAppEventListener = (event: string, data: any) => void;
/**
 * WhatsApp Engine Adapter Class
 *
 * This class provides a clean interface to control the WhatsApp engine.
 * All methods are currently stubbed and will throw informative errors.
 *
 * To activate:
 * 1. Install dependencies: npm install whatsapp-web.js puppeteer
 * 2. Implement worker thread integration
 * 3. Connect event handlers
 * 4. Test with small campaigns first
 */
export declare class WhatsAppAdapter {
    private listeners;
    private sessionStatus;
    /**
     * Initialize WhatsApp session
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Start the worker thread
     * - Initialize whatsapp-web.js client
     * - Load persisted session if available
     * - Emit QR code events if login required
     */
    initSession(): Promise<void>;
    /**
     * Authenticate with WhatsApp
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Display QR code for scanning
     * - Wait for authentication
     * - Persist session for future use
     * - Emit ready event when complete
     */
    login(): Promise<void>;
    /**
     * Logout and clear session
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Logout from WhatsApp Web
     * - Clear persisted session
     * - Stop worker thread
     * - Reset session status
     */
    logout(): Promise<void>;
    /**
     * Start campaign execution
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Validate campaign parameters
     * - Queue messages for sending
     * - Apply anti-ban delay logic
     * - Emit progress events
     * - Handle errors gracefully
     *
     * @param params Campaign execution parameters
     */
    startCampaign(params: CampaignExecutionParams): Promise<void>;
    /**
     * Pause ongoing campaign
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Signal worker to pause
     * - Complete current message if in progress
     * - Maintain queue state
     * - Emit paused event
     */
    pauseCampaign(): Promise<void>;
    /**
     * Resume paused campaign
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Signal worker to resume
     * - Continue from last message
     * - Emit resumed event
     */
    resumeCampaign(): Promise<void>;
    /**
     * Stop campaign completely
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Signal worker to stop
     * - Clear message queue
     * - Emit stopped event
     * - Return final statistics
     */
    stopCampaign(): Promise<void>;
    /**
     * Get current session status
     *
     * @returns Current WhatsApp session status
     */
    getSessionStatus(): WhatsAppSessionStatus;
    /**
     * Register event listener
     *
     * Available events:
     * - 'qr' - QR code for authentication
     * - 'ready' - WhatsApp client ready
     * - 'authenticated' - Successfully authenticated
     * - 'progress' - Campaign progress update
     * - 'complete' - Campaign completed
     * - 'error' - Error occurred
     * - 'paused' - Campaign paused
     * - 'resumed' - Campaign resumed
     * - 'stopped' - Campaign stopped
     *
     * @param event Event name
     * @param listener Callback function
     */
    on(event: string, listener: WhatsAppEventListener): void;
    /**
     * Unregister event listener
     *
     * @param event Event name
     * @param listener Callback function to remove
     */
    off(event: string, listener: WhatsAppEventListener): void;
    /**
     * Emit event to all registered listeners
     *
     * @param event Event name
     * @param data Event data
     * @internal For internal use when WhatsApp engine is activated
     */
    protected emit(event: string, data: any): void;
    /**
     * Clean up resources
     *
     * STUB: This method is not yet implemented.
     * When activated, this will:
     * - Stop worker thread
     * - Clear all listeners
     * - Close WhatsApp client
     * - Release resources
     */
    destroy(): Promise<void>;
}
/**
 * Singleton instance
 *
 * Use this instance throughout the application to ensure
 * only one WhatsApp connection is active at a time.
 */
export declare const whatsappAdapter: WhatsAppAdapter;
/**
 * Activation Guide
 *
 * To activate the WhatsApp engine:
 *
 * 1. Install Dependencies:
 *    npm install whatsapp-web.js puppeteer
 *
 * 2. Implement Worker Thread:
 *    - See electron/worker/whatsappWorker.new.ts
 *    - Import Worker from 'worker_threads'
 *    - Set up message passing
 *
 * 3. Connect Event Handlers:
 *    - Forward worker events to IPC
 *    - Implement progress tracking
 *    - Handle errors gracefully
 *
 * 4. Test Carefully:
 *    - Start with 2-3 test contacts
 *    - Use LONG delays (60+ seconds)
 *    - Monitor WhatsApp Web for bans
 *    - Never exceed 50 messages/hour initially
 *
 * 5. Security Considerations:
 *    - Session data is sensitive
 *    - Store in secure location
 *    - Never commit session files
 *    - Implement rate limiting
 *
 * See WHATSAPP_ENGINE_IMPLEMENTATION.md for complete guide.
 */
//# sourceMappingURL=whatsappAdapter.d.ts.map