# Auto-Update Setup for Sambad

## Current Status: ⚠️ PARTIALLY CONFIGURED

✅ **What's Already Done:**
- Auto-updater code exists (`electron/main/autoUpdater.ts`)
- electron-updater package installed
- Update UI dialogs implemented
- Progress tracking configured

❌ **What's Missing:**
- Auto-updater not initialized in main process
- No publish configuration in package.json
- No update server configured

---

## 🔧 Complete Setup Required

### Step 1: Add Auto-Updater to Main Process

**File: `electron/main/index.ts`**

Add these imports at the top (after existing imports):
```typescript
import { appUpdater } from './autoUpdater.js';
```

Add this inside `app.whenReady()` callback (after `createWindow()`):
```typescript
app.whenReady().then(() => {
  // ... existing code ...
  
  const win = createWindow();
  if (win) {
    updateIpcMainWindow(win);
    
    // Initialize auto-updater
    appUpdater.setMainWindow(win);
    
    // Check for updates (only in production, not in dev)
    if (app.isPackaged) {
      // Check on startup
      setTimeout(() => {
        appUpdater.checkForUpdatesAndNotify();
      }, 5000); // Wait 5 seconds after app starts
      
      // Check every 4 hours
      setInterval(() => {
        appUpdater.checkForUpdatesAndNotify();
      }, 4 * 60 * 60 * 1000);
    }
  }
});
```

---

### Step 2: Configure Update Server

You have **3 options** for hosting updates:

#### **Option A: GitHub Releases (Free, Recommended for Open Source)**

1. Add to `package.json` build section:
```json
"build": {
  "appId": "com.sambad.whatsapp",
  "productName": "Sambad",
  "publish": {
    "provider": "github",
    "owner": "your-github-username",
    "repo": "sambad"
  },
  // ... rest of config
}
```

2. Generate GitHub token:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (all)
   - Copy token

3. Set environment variable:
   ```bash
   set GH_TOKEN=your_github_token_here
   ```

4. Publish release:
   ```bash
   npm run dist:win
   # Then upload the .exe and .yml files to GitHub releases
   ```

#### **Option B: Custom Server (Recommended for Production)**

1. Add to `package.json`:
```json
"build": {
  "publish": {
    "provider": "generic",
    "url": "https://your-domain.com/updates"
  }
}
```

2. After building, upload these files to your server:
   - `Sambad Setup X.X.X.exe`
   - `latest.yml`

3. Server directory structure:
   ```
   https://your-domain.com/updates/
   ├── latest.yml
   └── Sambad-Setup-1.0.0.exe
   ```

#### **Option C: AWS S3 (Scalable)**

```json
"build": {
  "publish": {
    "provider": "s3",
    "bucket": "your-bucket-name",
    "region": "us-east-1"
  }
}
```

---

### Step 3: Update package.json Version

Before each release, update version in `package.json`:
```json
{
  "version": "1.0.1"  // Increment for each release
}
```

---

### Step 4: Build and Publish

```bash
# Build with publish configuration
npm run dist:win

# For GitHub releases, also run:
npx electron-builder --win --publish always
```

---

## 🎯 How It Works (Once Set Up)

### User Experience:
1. User opens app
2. After 5 seconds, app checks for updates silently
3. If update available:
   - Shows dialog: "A new version (X.X.X) is available. Download now?"
   - User clicks "Download" → download starts with progress bar
   - When complete: "Update ready. Restart now?"
   - User clicks "Restart Now" → app restarts with new version

### Auto-check Schedule:
- ✅ On app startup (5 seconds delay)
- ✅ Every 4 hours while app is running
- ✅ Manual check via menu (if you add it)

---

## 📋 Quick Setup Checklist

For **minimum viable setup** (no auto-update):
- ✅ Just distribute new .exe files to users
- ✅ Users manually uninstall old version and install new

For **GitHub Releases** (free):
1. [ ] Add auto-updater init to `index.ts`
2. [ ] Add publish config to `package.json`
3. [ ] Generate GitHub token
4. [ ] Build and publish to GitHub
5. [ ] Create GitHub release with files

For **Custom Server**:
1. [ ] Add auto-updater init to `index.ts`
2. [ ] Add publish config with your URL
3. [ ] Set up web server to host files
4. [ ] Build and upload .exe + .yml to server

---

## 🧪 Testing Auto-Update

### Local Testing:
1. Build version 1.0.0
2. Install it
3. Change version to 1.0.1 in package.json
4. Build version 1.0.1
5. Host 1.0.1 files on update server
6. Open 1.0.0 app → should detect and offer update

### Production Testing:
1. Release v1.0.0 to users
2. Build v1.0.1 and publish
3. Users should get update notification within 4 hours

---

## ⚙️ Advanced Configuration

### Disable Auto-Download (User Chooses):
```typescript
autoUpdater.autoDownload = false; // Already set in your code ✓
```

### Auto-Install on Quit:
```typescript
autoUpdater.autoInstallOnAppQuit = true; // Already set ✓
```

### Custom Update Check Interval:
```typescript
// Check every 24 hours instead of 4
setInterval(() => {
  appUpdater.checkForUpdatesAndNotify();
}, 24 * 60 * 60 * 1000);
```

---

## 🚀 Recommended Approach for Your App

**For MVP / Initial Release:**
```
Skip auto-update for now
→ Manually distribute new .exe files
→ Users uninstall old, install new
```

**For Production / Long-term:**
```
1. Set up GitHub Releases (free)
2. Add auto-updater init to main process
3. Configure publish in package.json
4. Build with: npx electron-builder --win --publish always
```

---

## 📂 Required Files for Updates

After building, you need these files on your update server:

```
latest.yml          # Contains version info and checksums
Sambad-Setup-1.0.0.exe   # The installer
```

Example `latest.yml`:
```yaml
version: 1.0.0
files:
  - url: Sambad-Setup-1.0.0.exe
    sha512: [checksum]
    size: 1700000000
path: Sambad-Setup-1.0.0.exe
sha512: [checksum]
releaseDate: '2025-12-29T12:00:00.000Z'
```

This file is **auto-generated** by electron-builder.

---

## 🎯 Summary

**Current Status:**
- ✅ Auto-updater code ready
- ❌ Not initialized in main process
- ❌ No publish configuration
- ❌ No update server

**To Enable:**
1. Add initialization code to `index.ts` (see Step 1)
2. Choose update server (GitHub/Custom/S3)
3. Add publish config to `package.json`
4. Build and publish updates

**For Now:**
- Your app works perfectly without auto-update
- You can manually distribute new versions
- Auto-update can be added later without breaking existing installations
