# 🚀 AUTO-UPDATE SETUP - COMPLETE INSTALLATION GUIDE

## ✅ PROGRESS STATUS

### What's Already Done:
1. ✅ `electron-updater` package installed
2. ✅ `package.json` publish configuration set up
3. ✅ Auto-updater module created (`autoUpdater.ts`)
4. ✅ Auto-updater integrated in main process
5. ✅ Preload APIs added for update functions
6. ✅ IPC handlers registered

### What YOU Need to Do:
1. 🔧 Update GitHub username in `package.json`
2. 🔑 Generate GitHub Personal Access Token
3. 📦 Build and publish first release
4. 🧪 Test the auto-update functionality

---

## STEP 1: Update GitHub Username in package.json

### Action Required:
Open `package.json` and find line 132:

```json
"owner": "YOUR_GITHUB_USERNAME",
```

**Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.**

For example:
```json
"owner": "johnsmith",
```

**Important:** Make sure this matches your GitHub username exactly!

---

## STEP 2: Generate GitHub Personal Access Token

### Why do you need this?
The token allows `electron-builder` to upload your app releases to GitHub automatically.

### Steps:

1. **Go to GitHub Settings**
   - Open: https://github.com/settings/tokens
   - Or: GitHub.com → Your Profile Picture → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Click "Generate new token (classic)"**

3. **Configure Token:**
   - **Note:** `Sambad Auto-Update Token`
   - **Expiration:** Choose "No expiration" or custom date
   - **Select scopes:** Check ✅ **`repo`** (this includes all sub-scopes)

4. **Click "Generate token"**

