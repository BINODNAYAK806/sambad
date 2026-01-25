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
export class WhatsAppAdapter {
  private listeners: Map<string, Set<WhatsAppEventListener>> = new Map();
  private sessionStatus: WhatsAppSessionStatus = {
    initialized: false,
    authenticated: false,
    ready: false
  };

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
  async initSession(): Promise<void> {
    throw new Error(
      'WhatsApp engine not activated. ' +
      'This is a STUB implementation. ' +
      'To enable WhatsApp functionality, follow: WHATSAPP_ENGINE_IMPLEMENTATION.md'
    );
  }

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
  async login(): Promise<void> {
    throw new Error(
      'WhatsApp login not available. ' +
      'WhatsApp engine must be activated locally first.'
    );
  }

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
  async logout(): Promise<void> {
    throw new Error(
      'WhatsApp logout not available. ' +
      'WhatsApp engine must be activated locally first.'
    );
  }

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
  async startCampaign(params: CampaignExecutionParams): Promise<void> {
    console.log('[WhatsApp Adapter] Campaign start requested (stub):', {
      campaignId: params.campaignId,
      messageCount: params.messages.length,
      delayPreset: params.delaySettings.preset
    });

    throw new Error(
      'Campaign execution not available. ' +
      'WhatsApp engine must be activated to send messages. ' +
      'See: WHATSAPP_ENGINE_IMPLEMENTATION.md'
    );
  }

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
  async pauseCampaign(): Promise<void> {
    throw new Error(
      'Campaign control not available. ' +
      'WhatsApp engine must be activated locally first.'
    );
  }

  /**
   * Resume paused campaign
   *
   * STUB: This method is not yet implemented.
   * When activated, this will:
   * - Signal worker to resume
   * - Continue from last message
   * - Emit resumed event
   */
  async resumeCampaign(): Promise<void> {
    throw new Error(
      'Campaign control not available. ' +
      'WhatsApp engine must be activated locally first.'
    );
  }

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
  async stopCampaign(): Promise<void> {
    throw new Error(
      'Campaign control not available. ' +
      'WhatsApp engine must be activated locally first.'
    );
  }

  /**
   * Get current session status
   *
   * @returns Current WhatsApp session status
   */
  getSessionStatus(): WhatsAppSessionStatus {
    return { ...this.sessionStatus };
  }

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
  on(event: string, listener: WhatsAppEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Unregister event listener
   *
   * @param event Event name
   * @param listener Callback function to remove
   */
  off(event: string, listener: WhatsAppEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Emit event to all registered listeners
   *
   * @param event Event name
   * @param data Event data
   * @internal For internal use when WhatsApp engine is activated
   */
  protected emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error(`[WhatsApp Adapter] Error in ${event} listener:`, error);
        }
      });
    }
  }

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
  async destroy(): Promise<void> {
    this.listeners.clear();
    console.log('[WhatsApp Adapter] Destroyed (stub)');
  }
}

/**
 * Singleton instance
 *
 * Use this instance throughout the application to ensure
 * only one WhatsApp connection is active at a time.
 */
export const whatsappAdapter = new WhatsAppAdapter();

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
