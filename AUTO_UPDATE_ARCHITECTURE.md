# 📊 AUTO-UPDATE ARCHITECTURE & WORKFLOW

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SAMBAD APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐         │
│  │  Renderer Process │◄──────►│   Main Process   │         │
│  │                   │        │                  │         │
│  │  - Update UI      │        │  - autoUpdater   │         │
│  │  - User Actions   │        │  - IPC Handlers  │         │
│  └──────────────────┘        │  - File System   │         │
│          ▲                    └──────────────────┘         │
│          │                             ▲                    │
│          │                             │                    │
│          │    IPC Communication        │                    │
│          │                             │                    │
│          └─────────────────────────────┘                    │
│                                                              │
└──────────────────────────────────────────┬──────────────────┘
                                            │
                                            │ HTTPS
                                            │
                                            ▼
                          ┌─────────────────────────────────┐
                          │       GITHUB RELEASES           │
                          │                                 │
                          │  - Sambad Setup 1.0.0.exe      │
                          │  - latest.yml                   │
                          │  - Release Notes                │
                          └─────────────────────────────────┘
```

---

## Update Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INSTALLS v1.0.0                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APP STARTS & RUNS                             │
│                                                                  │
│  After 5 seconds:                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Auto-Updater checks GitHub for new versions        │      │
│  │  GET https://github.com/user/sambad/releases/latest │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │  New version found?   │
                   └───────────┬───────────┘
                               │
                ┌──── NO ──────┴────── YES ──────┐
                │                                 │
                ▼                                 ▼
    ┌──────────────────────┐      ┌──────────────────────────┐
    │ "No update available"│      │  Dialog: "Update to v1.0.1│
    │  (Silent)            │      │   available. Download?"   │
    └──────────────────────┘      └────────────┬──────────────┘
                                               │
                                    ┌─── NO ───┴─── YES ───┐
                                    │                       │
                                    ▼                       ▼
                        ┌────────────────────┐  ┌─────────────────────┐
                        │  User postponed    │  │  Download starts    │
                        │  (Check again in   │  │  (Shows progress)   │
                        │   4 hours)         │  │                     │
                        └────────────────────┘  └──────────┬──────────┘
                                                           │
                                                           ▼
                                            ┌──────────────────────────┐
                                            │  Download complete       │
                                            │  Dialog: "Restart now?"  │
                                            └────────────┬─────────────┘
                                                         │
                                              ┌── NO ────┴─── YES ───┐
                                              │                       │
                                              ▼                       ▼
                                  ┌────────────────────┐  ┌──────────────────┐
                                  │ Install on next    │  │ Quit & Install   │
                                  │ app quit           │  │ (Restarts app)   │
                                  └────────────────────┘  └──────────┬───────┘
                                                                     │
                                                                     ▼
                                                        ┌────────────────────┐
                                                        │ App restarts with  │
                                                        │ v1.0.1 installed! ✅│
                                                        └────────────────────┘
```

---

## File Structure

```
sambad/
├── electron/
│   └── main/
│       ├── index.ts              ← Initializes auto-updater (DONE ✅)
│       ├── autoUpdater.ts        ← Update logic & events (DONE ✅)
│       └── ipc.ts                ← IPC handlers (DONE ✅)
│
├── electron/preload/
│   └── index.ts                  ← Exposes update APIs (DONE ✅)
│
├── package.json                  ← Publish config (NEEDS USERNAME ⚠️)
│
├── dist/                         ← Build output
│   ├── Sambad Setup 1.0.0.exe   (after build)
│   └── latest.yml               (after build)
│
└── GitHub Releases/              ← Hosted on GitHub
    └── v1.0.0/
        ├── Sambad Setup 1.0.0.exe
        └── latest.yml
```

---

## Key Components

### 1. **autoUpdater.ts** (IMPLEMENTED ✅)
- Configures `electron-updater`
- Listens for update events
- Shows dialogs to user
- Manages download & install

### 2. **Main Process (index.ts)** (INTEGRATED ✅)
- Initializes auto-updater
- Checks for updates every 4 hours
- Only runs in production mode

### 3. **IPC Handlers (ipc.ts)** (ADDED ✅)
- `updater:check` - Manual update check
- `updater:download` - Download update
- `updater:install` - Install update

### 4. **Preload (index.ts)** (EXPOSED ✅)
- Exposes safe APIs to renderer
- Event listeners for update states
- Type-safe interface

### 5. **package.json** (CONFIGURED ⚠️)
```json
{
  "publish": [{
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",  ← CHANGE THIS
    "repo": "sambad",
    "private": false
  }]
}
```

---

## Update Check Schedule

```
App Start ─────────► Check for updates (after 5 seconds)
                              │
                              ▼
                     ┌────────────────┐
                     │  Every 4 hours │ ◄──┐
                     └────────┬───────┘    │
                              │            │
                              └────────────┘
                     (Automatic background check)
```

---

## Version Management

### Semantic Versioning (MAJOR.MINOR.PATCH)

```
1.0.0  →  1.0.1  →  1.0.2  →  1.1.0  →  2.0.0
  │         │         │         │         │
  │         │         │         │         └─ Breaking changes
  │         │         │         └─────────── New features
  │         │         └───────────────────── Bug fixes
  │         └─────────────────────────────── Bug fixes
  └───────────────────────────────────────── Initial release
```

