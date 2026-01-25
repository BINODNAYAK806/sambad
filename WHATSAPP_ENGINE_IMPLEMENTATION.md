# WhatsApp Engine Implementation Guide

## Overview
Complete WhatsApp messaging engine for Sambad using whatsapp-web.js with local SQLite storage, anti-ban protection, and campaign management.

## ✅ Components Completed

### 1. Anti-Ban System (`electron/worker/antiBan.ts`)
**Status:** ✅ COMPLETE

Features:
- Gaussian delay distribution with jitter
- 5 delay presets (very_short to very_long)
- Custom delay support
- Daily message limits (default: 1000)
- Burst control with long pauses (20-60 messages)
- Exponential backoff for retries
- Quota tracking and reporting

Presets:
- `very_short`: 1-5s
- `short`: 5-20s
- `medium`: 20-50s
- `long`: 50-120s
- `very_long`: 120-300s
- `custom`: User-defined min/max

### 2. Session Store (`electron/worker/sessionStore.ts`)
**Status:** ✅ COMPLETE

Features:
- WhatsApp session persistence
- Auto-restore on app restart
- Session export/import
- Session info and statistics
- Path: `userData/wa-sessions/sambad-default/`

Methods:
- `getSessionPath()` - Get session directory
- `sessionExists()` - Check if session exists
- `clearSession()` - Delete session data
- `exportSession(dest)` - Backup session
- `importSession(src)` - Restore session
- `getSessionInfo()` - Get session metadata

### 3. Message Sender (`electron/worker/sender.ts`)
**Status:** ✅ COMPLETE

Features:
- Text message sending
- Media file sending (images, videos, audio, documents)
- Multiple media support (max 10 per contact)
- Template variable replacement ({{v1}}...{{v10}})
- Phone number validation and formatting
- WhatsApp registration check
- File type detection and MIME types

Functions:
- `sendText(client, phone, text)`
- `sendMedia(client, phone, path, caption)`
- `personalizeMessage(template, vars)`
- `formatPhoneNumber(phone)`
- `validatePhoneNumber(phone)`
- `checkNumberRegistered(client, phone)`

### 4. WhatsApp Worker (`electron/worker/whatsappWorker.new.ts`)
**Status:** ✅ COMPLETE

Features:
- Worker thread architecture
- WhatsApp client initialization
- QR code generation
- Session management
- Campaign execution
- Pause/resume/stop controls
- Progress reporting
- Auto-reconnect (max 5 attempts)
- Comprehensive logging

Events Emitted:
- `QR_CODE` - QR for scanning
- `READY` - Client ready
- `AUTHENTICATED` - Login success
- `CAMPAIGN_STARTED` - Campaign begins
- `CAMPAIGN_PROGRESS` - Per-message progress
- `CAMPAIGN_COMPLETED` - Campaign done
- `CAMPAIGN_PAUSED/RESUMED/STOPPED`
- `ERROR` - Error occurred

### 5. Campaign Manager (`electron/main/campaignManager.ts`)
**Status:** ✅ COMPLETE

Features:
- Worker thread spawning
- Event forwarding to renderer
- Campaign lifecycle management
- Error handling
- Clean shutdown

Methods:
- `initialize()` - Start worker
- `startCampaign(task)` - Begin campaign
- `pauseCampaign()` - Pause execution
- `resumeCampaign()` - Resume execution
- `stopCampaign()` - Stop completely
- `logout()` - Clear WhatsApp session
- `getStatus()` - Get current state
- `terminate()` - Shutdown worker

## ⚠️ Next Steps Required

### 1. Replace Old Worker
The new worker is at `whatsappWorker.new.ts`. To activate:

```bash
cd electron/worker
mv whatsappWorker.ts whatsappWorker.old.ts
mv whatsappWorker.new.ts whatsappWorker.ts
```

### 2. Integrate Campaign Manager in Main Process
Add to `electron/main/index.ts`:

