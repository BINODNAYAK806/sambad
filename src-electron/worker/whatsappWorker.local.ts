import { parentPort } from 'worker_threads';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import type {
  WorkerMessage,
  WorkerResponse,
  CampaignTask,
  MessageTask,
  MessageResult,
  MediaAttachment,
} from './types';
import { pickDelay } from '../../src/renderer/utils/delayUtils';
import type { DelayPreset } from '../../src/renderer/types/delay';

let client: Client | null = null;
let isClientReady = false;
let isPaused = false;
let shouldStop = false;
let currentCampaign: CampaignTask | null = null;

function sendMessage(response: WorkerResponse): void {
  if (parentPort) {
    parentPort.postMessage(response);
  }
}

function initializeWhatsAppClient(): void {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-zygote',
        '--single-process',
        '--hide-scrollbars',
        '--mute-audio',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-position=-2400,-2400',
        '--window-size=1,1',
      ],
    },
  });

  client.on('qr', (qr: string) => {
    console.log('[Worker] QR Code received');
    qrcode.generate(qr, { small: true });
    sendMessage({
      type: 'QR_CODE',
      data: { qrCode: qr },
    });
  });

  client.on('ready', () => {
    console.log('[Worker] WhatsApp client is ready');
    isClientReady = true;
    sendMessage({
      type: 'READY',
      data: {},
    });
  });

  client.on('authenticated', () => {
    console.log('[Worker] Client authenticated');
  });

  client.on('auth_failure', (msg: string) => {
    console.error('[Worker] Authentication failure:', msg);
    sendMessage({
      type: 'ERROR',
      data: { error: `Authentication failed: ${msg}` },
    });
  });

  client.on('disconnected', (reason: string) => {
    console.log('[Worker] Client disconnected:', reason);
    isClientReady = false;
    sendMessage({
      type: 'ERROR',
      data: { error: `Disconnected: ${reason}` },
    });
  });

  client.initialize();
}

function resolveTemplateVariables(template: string, variables?: Record<string, string>): string {
  if (!variables) return template;

  let resolved = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    resolved = resolved.replace(regex, value);
  }
  return resolved;
}

