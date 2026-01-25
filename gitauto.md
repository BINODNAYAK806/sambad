# Auto-Update Implementation Guide

This document provides a complete step-by-step plan for implementing auto-update functionality in your Electron application using `electron-updater` and GitHub Releases.

---

## Prerequisites

- GitHub repository for your project
- GitHub account with repository access
- Node.js and npm installed
- Electron application ready for production

---

## Step 1: Install Dependencies

Install the `electron-updater` package:

```bash
npm install electron-updater
```

---

## Step 2: Configure package.json

Add the following configuration to your `package.json`:

```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "Your App Name",
    "publish": [
      {
        "provider": "github",
        "owner": "your-github-username",
        "repo": "your-repo-name",
        "private": false
      }
    ],
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

**Key Points:**
- Set `private: true` if your repository is private
- Update `owner` and `repo` with your GitHub details
- Ensure `version` follows semantic versioning (X.Y.Z)

---

## Step 3: Create Auto-Updater Module

Create a new file `electron/main/autoUpdater.ts`:

```typescript
import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Configure logging
log.transports.file.level = 'info'
autoUpdater.logger = log

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Check for updates on app start (after 3 seconds)
  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 3000)

  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 4 * 60 * 60 * 1000)

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info)
    mainWindow.webContents.send('update-available', info)
  })

  // Event: Update not available
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info)
    mainWindow.webContents.send('update-not-available', info)
  })

  // Event: Download progress
  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress)
    mainWindow.webContents.send('download-progress', progress)
  })

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info)
    mainWindow.webContents.send('update-downloaded', info)
  })

  // Event: Error
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error)
    mainWindow.webContents.send('update-error', error)
  })
}

// IPC handlers for manual update checks
export function setupUpdateHandlers(): void {
  const { ipcMain } = require('electron')

  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result
    } catch (error) {
      log.error('Error checking for updates:', error)
      throw error
    }
  })

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (error) {
      log.error('Error downloading update:', error)
      throw error
    }
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}
```

---

## Step 4: Integrate Auto-Updater in Main Process

Update your `electron/main/index.ts`:

```typescript
import { app, BrowserWindow } from 'electron'
import { initAutoUpdater, setupUpdateHandlers } from './autoUpdater'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load your app
  mainWindow.loadURL(/* your URL */)

  // Initialize auto-updater only in production
  if (!app.isPackaged) {
    console.log('Development mode - auto-updater disabled')
  } else {
    initAutoUpdater(mainWindow)
    setupUpdateHandlers()
  }
}

app.whenReady().then(createWindow)
```

---

## Step 5: Add IPC Types to Preload

Update your `electron/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Existing APIs...
  
  // Auto-updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
  },
  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_, info) => callback(info))
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
  },
  onUpdateError: (callback: (error: any) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error))
  }
})
```

---

## Step 6: Create Update Component (Frontend)

Create `src/renderer/components/UpdateNotification.tsx`:

```typescript
import React, { useEffect, useState } from 'react'

interface UpdateInfo {
  version: string
}

interface ProgressInfo {
  percent: number
  transferred: number
  total: number
}

export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    // Listen for update events
    window.electron.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateAvailable(true)
      setUpdateInfo(info)
    })

    window.electron.onDownloadProgress((progress: ProgressInfo) => {
      setDownloading(true)
      setDownloadProgress(Math.round(progress.percent))
    })

    window.electron.onUpdateDownloaded(() => {
      setDownloading(false)
      setUpdateReady(true)
    })

    window.electron.onUpdateError((error: any) => {
      console.error('Update error:', error)
      setDownloading(false)
    })
  }, [])

  const handleDownload = async () => {
    try {
      await window.electron.downloadUpdate()
    } catch (error) {
      console.error('Failed to download update:', error)
    }
  }

  const handleInstall = () => {
    window.electron.installUpdate()
  }

  if (updateReady) {
    return (
      <div className="update-notification success">
        <p>✅ Update ready to install! The app will restart.</p>
        <button onClick={handleInstall}>Restart and Install</button>
      </div>
    )
  }

  if (downloading) {
    return (
      <div className="update-notification downloading">
        <p>⏳ Downloading update... {downloadProgress}%</p>
        <progress value={downloadProgress} max={100} />
      </div>
    )
  }

  if (updateAvailable) {
    return (
      <div className="update-notification available">
        <p>🎉 New version {updateInfo?.version} available!</p>
        <button onClick={handleDownload}>Download Update</button>
      </div>
    )
  }

  return null
}
```

---

## Step 7: Generate GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Give it a name: "Electron Auto-Update"
4. Select scopes:
   - ✅ `repo` (all sub-scopes)
5. Click **Generate token**
6. **Copy the token immediately** (you won't see it again)

---

## Step 8: Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:GH_TOKEN = "your-github-token-here"
```

**Windows (Command Prompt):**
```cmd
set GH_TOKEN=your-github-token-here
```