5. **IMPORTANT: Copy the token immediately!**
   - It looks like: `GITHUB_TOKEN_PLACEHOLDER`
   - You won't be able to see it again!
   - Save it somewhere safe (you'll use it in Step 3)

---

## STEP 3: Set Environment Variable with Token

### Windows (PowerShell):

```powershell
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
```

### Windows (Command Prompt):

```cmd
set GH_TOKEN=GITHUB_TOKEN_PLACEHOLDER
```

### To Make it Permanent (Windows):

1. Open Environment Variables:
   - Press `Win + X` → System → Advanced system settings → Environment Variables
2. Under "User variables", click "New"
3. Variable name: `GH_TOKEN`
4. Variable value: `GITHUB_TOKEN_PLACEHOLDER`
5. Click OK

**OR create a `.env` file in your project root:**

```env
GH_TOKEN=GITHUB_TOKEN_PLACEHOLDER
```

### Verify it's set:

```powershell
echo $env:GH_TOKEN
```

You should see your token.

---

## STEP 4: Ensure You Have a GitHub Repository

### Check:
- Do you have a GitHub repository for this project?
- Is it named `sambad` (or update the `repo` name in package.json)?
- Is your repository public or private?

If **private**, update `package.json` line 134:
```json
"private": true
```

If **public**, it should be:
```json
"private": false
```

---

## STEP 5: Build Your First Release (v1.0.0)

### Before building:

1. **Verify version in package.json:**
   ```json
   "version": "1.0.0"
   ```

2. **Ensure you have committed all changes:**
   ```bash
   git add .
   git commit -m "Release v1.0.0 - Auto-update enabled"
   git push origin main
   ```

### Build the Application:

```powershell
# Make sure GH_TOKEN is set
echo $env:GH_TOKEN

# Build and publish to GitHub (Windows)
npm run dist:win -- --publish always
```

**This command will:**
- Build your Electron app
- Create a Windows installer (.exe)
- Create `latest.yml` (update metadata file)
- Upload everything to GitHub Releases
- Create a new release tagged as `v1.0.0`

### What to Expect:

- **Build time:** 5-15 minutes (first time)
- **Output location:** `dist/` folder
- **GitHub Release:** Automatically created

---

## STEP 6: Verify GitHub Release

1. **Go to your GitHub repository**
2. **Click on "Releases"** (right side)
3. **You should see:** `v1.0.0` release
4. **Files uploaded:**
   - `Sambad Setup 1.0.0.exe` (your installer)
   - `latest.yml` (update metadata)

**If you see these files, congratulations! ✅ Your first release is ready!**

---

## STEP 7: Install and Test v1.0.0

### Install the App:

1. **Download** `Sambad Setup 1.0.0.exe` from GitHub Releases
2. **Run the installer**
3. **Install the application**
4. **Launch Sambad**

### Verify Auto-Updater is Working:

- **Check console logs** (if DevTools are open):
  - `[Sambad] Initializing auto-updater...`
  - `[Sambad] Checking for updates...`
  - `Update not available` or `Update available`

---

## STEP 8: Test Update Flow (v1.0.1)

Now let's test if updates actually work!

### 8.1 Make a Visible Change

Edit any UI file to make a visible change. For example:

**`src/renderer/pages/Dashboard.tsx`:**
```tsx
<h1>Sambad Dashboard - v1.0.1 Update Test</h1>
```

### 8.2 Update Version Number

**`package.json`:**
```json
"version": "1.0.1"
```

### 8.3 Commit Changes

```bash
git add .
git commit -m "Release v1.0.1 - Update test"
git push origin main
```

### 8.4 Build and Publish v1.0.1

```powershell
npm run dist:win -- --publish always
```

### 8.5 Test Auto-Update

1. **Keep v1.0.0 app running** (don't close it)
2. **Wait 3-10 seconds** (auto-updater checks on startup)
3. **You should see a dialog:** "A new version (1.0.1) is available..."
4. **Click "Download"**
5. **Wait for download to complete**
6. **Dialog appears:** "Update ready. Restart now?"
7. **Click "Restart Now"**
8. **App restarts with v1.0.1**
9. **Verify your change is visible** ✅

---

## STEP 9: Optional - Create Update Button in UI

Want users to manually check for updates? Add this component:

### Create `src/renderer/components/UpdateButton.tsx`:

```tsx
import React, { useEffect, useState } from 'react';

export const UpdateButton: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for update events
    window.electronAPI.updater.onUpdateAvailable((info: any) => {
      setUpdateAvailable(true);
      setChecking(false);
    });

    window.electronAPI.updater.onDownloadProgress((progressInfo: any) => {
      setDownloading(true);
      setProgress(progressInfo.percent);
    });

    window.electronAPI.updater.onUpdateDownloaded(() => {
      setDownloading(false);
      // Dialog will show automatically
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      await window.electronAPI.updater.checkForUpdates();
    } catch (error) {
      console.error('Update check failed:', error);
      setChecking(false);
    }
  };

  return (
    <button 
      onClick={handleCheckUpdates}
      disabled={checking || downloading}
      className="update-button"
    >
      {checking && 'Checking for updates...'}
      {downloading && `Downloading ${progress}%...`}
      {!checking && !downloading && 'Check for Updates'}
    </button>
  );
};
```

---

## TROUBLESHOOTING

### ❌ "Cannot find latest.yml"

**Solution:**
- Ensure `--publish always` flag is used
- Check GitHub release has `latest.yml` file
- Verify `package.json` publish config is correct

### ❌ "Update check never runs"

**Solution:**
- Only works in **production** (packaged app)
- Check if `app.isPackaged` is true
- Look for logs: `Auto-updater disabled in development mode`

### ❌ "GitHub upload fails"

**Solution:**
- Verify `GH_TOKEN` is set correctly
- Check token has `repo` scope
- Ensure repository name matches package.json

### ❌ "Update downloads but doesn't install"

**Solution:**
- Check NSIS settings in package.json
- Ensure user has admin permissions
- Look for error logs in app data folder

---

## LOGS & DEBUGGING

### Where to find logs:

**Windows:**
```
%APPDATA%\Sambad\logs\main.log
```

**What to look for:**
- `Checking for updates...`
- `Update available: 1.0.1`
- `Update downloaded`
- `Installing update...`

---

## VERSION RELEASE WORKFLOW

**For every new version:**

1. Make your changes
2. Update `version` in `package.json` (e.g., `1.0.2`)
3. Commit: `git commit -am "Release v1.0.2"`
4. Push: `git push origin main`
5. Build & Publish: `npm run dist:win -- --publish always`
6. Test on existing installed app
7. Verify update appears and installs

---

## SUMMARY CHECKLIST

Before you start:
- [ ] GitHub username updated in package.json
- [ ] GitHub Personal Access Token generated
- [ ] GH_TOKEN environment variable set
- [ ] Repository exists on GitHub
- [ ] All code changes committed

Building first release:
- [ ] Version set to 1.0.0
- [ ] Build command executed successfully
- [ ] GitHub release created
- [ ] Installer and latest.yml uploaded

Testing updates:
- [ ] v1.0.0 installed and running
- [ ] v1.0.1 built and published
- [ ] Update notification appeared
- [ ] Update downloaded successfully
- [ ] App restarted with new version

---

## NEXT STEPS

1. **Complete Steps 1-3** above to set up GitHub token
2. **Run the build command** to create your first release
3. **Install and test** the update flow
4. **Share the installer** with your users!

**Your auto-update system is now fully configured and ready to use! 🎉**

---

**Need help?** Check the logs at `%APPDATA%\Sambad\logs\main.log`
