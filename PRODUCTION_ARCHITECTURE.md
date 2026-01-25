# Production-Ready Hybrid Storage Architecture

## Overview

Sambad implements a **production-ready, hybrid storage architecture** designed for WhatsApp bulk messaging with proper separation between sensitive session data and business data.

---

## Architecture Principles

### 1. **Storage Separation** ✅

| Data Type | Storage Location | Why |
|-----------|-----------------|-----|
| **WhatsApp Session** | Local (userData) | Security: Session data contains authentication tokens that must remain on user's PC |
| **Contacts & Groups** | Cloud (Supabase) | Accessibility: Business data synced across devices |
| **Campaigns** | Cloud (Supabase) | Analytics: Campaign history and reports accessible anywhere |
| **Logs** | Local (userData) | Privacy: Debug logs stay on user's machine |

### 2. **Session Storage (LOCAL ONLY)**

```typescript
// WhatsApp session path
const authPath = path.join(app.getPath('userData'), '.wwebjs_auth');

// Uses LocalAuth from whatsapp-web.js
new Client({
  authStrategy: new LocalAuth({
    dataPath: authPath  // ✅ ALWAYS in userData
  })
})
```

**Why Local?**
- Contains sensitive authentication tokens
- Device-specific (can't be shared across machines)
- WhatsApp policy requires one session per device
- No network latency for session access

**Location:**
- Windows: `C:\Users\{username}\AppData\Roaming\Sambad\.wwebjs_auth`
- macOS: `~/Library/Application Support/Sambad/.wwebjs_auth`
- Linux: `~/.config/Sambad/.wwebjs_auth`

### 3. **Business Data (CLOUD + LOCAL FALLBACK)**

```typescript
// Hybrid storage with automatic fallback
const contacts = await storageService.getContacts();
// ✅ Tries cloud first, falls back to local SQLite
```

**Why Hybrid?**
- **Online**: Full sync with Supabase (multi-device access)
- **Offline**: Local SQLite fallback (works without internet)
- **Resilient**: Auto-recovers if cloud is temporarily unavailable

---

## Production-Ready Puppeteer Configuration

### Dynamic executablePath Detection

```typescript
function getChromiumExecutablePath(): string | undefined {
  const isPackaged = process.mainModule?.filename.includes('app.asar') ||
                     !process.execPath.includes('electron');

  if (isPackaged && process.resourcesPath) {
    // Production: Look for bundled Chromium
    const chromePath = path.join(process.resourcesPath, 'chrome', ...);
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }

    // Fallback: System Chrome/Edge
    return getSystemChromePath();
  } else {
    // Development: Puppeteer's bundled Chromium
    return puppeteer.executablePath();
  }
}
```

### Mandatory Launch Arguments

```typescript
const puppeteerConfig = {
  headless: true,
  args: [
    '--no-sandbox',              // ✅ Required for production
    '--disable-setuid-sandbox',  // ✅ Required for production
    '--disable-gpu',             // ✅ Prevents GPU crashes
    '--disable-dev-shm-usage',   // ✅ Fixes memory issues
    '--no-first-run',            // ✅ Skip Chrome welcome
    '--no-zygote',               // ✅ Better stability
    '--single-process',          // ✅ Simpler process model
  ],
  executablePath: getChromiumExecutablePath()  // ✅ Dynamic path
};
```

**Why These Arguments?**
- `--no-sandbox`: Required when running as non-root (production environments)
- `--disable-setuid-sandbox`: Alternative sandboxing (more compatible)
- `--disable-gpu`: Prevents GPU-related crashes in headless mode
- `--disable-dev-shm-usage`: Uses `/tmp` instead of `/dev/shm` (fixes Docker/low-memory issues)

---

## Build Configuration (electron-builder)

### Critical: asarUnpack

```json5
{
  "asarUnpack": [
    "node_modules/puppeteer/**/*",           // ✅ Chromium binary
    "node_modules/whatsapp-web.js/**/*",     // ✅ Native modules
    "node_modules/@whiskeysockets/**/*",     // ✅ Socket dependencies
    "node_modules/qrcode/**/*",              // ✅ QR code generator
    "dist-electron/electron/worker/**/*"     // ✅ Worker threads
  ]
}
```

**Why asarUnpack?**
- ASAR is a compressed archive (like ZIP)
- Chromium **cannot be executed** from inside ASAR
- Native Node modules need real file paths
- Worker threads require physical .js files

### Chromium Bundling

```json5
{
  "extraResources": [
    {
      "from": "node_modules/puppeteer/.cache-chromium",
      "to": "chrome",
      "filter": ["**/*"]
    }
  ]
}
```

**Result:**
- Chromium is copied to `{appPath}/resources/chrome/`
- Worker detects production mode and finds bundled Chromium
- No "Chromium not found" errors in production

---

## Error Handling & Debugging

### Error Log File

All errors are automatically logged to `{userData}/error.log`:

```typescript
import { ErrorLogger } from './errorLogger.js';

// Initialize (called in main process)
ErrorLogger.initialize();

// Log errors throughout the app
ErrorLogger.error('Browser failed to launch', error);
ErrorLogger.warn('Cloud storage unavailable, using local fallback');
ErrorLogger.info('Campaign started successfully', { campaignId: 123 });
```

**Log Location:**
- Windows: `C:\Users\{username}\AppData\Roaming\Sambad\error.log`
- macOS: `~/Library/Application Support/Sambad/error.log`
- Linux: `~/.config/Sambad/error.log`

**Contents:**
```
[2024-01-15T10:30:00.000Z] [INFO ] Sambad WhatsApp Campaign Manager Starting...
[2024-01-15T10:30:01.245Z] [INFO ] Local SQLite database initialized
[2024-01-15T10:30:01.567Z] [INFO ] Supabase client initialized {"mode":"hybrid"}
[2024-01-15T10:30:15.890Z] [ERROR] Browser failed to launch
{
  "message": "Failed to launch browser",
  "stack": "Error: Failed to launch browser\n    at ...",
  "code": "ENOENT"
}
```

### Debugging Production Builds

1. **Check error.log:**
   ```
   {userData}/error.log
   ```

2. **Verify Chromium bundling:**
   ```javascript
   // Run from package.json
   npm run verify:packaged
   ```

3. **Test browser detection:**
   ```typescript
   const chromePath = getChromiumExecutablePath();
   console.log('Found Chromium at:', chromePath);
   ```

---

## Storage Service API

### Initialization

```typescript
import { storageService } from './storageService.js';

// Configure storage mode
storageService.initialize({
  mode: 'hybrid',  // 'cloud' | 'local' | 'hybrid'
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
});
```

### Usage Examples

```typescript
// Get contacts (cloud with local fallback)
const contacts = await storageService.getContacts();

// Create contact (cloud with local fallback)
const contact = await storageService.createContact({
  phone: '+1234567890',
  name: 'John Doe',
  variables: { v1: 'Value 1', v2: 'Value 2' }
});

// Update contact
await storageService.updateContact(contactId, {
  name: 'Jane Doe'
});

// Same pattern for groups and campaigns
const groups = await storageService.getGroups();
const campaigns = await storageService.getCampaigns();
```

---

## Security Best Practices

### ✅ DO

1. **Store WhatsApp session in userData** (never in cloud)
2. **Use LocalAuth strategy** (built-in encryption)
3. **Log errors to local file** (not to cloud)
4. **Validate phone numbers before sending**
5. **Use environment variables for API keys**

### ❌ DON'T

1. **Don't hardcode Supabase credentials**
2. **Don't store session tokens in cloud**
3. **Don't expose error.log to users** (contains sensitive info)
4. **Don't skip phone number validation**
5. **Don't use global browser instance** (use worker threads)

---

## Deployment Checklist

### Before Building

- [ ] Environment variables configured in `.env`
- [ ] Supabase database schema migrated
- [ ] Chromium bundling verified (`npm run verify:chromium`)
- [ ] Worker files included in asarUnpack
- [ ] Error logging initialized in main process

### After Building

- [ ] Test installer on clean machine
- [ ] Verify Chromium launches (`npm run verify:packaged`)
- [ ] Check error.log for initialization errors
- [ ] Test offline mode (local fallback works)
- [ ] Test campaign creation and sending

### Production Environment

- [ ] App signs in to WhatsApp successfully
- [ ] QR code displays correctly
- [ ] Messages send without errors
- [ ] Cloud sync works (if online)
- [ ] Local fallback works (if offline)
- [ ] Logs are written to error.log

---

## Troubleshooting Production Issues

### "Chromium Not Found" Error

**Cause:** Chromium not properly bundled or unpacked

**Fix:**
1. Verify `asarUnpack` includes puppeteer
2. Run `npm run verify:packaged` after build
3. Check `{appPath}/resources/chrome/` exists
4. Add `--verbose` to electron-builder for debug output

### "Browser Failed to Launch" Error

**Cause:** Missing launch arguments or permissions

**Fix:**
1. Ensure `--no-sandbox` is in launch args
2. Check error.log for specific error message
3. Verify Chromium executable has execute permissions (Linux/macOS)
4. Try fallback to system Chrome

### "Session Lost" or "Authentication Failed"

**Cause:** Session data corrupted or moved

**Fix:**
1. Delete `.wwebjs_auth` folder in userData
2. Scan QR code again to re-authenticate
3. Ensure userData path is writable
4. Check disk space availability

### "Cloud Storage Unavailable"

**Cause:** Network issue or invalid Supabase credentials

**Fix:**
1. Check internet connection
2. Verify Supabase URL and API key in `.env`
3. Confirm Supabase project is active
4. App automatically falls back to local SQLite

---

## File Structure in Production

```
{app installation}/
├── Sambad.exe                    # Main executable
├── resources/
│   ├── app.asar                  # Compressed app code
│   ├── app.asar.unpacked/        # Unpacked modules
│   │   ├── node_modules/
│   │   │   ├── puppeteer/        # ✅ Unpacked
│   │   │   ├── whatsapp-web.js/  # ✅ Unpacked
│   │   │   └── ...
│   │   └── dist-electron/
│   │       └── electron/worker/  # ✅ Unpacked
│   └── chrome/                   # ✅ Bundled Chromium
│       └── win64-*/
│           └── chrome-win64/
│               └── chrome.exe

{userData}/                       # User-specific data
├── .wwebjs_auth/                 # ✅ WhatsApp session (LOCAL ONLY)
│   ├── session/
│   └── ...
├── sambad.db                     # ✅ Local SQLite (fallback)
├── error.log                     # ✅ Error logging
├── .env                          # User's environment config
└── logs/                         # Application logs
```

---

## Performance Optimization

### Worker Thread Isolation

```typescript
// WhatsApp client runs in separate worker thread
// Doesn't block main UI thread
const worker = new Worker('./whatsappWorker.js');
```

**Benefits:**
- UI remains responsive during message sending
- Browser crashes don't crash main app
- Can restart worker without restarting app

### Database Connection Pooling

```typescript
// SQLite uses WAL mode for better concurrency
db.pragma('journal_mode = WAL');
```

**Benefits:**
- Multiple readers can access DB simultaneously
- Writers don't block readers
- Better performance for concurrent operations

---

## Final Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                     SAMBAD ARCHITECTURE                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐           ┌──────────────┐            │
│  │   UI Layer   │◄─────────►│  Main Process │           │
│  │   (React)    │    IPC    │   (Electron)  │           │
│  └──────────────┘           └───────┬───────┘           │
│                                      │                    │
│                              ┌───────▼───────┐           │
│                              │  Error Logger │           │
│                              │  (error.log)  │           │
│                              └───────────────┘           │
│                                      │                    │
│                              ┌───────▼───────┐           │
│                              │ Storage Layer │           │
│                              │   (Hybrid)    │           │
│                              └───┬───────┬───┘           │
│                                  │       │                │
│                     ┌────────────┘       └────────────┐  │
│                     │                                  │  │
│              ┌──────▼──────┐                  ┌────────▼────────┐
│              │   Supabase  │                  │  Local SQLite   │
│              │   (Cloud)   │                  │   (Fallback)    │
│              └─────────────┘                  └─────────────────┘
│                                                                   │
│              ┌───────────────────────────────────────┐          │
│              │        Worker Thread                   │          │
│              │  ┌─────────────────────────────────┐  │          │
│              │  │   WhatsApp Client (Isolated)    │  │          │
│              │  │  ┌──────────────────────────┐   │  │          │
│              │  │  │  Puppeteer + Chromium    │   │  │          │
│              │  │  │  (Headless Browser)      │   │  │          │
│              │  │  └──────────────────────────┘   │  │          │
│              │  └─────────────────────────────────┘  │          │
│              └───────────────────────────────────────┘          │
│                              │                                    │
│                              ▼                                    │
│                    ┌─────────────────┐                          │
│                    │  userData Folder │                          │
│                    ├─────────────────┤                          │
│                    │ .wwebjs_auth/   │ ◄─ SESSION (LOCAL ONLY)  │
│                    │ error.log       │ ◄─ DEBUGGING             │
│                    │ sambad.db       │ ◄─ FALLBACK DATA         │
│                    └─────────────────┘                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Support & Resources

### Documentation Files
- `README.md` - Complete user guide
- `PRODUCTION_ARCHITECTURE.md` - This file
- `WINDOWS_CLEANUP_GUIDE.md` - Windows troubleshooting
- `CAMPAIGN_MONITOR_GUIDE.md` - Campaign management
- `WHATSAPP_WORKER_GUIDE.md` - Worker thread details

### Key Concepts
1. **Hybrid Storage**: Cloud + Local fallback
2. **Session Isolation**: WhatsApp auth stays local
3. **Worker Threads**: Browser runs separately from UI
4. **Error Logging**: All errors logged to file
5. **Production Chromium**: Dynamically detected and bundled

---

**Built for production. Ready to scale. Secure by design.**