```typescript
import { CampaignManager } from './campaignManager.js';
import { app } from 'electron';

let campaignManager: CampaignManager | null = null;

// In app.whenReady():
const userDataPath = app.getPath('userData');
campaignManager = new CampaignManager(userDataPath, mainWindow);
await campaignManager.initialize();

// Add IPC handlers:
ipcMain.handle('campaign:start', async (_event, campaignId: number) => {
  // Load campaign from DB
  const campaign = campaigns.getById(campaignId);
  const groupContacts = groups.getContacts(campaign.group_id);

  // Build campaign task
  const task = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    messageTemplate: campaign.message_template,
    contacts: groupContacts.map(c => ({
      id: c.id,
      phone: c.phone,
      name: c.name,
      variables: c.variables
    })),
    delaySettings: {
      preset: campaign.delay_preset,
      minDelay: campaign.delay_min,
      maxDelay: campaign.delay_max
    }
  };

  await campaignManager.startCampaign(task);
  return { success: true };
});

ipcMain.handle('campaign:pause', () => {
  campaignManager.pauseCampaign();
  return { success: true };
});

ipcMain.handle('campaign:resume', () => {
  campaignManager.resumeCampaign();
  return { success: true };
});

ipcMain.handle('campaign:stop', () => {
  campaignManager.stopCampaign();
  return { success: true };
});

ipcMain.handle('campaign:status', () => {
  campaignManager.getStatus();
  return { success: true };
});

// In app.on('before-quit'):
if (campaignManager) {
  await campaignManager.terminate();
}
```

### 3. Update Preload API
Add to `electron/preload/index.ts`:

```typescript
whatsapp: {
  startCampaign: (campaignId: number): Promise<DbResult> =>
    ipcRenderer.invoke('campaign:start', campaignId),
  pauseCampaign: (): Promise<DbResult> =>
    ipcRenderer.invoke('campaign:pause'),
  resumeCampaign: (): Promise<DbResult> =>
    ipcRenderer.invoke('campaign:resume'),
  stopCampaign: (): Promise<DbResult> =>
    ipcRenderer.invoke('campaign:stop'),
  getStatus: (): Promise<DbResult> =>
    ipcRenderer.invoke('campaign:status'),

  onQrCode: (callback: (qr: string) => void) => {
    const listener = (_event: any, qr: string) => callback(qr);
    ipcRenderer.on('campaign:qr', listener);
    return () => ipcRenderer.removeListener('campaign:qr', listener);
  },

  onReady: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('campaign:ready', listener);
    return () => ipcRenderer.removeListener('campaign:ready', listener);
  },

  onProgress: (callback: (progress: any) => void) => {
    const listener = (_event: any, progress: any) => callback(progress);
    ipcRenderer.on('campaign:progress', listener);
    return () => ipcRenderer.removeListener('campaign:progress', listener);
  },

  onComplete: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('campaign:complete', listener);
    return () => ipcRenderer.removeListener('campaign:complete', listener);
  },

  onError: (callback: (error: any) => void) => {
    const listener = (_event: any, error: any) => callback(error);
    ipcRenderer.on('campaign:error', listener);
    return () => ipcRenderer.removeListener('campaign:error', listener);
  }
}
```

### 4. Update Renderer Types
Add to `src/renderer/types/electron.d.ts`:

```typescript
whatsapp: {
  startCampaign: (campaignId: number) => Promise<DbResult>;
  pauseCampaign: () => Promise<DbResult>;
  resumeCampaign: () => Promise<DbResult>;
  stopCampaign: () => Promise<DbResult>;
  getStatus: () => Promise<DbResult>;
  onQrCode: (callback: (qr: string) => void) => () => void;
  onReady: (callback: () => void) => () => void;
  onProgress: (callback: (progress: any) => void) => () => void;
  onComplete: (callback: (data: any) => void) => () => void;
  onError: (callback: (error: any) => void) => () => void;
};
```

### 5. UI Integration
Update `CampaignMonitor.tsx` and `CampaignRunner.tsx` to use the new WhatsApp API.

## 📋 Testing Checklist