async function downloadMedia(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function sendWhatsAppMessage(
  task: MessageTask
): Promise<MessageResult> {
  if (!client || !isClientReady) {
    throw new Error('WhatsApp client is not ready');
  }

  const { id: messageId, recipientNumber, templateText, variables, mediaAttachments } = task;

  try {
    const chatId = recipientNumber.includes('@c.us')
      ? recipientNumber
      : `${recipientNumber}@c.us`;

    const messageText = resolveTemplateVariables(templateText, variables);

    if (mediaAttachments && mediaAttachments.length > 0) {
      const attachmentsToSend = mediaAttachments.slice(0, 10);

      for (let i = 0; i < attachmentsToSend.length; i++) {
        const attachment = attachmentsToSend[i];

        try {
          const mediaBuffer = await downloadMedia(attachment.url);
          const media = new MessageMedia(
            getMimeType(attachment.type),
            mediaBuffer.toString('base64'),
            attachment.filename || `attachment_${i + 1}`
          );

          const caption = attachment.caption
            ? resolveTemplateVariables(attachment.caption, variables)
            : (i === 0 ? messageText : undefined);

          await client.sendMessage(chatId, media, {
            caption: caption,
          });

          if (i < attachmentsToSend.length - 1) {
            await sleep(2000);
          }
        } catch (mediaError) {
          console.error(`[Worker] Failed to send media ${i + 1}:`, mediaError);
        }
      }

      if (!attachmentsToSend[0]?.caption) {
        await client.sendMessage(chatId, messageText);
      }
    } else {
      await client.sendMessage(chatId, messageText);
    }

    return {
      messageId,
      recipientNumber,
      status: 'sent',
      sentAt: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Worker] Failed to send message ${messageId}:`, errorMessage);

    return {
      messageId,
      recipientNumber,
      status: 'failed',
      error: errorMessage,
    };
  }
}

function getMimeType(type: MediaAttachment['type']): string {
  const mimeTypes: Record<MediaAttachment['type'], string> = {
    image: 'image/jpeg',
    video: 'video/mp4',
    audio: 'audio/mpeg',
    document: 'application/pdf',
  };
  return mimeTypes[type] || 'application/octet-stream';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processCampaign(campaign: CampaignTask): Promise<void> {
  currentCampaign = campaign;
  const { campaignId, messages, delaySettings } = campaign;

  console.log(`[Worker] Starting campaign ${campaignId} with ${messages.length} messages`);

  let sentCount = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < messages.length; i++) {
      if (shouldStop) {
        console.log('[Worker] Campaign stopped by user');
        break;
      }

      while (isPaused) {
        await sleep(1000);
        if (shouldStop) break;
      }

      if (shouldStop) break;

      const message = messages[i];

      console.log(`[Worker] Processing message ${i + 1}/${messages.length} to ${message.recipientNumber}`);

      const result = await sendWhatsAppMessage(message);

      if (result.status === 'sent') {
        sentCount++;
      } else {
        failedCount++;
      }

      const progress = Math.round(((i + 1) / messages.length) * 100);

      sendMessage({
        type: 'PROGRESS',
        data: {
          campaignId,
          messageId: result.messageId,
          recipientNumber: result.recipientNumber,
          status: result.status,
          error: result.error,
          totalMessages: messages.length,
          sentCount,
          failedCount,
          progress,
        },
      });

      if (i < messages.length - 1) {
        const delayMs = pickDelay(delaySettings.preset as DelayPreset);
        console.log(`[Worker] Waiting ${delayMs}ms before next message...`);
        await sleep(delayMs);
      }
    }

    sendMessage({
      type: 'COMPLETE',
      data: {
        campaignId,
        totalMessages: messages.length,
        sentCount,
        failedCount,
      },
    });

    console.log(`[Worker] Campaign completed: ${sentCount} sent, ${failedCount} failed`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Worker] Campaign error:', errorMessage);

    sendMessage({
      type: 'ERROR',
      data: {
        campaignId,
        error: errorMessage,
        sentCount,
        failedCount,
      },
    });
  } finally {
    currentCampaign = null;
    shouldStop = false;
    isPaused = false;
  }
}

if (parentPort) {
  parentPort.on('message', async (message: WorkerMessage) => {
    const { type, payload } = message;

    switch (type) {
      case 'START_CAMPAIGN':
        if (payload) {
          if (!client) {
            initializeWhatsAppClient();
            await new Promise<void>((resolve) => {
              const checkReady = setInterval(() => {
                if (isClientReady) {
                  clearInterval(checkReady);
                  resolve();
                }
              }, 500);
            });
          }

          if (!isClientReady) {
            sendMessage({
              type: 'ERROR',
              data: { error: 'WhatsApp client is not ready' },
            });
            return;
          }

          shouldStop = false;
          isPaused = false;
          await processCampaign(payload);
        }
        break;

      case 'PAUSE_CAMPAIGN':
        isPaused = true;
        sendMessage({
          type: 'PAUSED',
          data: { campaignId: currentCampaign?.campaignId },
        });
        console.log('[Worker] Campaign paused');
        break;

      case 'RESUME_CAMPAIGN':
        isPaused = false;
        sendMessage({
          type: 'RESUMED',
          data: { campaignId: currentCampaign?.campaignId },
        });
        console.log('[Worker] Campaign resumed');
        break;

      case 'STOP_CAMPAIGN':
        shouldStop = true;
        isPaused = false;
        console.log('[Worker] Stop requested');
        break;

      default:
        console.warn('[Worker] Unknown message type:', type);
    }
  });

  console.log('[Worker] WhatsApp worker thread started (LOCAL MODE)');
} else {
  console.error('[Worker] No parentPort available');
}
