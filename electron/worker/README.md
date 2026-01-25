# WhatsApp Worker - Local Execution Engine

This directory contains the WhatsApp Web.js worker implementation that runs **LOCALLY ONLY** in a Node.js environment.

## Important Notice

**The WhatsApp engine is NOT active in browser-based environments (like Bolt.new).**

This implementation requires:
- Local Node.js environment
- System-level dependencies (Chromium)
- File system access
- Worker thread support

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Main Process                       │
│  (electron/main/index.ts)                           │
│                                                      │
│  - Window management                                │
│  - IPC handlers                                     │
│  - Worker orchestration                             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ IPC (structured clone)
                   │
┌──────────────────▼──────────────────────────────────┐
│              WhatsApp Worker Thread                 │
│  (electron/worker/whatsappWorker.new.ts)           │
│                                                      │
│  - WhatsApp Web.js client                          │
│  - Puppeteer browser instance                      │
│  - Session management                               │
│  - Message queue processing                         │
│  - Anti-ban delay system                            │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
electron/worker/
├── README.md                   ← This file
├── whatsappWorker.ts          ← Current worker implementation
├── whatsappWorker.new.ts      ← Enhanced worker with full features
├── antiBan.ts                 ← Anti-ban delay system
├── sessionStore.ts            ← Session persistence
├── sender.ts                  ← Message sending logic
└── types.ts                   ← Type definitions
```

## Core Components

### 1. WhatsApp Worker (`whatsappWorker.new.ts`)

**Purpose:** Main worker thread that runs WhatsApp Web.js

**Key Features:**
- Worker thread isolation
- QR code authentication
- Session persistence
- Message queue management
- Real-time progress updates
- Error handling and recovery

**Message Protocol:**
```typescript
// Messages TO worker
{ type: 'init', config: WorkerConfig }
{ type: 'login' }
{ type: 'logout' }
{ type: 'start-campaign', campaign: CampaignTask }
{ type: 'pause' }
{ type: 'resume' }
{ type: 'stop' }

// Messages FROM worker
{ type: 'qr', qrCode: string }
{ type: 'ready' }
{ type: 'authenticated' }
{ type: 'progress', data: CampaignProgress }
{ type: 'complete', data: CampaignSummary }
{ type: 'error', error: string }
{ type: 'paused' }
{ type: 'resumed' }
{ type: 'stopped' }
```

### 2. Anti-Ban System (`antiBan.ts`)

**Purpose:** Implements intelligent delays to avoid WhatsApp detection

**Strategies:**
- **Gaussian Distribution:** Natural human-like timing
- **Message Limits:** Daily/hourly caps
- **Burst Control:** Prevents rapid-fire sending
- **Long Pauses:** Random breaks between batches
- **Exponential Backoff:** Progressive delays on errors

**Delay Presets:**
```typescript
'conservative' // 60-120 seconds (safest)
'moderate'     // 30-90 seconds (balanced)
'aggressive'   // 15-45 seconds (risky)
'custom'       // User-defined range
```

**Formula:**
```
delay = baseDelay * gaussian(μ=1, σ=0.15) + burstPenalty + errorBackoff
```

### 3. Session Store (`sessionStore.ts`)

**Purpose:** Persist WhatsApp authentication between runs

**Features:**
- Save/load WhatsApp session
- Automatic QR-less login on restart
- Session validation
- Secure storage in userData directory
- Export/import capabilities

**Storage Location:**
```
~/Library/Application Support/Sambad/.wwebjs_auth/  (macOS)
%APPDATA%/Sambad/.wwebjs_auth/                     (Windows)
~/.config/Sambad/.wwebjs_auth/                     (Linux)
```

### 4. Message Sender (`sender.ts`)

**Purpose:** Handle message sending with template variables

**Features:**
- Text message sending
- Media attachments (images, videos, documents, audio)
- Template variable replacement ({{v1}} through {{v10}})
- Phone number validation
- Registration checking
- Retry logic

**Template Variables:**
```typescript
// Template: "Hello {{v1}}, your order {{v2}} is ready!"
// Variables: { v1: "John", v2: "#12345" }
// Result: "Hello John, your order #12345 is ready!"
```

### 5. Type Definitions (`types.ts`)

**Purpose:** Shared TypeScript types for worker communication

**Key Types:**
- `WorkerConfig` - Worker initialization
- `CampaignTask` - Campaign parameters
- `MessageTask` - Individual message
- `CampaignProgress` - Progress updates
- `WorkerMessage` - IPC messages

## Dependencies

### Production Dependencies
```json
{
  "whatsapp-web.js": "^1.34.2",
  "puppeteer": "^21.0.0",
  "qrcode-terminal": "^0.12.0"
}
```

### Why These Dependencies?

1. **whatsapp-web.js**
   - Official WhatsApp Web API wrapper
   - Handles authentication and session
   - Provides message sending interface
   - Emits events for QR, ready, message, etc.

2. **puppeteer**
   - Required by whatsapp-web.js
   - Launches headless Chromium browser
   - Runs WhatsApp Web interface
   - Manages browser lifecycle

3. **qrcode-terminal**
   - Optional: Display QR codes in console
   - Useful for debugging
   - Can be replaced with UI display

## Activation Steps

### Step 1: Verify Local Environment

Ensure you're running in a **local Node.js environment**, not a browser:

```bash
# Check Node.js version (16+ required)
node --version