1. **Installation**
   ```bash
   npm install
   npm run build
   ```

2. **First Run - QR Authentication**
   - Start app
   - Navigate to Campaigns
   - Click "Connect WhatsApp"
   - Scan QR code with WhatsApp mobile
   - Verify "Ready" status

3. **Session Persistence**
   - Restart app
   - Should auto-login without QR

4. **Campaign Execution**
   - Import contacts
   - Create campaign
   - Select delay preset
   - Start campaign
   - Verify progress updates
   - Check message delivery

5. **Pause/Resume/Stop**
   - Test pause during campaign
   - Verify delay is respected
   - Resume and continue
   - Test stop completely

6. **Anti-Ban Features**
   - Monitor delay variations
   - Verify long pauses occur
   - Check daily limit enforcement
   - Test quota reporting

7. **Error Handling**
   - Invalid phone numbers (should skip)
   - Unregistered numbers (should skip)
   - Network disconnections (should reconnect)
   - WhatsApp logout (should detect)

## ⚙️ Configuration

### Anti-Ban Settings
Edit `electron/worker/antiBan.ts`:

```typescript
const DEFAULT_ANTI_BAN_CONFIG: AntiBanConfig = {
  dailyLimit: 1000,           // Max messages per day
  burstLimit: 50,             // Unused currently
  longPauseInterval: {        // Long pause after N messages
    min: 20,
    max: 60
  },
  longPauseDuration: {        // Long pause duration
    min: 300000,              // 5 minutes
    max: 600000               // 10 minutes
  },
};
```

### Delay Presets
Edit `DELAY_PRESETS` in `antiBan.ts` to customize:

```typescript
const DELAY_PRESETS: Record<DelayPreset, { min: number; max: number }> = {
  very_short: { min: 1000, max: 5000 },
  short: { min: 5000, max: 20000 },
  medium: { min: 20000, max: 50000 },
  long: { min: 50000, max: 120000 },
  very_long: { min: 120000, max: 300000 },
  custom: { min: 1000, max: 5000 },
};
```

## 🔒 Security Considerations

### Data Privacy
- Session stored locally in `userData/wa-sessions/`
- Never uploaded to cloud
- No message content logged
- Phone numbers encrypted in transit

### WhatsApp Terms
- **UNOFFICIAL API** - Use at your own risk
- WhatsApp may ban accounts for bulk messaging
- Always obtain user consent before messaging
- Respect opt-out requests
- Use longest delays for safety

### Best Practices
- Start with `very_long` delays
- Never exceed 500 messages/day initially
- Gradually increase if no issues
- Monitor for authentication failures
- Always test with small groups first

## 📊 Logging

All operations are logged to:
- Console output (development)
- SQLite `logs` table (production)
- Electron main process logs

Log levels:
- `info` - Normal operations
- `warn` - Recoverable issues
- `error` - Failures requiring attention
- `debug` - Detailed debugging info

## 🐛 Troubleshooting

### QR Code Not Showing
- Check Puppeteer installation
- Verify Chrome/Chromium available
- Check sandboxing disabled in args
- Review console for errors

### Authentication Failures
- Clear session: `sessionStore.clearSession()`
- Delete `.wwebjs_auth` folder manually
- Restart app and rescan QR

### Messages Not Sending
- Verify WhatsApp client ready
- Check phone number formatting
- Confirm number registered on WhatsApp
- Review daily quota not exceeded

### Worker Crashes
- Check Node.js version (>= 18)
- Verify worker file compiled correctly
- Review worker error logs
- Check system resources (RAM)

## 📚 Additional Resources

- [whatsapp-web.js Documentation](https://wwebjs.dev/)
- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [Electron Worker Threads](https://www.electronjs.org/docs/latest/tutorial/multithreading)

## ⚠️ Disclaimer

This application uses an unofficial WhatsApp API. WhatsApp does not officially support automated bulk messaging and may ban accounts that violate their Terms of Service. Use responsibly and at your own risk. Always obtain proper consent before sending messages.
