# WhatsApp Worker System Guide

Complete guide for using the WhatsApp Worker Thread system in Sambad.

## 📋 Overview

The WhatsApp Worker system runs WhatsApp Web.js in a separate Node.js worker thread, enabling:

- ✅ Non-blocking campaign execution
- ✅ QR code authentication
- ✅ Template variable resolution
- ✅ Media attachments (up to 10 per message)
- ✅ Anti-ban delays using the delay system
- ✅ Real-time progress tracking
- ✅ Pause/Resume/Stop controls
- ✅ Database persistence with Supabase

## 🏗️ Architecture

```
Renderer Process (React)
    ↓ IPC
Main Process (Electron)
    ↓ Worker Thread
WhatsApp Worker (whatsapp-web.js)
    ↓
WhatsApp Web API
```

## 📁 File Structure

```
electron/
├── worker/
│   ├── types.ts                    # Type definitions
│   └── whatsappWorker.ts          # Worker thread implementation
└── main/
    ├── workerManager.ts           # Worker lifecycle management
    └── index.ts                   # IPC handlers

electron/preload/
└── index.ts                       # IPC bridge to renderer

Database Tables:
├── campaigns                      # Campaign metadata
├── campaign_messages             # Individual messages
└── message_attachments          # Media files (up to 10 per message)
```

## 🚀 Usage Example

### 1. Start a Campaign

```typescript
import { useEffect, useState } from 'react';

function CampaignRunner() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    // Listen for QR code
    const unsubQr = window.electronAPI.campaignWorker.onQrCode((qrCode) => {
      console.log('Scan this QR code with WhatsApp:', qrCode);
      // Display QR code to user
    });

    // Listen for ready state
    const unsubReady = window.electronAPI.campaignWorker.onReady(() => {
      console.log('WhatsApp client is ready');
      setStatus('ready');
    });

    // Listen for progress
    const unsubProgress = window.electronAPI.campaignWorker.onProgress((data) => {
      setProgress(data.progress || 0);
      console.log(`Progress: ${data.sentCount}/${data.totalMessages}`);
    });

    // Listen for completion
    const unsubComplete = window.electronAPI.campaignWorker.onComplete((data) => {
      console.log('Campaign complete!', data);
      setStatus('completed');
    });

    // Listen for errors
    const unsubError = window.electronAPI.campaignWorker.onError((data) => {
      console.error('Campaign error:', data.error);
      setStatus('error');
    });

    return () => {
      unsubQr();
      unsubReady();
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, []);

  const startCampaign = async () => {
    const campaign = {
      campaignId: 'campaign-123',
      messages: [
        {
          id: 'msg-1',
          recipientNumber: '1234567890',
          recipientName: 'John Doe',
          templateText: 'Hello {{name}}, welcome to {{company}}!',
          variables: {
            name: 'John',
            company: 'Sambad'
          },
          mediaAttachments: [
            {
              id: 'media-1',
              url: 'https://example.com/image.jpg',
              type: 'image',
              caption: 'Check out this {{product}}!',
              filename: 'product.jpg'
            }
          ]
        },
        {
          id: 'msg-2',
          recipientNumber: '0987654321',
          recipientName: 'Jane Smith',
          templateText: 'Hi {{name}}, your order is ready!',
          variables: {
            name: 'Jane'
          }
        }
      ],
      delaySettings: {
        preset: 'medium',  // very_short, short, medium, long, very_long, manual
        minDelay: 20000,   // Optional: for manual preset
        maxDelay: 50000    // Optional: for manual preset
      }
    };

    const result = await window.electronAPI.campaignWorker.start(campaign);
    if (result.success) {
      console.log('Campaign started');
      setStatus('running');
    }
  };

  return (
    <div>
      <h2>Campaign Status: {status}</h2>
      <progress value={progress} max={100} />
      <button onClick={startCampaign}>Start Campaign</button>
    </div>
  );
}
```

### 2. Pause/Resume Campaign

```typescript
const pauseCampaign = async () => {
  const result = await window.electronAPI.campaignWorker.pause();
  console.log('Campaign paused');
};

const resumeCampaign = async () => {
  const result = await window.electronAPI.campaignWorker.resume();
  console.log('Campaign resumed');
};

const stopCampaign = async () => {
  const result = await window.electronAPI.campaignWorker.stop();
  console.log('Campaign stopped');
};
```

### 3. Check Worker Status

```typescript
const checkStatus = async () => {
  const result = await window.electronAPI.campaignWorker.getStatus();
  console.log('Worker exists:', result.status.exists);
  console.log('Worker ready:', result.status.ready);
};
```

## 📝 Template Variables

Template variables use `{{variable_name}}` syntax:

```typescript
const message = {
  templateText: 'Hello {{firstName}} {{lastName}}, your order {{orderId}} is ready!',
  variables: {
    firstName: 'John',
    lastName: 'Doe',
    orderId: '#12345'
  }
};

// Resolved message: "Hello John Doe, your order #12345 is ready!"
```

Variables work in:
- Message text
- Media captions

## 📎 Media Attachments

Each message supports up to 10 media attachments:

```typescript
const message = {
  id: 'msg-1',
  recipientNumber: '1234567890',
  templateText: 'Check out these products!',
  mediaAttachments: [
    {
      id: 'media-1',
      url: 'https://example.com/product1.jpg',
      type: 'image',
      caption: '{{productName}} - Only ${{price}}!',
      filename: 'product1.jpg'
    },
    {
      id: 'media-2',
      url: 'https://example.com/catalog.pdf',
      type: 'document',
      caption: 'Full catalog',
      filename: 'catalog.pdf'
    }
  ],
  variables: {
    productName: 'Widget Pro',
    price: '99.99'
  }
};
```