# Check npm
npm --version
```

### Step 2: Install Dependencies

```bash
npm install whatsapp-web.js puppeteer qrcode-terminal
```

### Step 3: Enable Worker in Main Process

In `electron/main/index.ts`:

```typescript
import { WorkerManager } from './workerManager.js';

// Initialize worker manager
const workerManager = new WorkerManager();

app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers(workerManager);
  createWindow();
});
```

### Step 4: Connect IPC Handlers

Update `electron/main/ipc.ts` to use WorkerManager:

```typescript
ipcMain.handle('campaign:start', async (_event, campaign) => {
  return await workerManager.startCampaign(campaign);
});

ipcMain.handle('campaign:pause', async () => {
  return await workerManager.pause();
});

// ... etc
```

### Step 5: Test with Small Campaign

1. Create 2-3 test contacts
2. Use **conservative** delay preset
3. Monitor console for errors
4. Scan QR code when prompted
5. Verify messages send successfully

### Step 6: Monitor and Adjust

Watch for:
- WhatsApp Web session stability
- Message delivery success rate
- Any "blocked" or "spam" warnings
- Browser memory usage
- Error patterns

## Safety Guidelines

### Message Limits (Start Conservative)

| Phase | Max Messages/Hour | Max Messages/Day | Delay Range |
|-------|------------------|------------------|-------------|
| Testing | 10 | 50 | 60-120s |
| Initial | 20 | 100 | 45-90s |
| Established | 30 | 200 | 30-60s |
| Mature | 50 | 500 | 20-45s |

### Red Flags to Watch For

1. **"Message not sent" errors**
   - Increase delays immediately
   - Wait 24 hours before retrying

2. **"Account temporarily restricted"**
   - STOP all campaigns
   - Wait 48-72 hours
   - Review message content
   - Reduce volume permanently

3. **Frequent disconnections**
   - Check internet stability
   - Verify session integrity
   - Consider longer delays

4. **Pattern recognition**
   - Vary message content
   - Randomize timing
   - Mix manual with automated
   - Don't send identical messages

## Troubleshooting

### Worker Won't Start

```
Error: Cannot find module 'whatsapp-web.js'
```

**Solution:** Install dependencies locally
```bash
npm install
```

### QR Code Not Displaying

**Check:**
1. Worker thread started successfully
2. Puppeteer can launch browser
3. No conflicting WhatsApp Web sessions
4. Firewall not blocking connections

### Messages Failing to Send

**Common Causes:**
1. Invalid phone number format (must include country code)
2. Number not registered on WhatsApp
3. Account temporarily restricted
4. Session expired (scan QR again)
5. Internet connection issues

### Session Not Persisting

**Verify:**
1. userData directory is writable
2. Session files not deleted
3. Correct path in sessionStore
4. No permission errors

## Performance Considerations

### Memory Usage

- WhatsApp client: ~200-300 MB
- Puppeteer browser: ~100-200 MB
- Total: ~300-500 MB per worker

**Recommendation:** Use single worker instance

### CPU Usage

- Idle: 1-2%
- Sending messages: 5-10%
- Initial load: 20-30%

### Network Bandwidth

- Minimal when idle
- Varies with media attachments
- QR auth requires stable connection

## Advanced Configuration

### Custom Puppeteer Args

```typescript
const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});
```

### Session Backup

```typescript
// Export session for backup
const session = await sessionStore.export();
await fs.writeFile('backup.json', JSON.stringify(session));

// Restore from backup
const backup = JSON.parse(await fs.readFile('backup.json', 'utf8'));
await sessionStore.import(backup);
```

### Multi-Number Support

To support multiple WhatsApp accounts:

1. Create separate worker instances
2. Use different session directories
3. Implement worker pool
4. Queue campaigns across workers

## Security Best Practices

1. **Never commit session data**
   - Add `.wwebjs_auth/` to `.gitignore`
   - Session files contain credentials

2. **Sanitize user input**
   - Validate phone numbers
   - Check message content
   - Prevent injection attacks

3. **Rate limit API access**
   - Prevent abuse of campaign creation
   - Limit concurrent campaigns

4. **Monitor for suspicious activity**
   - Unusual message patterns
   - High failure rates
   - Rapid account creation

5. **Obtain user consent**
   - Terms of service
   - Privacy policy
   - WhatsApp ToS compliance

## Legal Considerations

**IMPORTANT:** Using WhatsApp for bulk messaging may violate:
- WhatsApp Terms of Service
- GDPR (EU) / CCPA (California)
- Local anti-spam laws

**Requirements:**
- Obtain explicit consent from recipients
- Provide opt-out mechanism
- Honor do-not-contact lists
- Include sender identification
- Comply with local regulations

**Use responsibly and legally.**

## Support Resources

- **WhatsApp Web.js Documentation:** https://wwebjs.dev/
- **Puppeteer Documentation:** https://pptr.dev/
- **Electron Worker Threads:** https://nodejs.org/api/worker_threads.html
- **Implementation Guide:** `../../../WHATSAPP_ENGINE_IMPLEMENTATION.md`

## Version History

- **v1.0.0** - Initial worker implementation
- **v1.1.0** - Added anti-ban system
- **v1.2.0** - Session persistence
- **v2.0.0** - Enhanced worker with full features

---

**Current Status:** ✅ Implemented, documented, ready for local activation

**Next Steps:** Follow `WHATSAPP_ENGINE_IMPLEMENTATION.md` for activation guide

**Support:** Review existing documentation and worker implementation files
