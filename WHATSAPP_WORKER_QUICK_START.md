# WhatsApp Worker - Quick Start

Fast reference for integrating the WhatsApp Worker system.

---

## 🚀 Basic Usage

### 1. Import and Use CampaignRunner

```tsx
import CampaignRunner from './renderer/components/CampaignRunner';

function MyApp() {
  const campaign = {
    campaignId: 'my-campaign',
    messages: [
      {
        id: 'msg-1',
        recipientNumber: '1234567890',
        recipientName: 'John',
        templateText: 'Hi {{name}}!',
        variables: { name: 'John' }
      }
    ],
    delaySettings: { preset: 'medium' }
  };

  return <CampaignRunner campaign={campaign} />;
}
```

---

## 📝 Message Template

```typescript
{
  id: string,                          // Unique message ID
  recipientNumber: string,             // Phone (international, no +)
  recipientName?: string,              // Optional name
  templateText: string,                // Message with {{variables}}
  variables?: Record<string, string>,  // Variable values
  mediaAttachments?: MediaAttachment[] // Max 10 attachments
}
```

---

## 📎 Media Attachment

```typescript
{
  id: string,                          // Unique attachment ID
  url: string,                         // Public URL
  type: 'image' | 'video' | 'audio' | 'document',
  caption?: string,                    // Optional with {{variables}}
  filename?: string                    // Optional filename
}
```

---

## ⏱️ Delay Presets

```typescript
delaySettings: {
  preset: 'very_short' | 'short' | 'medium' | 'long' | 'very_long' | 'manual',
  minDelay?: number,  // For manual preset (milliseconds)
  maxDelay?: number   // For manual preset (milliseconds)
}
```

**Preset Ranges:**
- `very_short`: 1–5s
- `short`: 5–20s
- `medium`: 20–50s (recommended)
- `long`: 50–120s
- `very_long`: 120–300s
- `manual`: Custom range

---

## 🎛️ Control Methods

```typescript
// Start campaign
await window.electronAPI.campaignWorker.start(campaign);

// Pause
await window.electronAPI.campaignWorker.pause();

// Resume
await window.electronAPI.campaignWorker.resume();

// Stop
await window.electronAPI.campaignWorker.stop();

// Check status
const status = await window.electronAPI.campaignWorker.getStatus();
```

---

## 👂 Event Listeners

```typescript
// QR code for authentication
const unsubQr = window.electronAPI.campaignWorker.onQrCode((qrCode) => {
  console.log('Scan:', qrCode);
});

// Client ready
const unsubReady = window.electronAPI.campaignWorker.onReady(() => {
  console.log('Ready to send');
});

// Progress update
const unsubProgress = window.electronAPI.campaignWorker.onProgress((data) => {
  console.log(`${data.sentCount}/${data.totalMessages} sent`);
});

// Campaign complete
const unsubComplete = window.electronAPI.campaignWorker.onComplete((data) => {
  console.log('Done!', data);
});

// Error
const unsubError = window.electronAPI.campaignWorker.onError((data) => {
  console.error('Error:', data.error);
});

// Cleanup
return () => {
  unsubQr();
  unsubReady();
  unsubProgress();
  unsubComplete();
  unsubError();
};
```

---

## 🗄️ Database Queries

### Create Campaign

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('campaigns')
  .insert({
    name: 'Summer Sale',
    template_text: 'Hi {{name}}, check out our sale!',
    delay_preset: 'medium',
    total_messages: 100
  })
  .select()
  .single();

const campaignId = data.id;
```

### Create Messages

```typescript
const messages = [
  {
    campaign_id: campaignId,
    recipient_number: '1234567890',
    recipient_name: 'John',
    template_text: 'Hi {{name}}!',
    variables: { name: 'John' },
    status: 'pending'
  }
];

await supabase
  .from('campaign_messages')
  .insert(messages);
```

### Add Attachments

```typescript
const attachments = [
  {
    message_id: messageId,
    url: 'https://example.com/image.jpg',
    type: 'image',
    caption: 'Check this out!',
    filename: 'product.jpg',
    order_index: 0
  }
];

await supabase
  .from('message_attachments')
  .insert(attachments);
```

### Query Campaign Progress

```typescript
const { data } = await supabase
  .from('campaigns')
  .select('sent_count, failed_count, total_messages, status')
  .eq('id', campaignId)
  .single();

console.log(`${data.sent_count}/${data.total_messages} sent`);
```

---

## 📱 Phone Number Format

```typescript
// ✅ Correct
recipientNumber: '1234567890'        // International format, no +
recipientNumber: '919876543210'      // India example

// ❌ Wrong
recipientNumber: '+1234567890'       // No + symbol
recipientNumber: '(123) 456-7890'    // No formatting
```

---

## 🔐 Authentication Flow

1. First run: QR code appears
2. Scan with WhatsApp
3. Session saved in `.wwebjs_auth/`
4. Subsequent runs: Auto-authenticated

---

## ⚡ Quick Example

```typescript
const campaign = {
  campaignId: `camp-${Date.now()}`,
  messages: [
    {
      id: 'msg-1',
      recipientNumber: '1234567890',
      recipientName: 'Alice',
      templateText: 'Hi {{name}}, your code is {{code}}',
      variables: { name: 'Alice', code: 'ABC123' },
      mediaAttachments: [
        {
          id: 'att-1',
          url: 'https://example.com/qr.png',
          type: 'image',
          caption: 'Scan this QR code'
        }
      ]
    }
  ],
  delaySettings: { preset: 'medium' }
};

await window.electronAPI.campaignWorker.start(campaign);
```

---

## 🐛 Common Issues

### QR not appearing
```bash
# Delete auth data and restart
rm -rf .wwebjs_auth/
```

### Phone number not working
```typescript
// Ensure international format without +
const number = phoneNumber.replace(/[^0-9]/g, '');
```

### Media not sending
```typescript
// Verify URL is publicly accessible
fetch(mediaUrl).then(r => console.log(r.ok));
```

### Rate limiting
```typescript
// Use slower delays
delaySettings: { preset: 'long' }  // 50-120s
```

---

## 📂 File Locations

```
electron/worker/whatsappWorker.ts      # Worker implementation
electron/main/workerManager.ts         # Worker manager
electron/preload/index.ts              # IPC bridge
src/renderer/components/
  CampaignRunner.tsx                   # UI component
  CampaignRunnerDemo.tsx              # Demo component
```

---

## 🎯 TypeScript Types

```typescript
import type {
  CampaignTask,
  MessageTask,
  MediaAttachment,
  CampaignProgress
} from '../electron/preload/index';
```

---

## 📚 Full Documentation

See `WHATSAPP_WORKER_GUIDE.md` for complete documentation.

---

**Quick Start Complete!** 🎉

Run locally with: `npm run electron:dev`