### When to Increment:

- **PATCH (1.0.0 → 1.0.1)** - Bug fixes, minor updates
- **MINOR (1.0.0 → 1.1.0)** - New features, backwards compatible
- **MAJOR (1.0.0 → 2.0.0)** - Breaking changes, major redesign

---

## Update Metadata (latest.yml)

```yaml
version: 1.0.1
files:
  - url: Sambad Setup 1.0.1.exe
    sha512: 7Bd5OaXf...
    size: 125829120
path: Sambad Setup 1.0.1.exe
sha512: 7Bd5OaXf...
releaseDate: '2025-12-30T04:00:00.000Z'
```

**This file tells the app:**
- Latest available version
- Download URL
- File checksum (for security)
- Release date

---

## Security Features

### Built-in Security:
1. ✅ **HTTPS Only** - All downloads via secure GitHub
2. ✅ **SHA-512 Checksum** - Verifies file integrity
3. ✅ **Code Signing** - (Optional, requires certificate)
4. ✅ **Automatic Verification** - electron-updater validates

### Best Practices:
- Never commit GitHub token to repository
- Use environment variables for secrets
- Keep token secure (regenerate if leaked)
- Enable 2FA on GitHub account

---

## Production vs Development

| Feature | Development | Production |
|---------|------------|------------|
| Auto-updater | ❌ Disabled | ✅ Enabled |
| Update checks | ❌ Never | ✅ Every 4 hours |
| GitHub uploads | ❌ No | ✅ Yes |
| Error dialogs | ❌ Console only | ✅ User-facing |

**Detection:**
```typescript
if (app.isPackaged) {
  // Production mode - auto-updater enabled
} else {
  // Development mode - auto-updater disabled
}
```

---

## Event Flow

### Main → Renderer Events:

```
Main Process                    Renderer Process
────────────                    ────────────────
update-available     ─────►     onUpdateAvailable()
update-not-available ─────►     onUpdateNotAvailable()
download-progress    ─────►     onDownloadProgress()
update-downloaded    ─────►     onUpdateDownloaded()
update-error         ─────►     onUpdateError()
```

### Renderer → Main Commands:

```
Renderer Process                Main Process
────────────────                ────────────
checkForUpdates()    ─────►     updater:check
downloadUpdate()     ─────►     updater:download
installUpdate()      ─────►     updater:install
```

---

## Logs & Monitoring

### Log Locations:

**Windows:**
```
C:\Users\{username}\AppData\Roaming\Sambad\logs\main.log
```

**What's logged:**
- Update check attempts
- Update availability
- Download progress
- Installation status
- Errors & failures

### Example Log:

```
[2025-12-30 09:00:00] [info] Checking for updates...
[2025-12-30 09:00:02] [info] Update available: 1.0.1
[2025-12-30 09:00:05] [info] User chose to download update
[2025-12-30 09:00:45] [info] Download progress: 100%
[2025-12-30 09:00:46] [info] Update downloaded: 1.0.1
[2025-12-30 09:00:50] [info] Installing update and restarting...
```

---

## Common Scenarios

### Scenario 1: User Opens App (Update Available)
```
1. App starts
2. Auto-updater checks GitHub (5 sec delay)
3. Finds v1.0.1 (currently on v1.0.0)
4. Shows dialog: "Update available. Download?"
5. User clicks "Download"
6. Progress bar shows download
7. Dialog: "Update ready. Restart?"
8. User clicks "Restart Now"
9. App quits, installs update, restarts
10. Now running v1.0.1 ✅
```

### Scenario 2: User Opens App (No Update)
```
1. App starts
2. Auto-updater checks GitHub
3. Current version is latest
4. Silent (no dialog shown)
5. User continues normally
```

### Scenario 3: User Postpones Update
```
1. Update available dialog shown
2. User clicks "Later"
3. App continues normally
4. Update will be installed on next app quit
   OR
   Dialog shown again in 4 hours
```

---

## Testing Checklist

### Before First Release:
- [ ] GitHub username updated in package.json
- [ ] GitHub token generated and set
- [ ] Repository exists and accessible
- [ ] Build runs successfully
- [ ] Installer launches and installs

### For Update Testing:
- [ ] v1.0.0 installed and running
- [ ] v1.0.1 built and published to GitHub
- [ ] Update dialog appears
- [ ] Download completes
- [ ] Restart installs update
- [ ] v1.0.1 runs successfully
- [ ] Version change visible

---

## Quick Commands Reference

```bash
# Check if dependencies installed
npm list electron-updater electron-builder

# Set GitHub token (PowerShell)
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"

# Build for Windows (publish to GitHub)
npm run dist:win -- --publish always

# Build without publishing
npm run dist:win

# View logs (Windows)
type "%APPDATA%\Sambad\logs\main.log"

# Check current version
npm version

# Bump version (patch)
npm version patch
# This changes 1.0.0 → 1.0.1
```

---

## Remember

1. **Version in package.json** must be HIGHER than current release
2. **GitHub token** expires - regenerate if needed
3. **latest.yml** MUST be in GitHub release
4. **Auto-updater only works** in production (packaged app)
5. **First install** requires manual download from GitHub

---

**You're all set! Follow AUTO_UPDATE_SETUP_GUIDE.md for step-by-step implementation.**