**Linux/Mac:**
```bash
export GH_TOKEN=your-github-token-here
```

**Permanent (add to `.env` file):**
```
GH_TOKEN=your-github-token-here
```

---

## Step 9: Build and Publish First Release

### 9.1 Update Version Number

Update `version` in `package.json`:
```json
{
  "version": "1.0.0"
}
```

### 9.2 Build the Application

**For Windows:**
```bash
npm run build
npm run dist:win
```

**For Mac:**
```bash
npm run build
npm run dist:mac
```

**For Linux:**
```bash
npm run build
npm run dist:linux
```

### 9.3 Verify Build Output

Check the `dist` folder for:
- `.exe` installer (Windows)
- `.dmg` or `.app` (Mac)
- `.AppImage` or `.deb` (Linux)
- `latest.yml` (metadata file)

---

## Step 10: Create GitHub Release

### Option A: Automatic (electron-builder will create release)

Just run:
```bash
npm run dist:win -- --publish always
```

This will:
- Build the app
- Create a GitHub release with the version number
- Upload the installer files

### Option B: Manual

1. Go to your GitHub repository
2. Click **Releases** → **Create a new release**
3. Tag version: `v1.0.0` (must match package.json version)
4. Release title: `Version 1.0.0`
5. Description: List of changes
6. Upload files from `dist/`:
   - `.exe` installer
   - `latest.yml`
7. Click **Publish release**

---

## Step 11: Testing Auto-Update

### 11.1 Install Version 1.0.0
- Install the application from the GitHub release
- Launch it

### 11.2 Create Version 1.0.1
1. Update `package.json` version to `1.0.1`
2. Make some visible change (e.g., update UI text)
3. Build and publish:
   ```bash
   npm run dist:win -- --publish always
   ```

### 11.3 Verify Update Flow
1. Launch version 1.0.0
2. Wait 3-10 seconds (auto-updater checks on startup)
3. You should see update notification
4. Click "Download Update"
5. Wait for download to complete
6. Click "Restart and Install"
7. App should restart with version 1.0.1

---

## Step 12: Monitoring and Logs

### Where to Find Logs

**Windows:**
```
%APPDATA%\<app-name>\logs\main.log
```

**Mac:**
```
~/Library/Logs/<app-name>/main.log
```

**Linux:**
```
~/.config/<app-name>/logs/main.log
```

### What to Look For
- "Checking for updates..."
- "Update available: 1.0.1"
- "Update downloaded"
- Any errors

---

## Troubleshooting

### Issue: "No updates available" when update exists

**Solutions:**
- Verify `version` in package.json is lower than GitHub release
- Check `latest.yml` is uploaded to GitHub release
- Ensure GitHub token has correct permissions
- Check app is in production mode (not development)

### Issue: Update downloads but doesn't install

**Solutions:**
- Ensure `autoInstallOnAppQuit = true` is set
- Check NSIS installer settings in package.json
- Verify user has write permissions to install directory

### Issue: "Cannot find channel file"

**Solutions:**
- Ensure `latest.yml` is in the GitHub release
- Check `publish` configuration in package.json
- Verify repository owner and name are correct

### Issue: Private repository updates fail

**Solutions:**
- Ensure `GH_TOKEN` environment variable is set
- Set `"private": true` in publish configuration
- Verify token has `repo` scope

---

## Security Best Practices

1. **Never commit GitHub token** to repository
2. **Use environment variables** for sensitive data
3. **Enable code signing** for production releases
4. **Verify update signatures** (electron-updater does this automatically)
5. **Use HTTPS** for all update channels
6. **Test updates thoroughly** before releasing to users

---

## Continuous Deployment (Optional)

### Using GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npm run build
          npm run dist:win -- --publish always
```

**To trigger:**
```bash
git tag v1.0.1
git push origin v1.0.1
```

---

## Summary Checklist

- [ ] Installed `electron-updater`
- [ ] Configured `package.json` with publish settings
- [ ] Created `autoUpdater.ts` module
- [ ] Integrated auto-updater in main process
- [ ] Added IPC handlers to preload
- [ ] Created update UI component
- [ ] Generated GitHub personal access token
- [ ] Set `GH_TOKEN` environment variable
- [ ] Built first release (v1.0.0)
- [ ] Created GitHub release with installer files
- [ ] Tested update flow with v1.0.1
- [ ] Verified logs and monitoring
- [ ] Documented release process

---

## Version Release Workflow

**For every new version:**

1. Update `version` in `package.json`
2. Update `CHANGELOG.md` with changes
3. Commit changes: `git commit -am "Release v1.x.x"`
4. Create git tag: `git tag v1.x.x`
5. Push with tags: `git push origin main --tags`
6. Build and publish: `npm run dist:win -- --publish always`
7. Verify release appears on GitHub
8. Test update on installed app

---

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
- [Code Signing Guide](https://www.electron.build/code-signing)

---

**Last Updated:** 2025-12-30