**Supported media types:**
- `image` - JPEG, PNG, GIF
- `video` - MP4, AVI, MOV
- `audio` - MP3, OGG, WAV
- `document` - PDF, DOC, XLS, etc.

## ⏱️ Delay Settings

The system uses the delay presets from the Delay System:

```typescript
const delaySettings = {
  preset: 'medium'  // Picks random delay between 20-50 seconds
};

// Or use manual range:
const customDelay = {
  preset: 'manual',
  minDelay: 30000,  // 30 seconds
  maxDelay: 60000   // 60 seconds
};
```

**Available presets:**
- `very_short`: 1–5 seconds
- `short`: 5–20 seconds
- `medium`: 20–50 seconds (recommended)
- `long`: 50–120 seconds
- `very_long`: 120–300 seconds
- `manual`: Custom range

## 📊 Database Schema

### campaigns table
```sql
CREATE TABLE campaigns (
  id uuid PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  template_text text NOT NULL,
  status text DEFAULT 'pending',
  delay_preset text DEFAULT 'medium',
  min_delay integer,
  max_delay integer,
  total_messages integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### campaign_messages table
```sql
CREATE TABLE campaign_messages (
  id uuid PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id),
  recipient_number text NOT NULL,
  recipient_name text,
  template_text text NOT NULL,
  variables jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### message_attachments table
```sql
CREATE TABLE message_attachments (
  id uuid PRIMARY KEY,
  message_id uuid REFERENCES campaign_messages(id),
  url text NOT NULL,
  type text NOT NULL,
  caption text,
  filename text,
  order_index integer CHECK (order_index >= 0 AND order_index < 10),
  created_at timestamptz DEFAULT now()
);
```

## 🔒 Security

All tables have Row Level Security (RLS) enabled:

- Users can only access their own campaigns
- Policies enforce `auth.uid()` checks
- Worker thread runs in isolated environment
- Session data stored in `.wwebjs_auth` directory

## 🎯 IPC Events

### Invoke Methods (Renderer → Main)
- `campaign:start` - Start campaign execution
- `campaign:pause` - Pause running campaign
- `campaign:resume` - Resume paused campaign
- `campaign:stop` - Stop campaign completely
- `campaign:status` - Get worker status

### Listen Events (Main → Renderer)
- `campaign:qr` - QR code for authentication
- `campaign:ready` - WhatsApp client ready
- `campaign:progress` - Message sent/failed update
- `campaign:complete` - Campaign finished
- `campaign:error` - Error occurred
- `campaign:paused` - Campaign paused
- `campaign:resumed` - Campaign resumed

## 🔧 TypeScript Types

```typescript
type CampaignTask = {
  campaignId: string;
  messages: MessageTask[];
  delaySettings: {
    preset: DelayPreset;
    minDelay?: number;
    maxDelay?: number;
  };
};

type MessageTask = {
  id: string;
  recipientNumber: string;
  recipientName?: string;
  templateText: string;
  variables?: Record<string, string>;
  mediaAttachments?: MediaAttachment[];
};

type MediaAttachment = {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
};

type CampaignProgress = {
  campaignId?: string;
  messageId?: string;
  recipientNumber?: string;
  status?: 'sent' | 'failed';
  error?: string;
  totalMessages?: number;
  sentCount?: number;
  failedCount?: number;
  progress?: number;
};
```

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Development mode (Vite only - DO NOT RUN ELECTRON HERE)
npm run dev

# Build for production
npm run build

# Run Electron locally on your machine
# (Instructions for running Electron locally)
npm run electron:dev
```

## ⚠️ Important Notes

1. **First-time setup**: On first run, a QR code will be displayed. Scan it with WhatsApp to authenticate.

2. **Session persistence**: After successful authentication, the session is saved in `.wwebjs_auth/` and will persist across restarts.

3. **Phone number format**: Use international format without `+` symbol (e.g., `1234567890` for US numbers).

4. **Rate limiting**: Always use appropriate delays to avoid WhatsApp bans. The `medium` preset (20-50s) is recommended.

5. **Media URLs**: Ensure media URLs are publicly accessible. The worker downloads them before sending.

6. **Error handling**: Check the `error_message` field in the database for failed messages.

7. **Browser environment**: This worker ONLY runs in Electron locally. DO NOT attempt to run in browser environments like Bolt.new.

## 🐛 Troubleshooting

### QR code not appearing
- Check console logs for errors
- Ensure puppeteer dependencies are installed
- Try deleting `.wwebjs_auth/` and re-authenticating

### Messages not sending
- Verify phone numbers are in correct format
- Check WhatsApp Web is working in a browser
- Review delay settings (too fast = ban risk)

### Worker errors
- Check Node.js version (16+ required)
- Ensure all dependencies installed: `npm install`
- Review main process logs for errors

## 📚 Related Files

- `/electron/worker/whatsappWorker.ts` - Worker implementation
- `/electron/main/workerManager.ts` - Worker manager
- `/electron/main/index.ts` - IPC handlers
- `/electron/preload/index.ts` - IPC bridge
- `/src/renderer/utils/delayUtils.ts` - Delay system
- `/src/renderer/types/delay.ts` - Delay types

## 🎉 Complete!

Your WhatsApp Worker system is ready to use. Start building amazing campaigns with Sambad!
