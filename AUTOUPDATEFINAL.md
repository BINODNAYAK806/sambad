# Auto-Update Implementation Guide - Complete Foolproof Plan

## 🎯 Objective
After initial installation, users should receive automatic software updates with ZERO manual intervention.

---

## 📋 Table of Contents
1. [How Auto-Update Works](#how-auto-update-works)
2. [Prerequisites](#prerequisites)
3. [Initial Setup (One-Time)](#initial-setup-one-time)
4. [Build & Release Process](#build--release-process)
5. [End-User Experience](#end-user-experience)
6. [Testing Strategy](#testing-strategy)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## 🔄 How Auto-Update Works

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│  User's Computer                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Sambad App (v1.0.0)                                  │   │
│  │                                                      │   │
│  │ Every 4 hours:                                       │   │
│  │ 1. Check GitHub Releases                            │   │
│  │ 2. Compare versions                                  │   │
│  │ 3. Download if newer version exists                 │   │
│  │ 4. Install on next app restart                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│                    [HTTPS Request]                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  GitHub Releases (Public)                                   │
│  https://github.com/YOUR-USERNAME/sambad/releases           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ v1.0.1 (Latest)                                      │   │
│  │   - Sambad-Setup-1.0.1.exe                          │   │
│  │   - latest.yml (metadata)                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ v1.0.0                                               │   │
│  │   - Sambad-Setup-1.0.0.exe                          │   │
│  │   - latest.yml                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Update Flow
1. **Automatic Check**: App checks for updates every 4 hours + on startup (after 5 seconds)
2. **Download**: If update available, downloads in background
3. **Notify User**: Shows dialog: "Update ready. Restart now?"
4. **Install**: On user approval, app restarts and installs update
5. **Seamless**: User data and settings are preserved

---

## ✅ Prerequisites

### 1. GitHub Repository Setup
- **Visibility**: Repository must be PUBLIC (or configure private releases)
- **Releases**: Must be enabled in repository settings
- **Assets**: Releases must contain installer files

### 2. Package.json Configuration
**Already configured in your project:**
```json
{
  "name": "sambad",
  "version": "1.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-USERNAME/sambad.git"
  }
}
```

⚠️ **ACTION REQUIRED**: Replace `YOUR-USERNAME` with your actual GitHub username

### 3. electron-builder Configuration
**Already configured in `package.json`:**
```json
{
  "build": {
    "appId": "com.sambad.app",
    "productName": "Sambad",
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR-USERNAME",
        "repo": "sambad"
      }
    ]
  }
}
```

⚠️ **ACTION REQUIRED**: Replace `YOUR-USERNAME` with your actual GitHub username

### 4. GitHub Personal Access Token
**Purpose**: Allows electron-builder to upload releases to GitHub

**How to Create:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Sambad Auto-Update Token`
4. Expiration: Select "No expiration" or "1 year"
5. Scopes: Check `repo` (Full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again)

**How to Use:**
- Save as environment variable: `GH_TOKEN=your_token_here`
- Add to `.env` file (DO NOT commit this file!)

```env
GH_TOKEN=GITHUB_TOKEN_PLACEHOLDER
```

---

## 🚀 Initial Setup (One-Time)

### Step 1: Enable Auto-Updater Code
**File**: `electron/main/index.ts`

**Current Status**: Auto-updater is temporarily disabled

**To Enable:**
1. Uncomment line 11:
   ```typescript
   import { appUpdater } from './autoUpdater.js';
   ```

2. Uncomment lines 232-250 (auto-updater initialization)

### Step 2: Fix electron-updater Import
**File**: `electron/main/autoUpdater.ts`

**Current Status**: Fixed (using default import syntax)

**Verify it looks like this:**
```typescript
import updater from 'electron-updater';
const { autoUpdater } = updater;
```

### Step 3: Configure Repository
**File**: `package.json`

**Update these fields:**
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR-USERNAME/sambad.git"
  },
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR-USERNAME",
        "repo": "sambad"
      }
    ]
  }
}
```

### Step 4: Create .env File
**File**: `.env` (in root directory)

**Content:**
```env
GH_TOKEN=GITHUB_TOKEN_PLACEHOLDER
```

**Add to .gitignore:**
```gitignore
.env
.env.local
.env.*.local
```

---

## 🏗️ Build & Release Process

### Step-by-Step Release Workflow

#### **Phase 1: Update Version**
1. **Update package.json version:**
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Update changelog** (create CHANGELOG.md if needed):
   ```markdown
   # Changelog
   
   ## [1.0.1] - 2025-12-29
   ### Added
   - Auto-update functionality
   - Staff privacy controls
   
   ### Fixed
   - Phone number masking in campaigns
   - Groups page refresh issue
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "chore: Bump version to 1.0.1"
   git push origin main
   ```

#### **Phase 2: Build Installer**
1. **Set environment variable (Windows):**
   ```powershell
   $env:GH_TOKEN="GITHUB_TOKEN_PLACEHOLDER"
   ```

2. **Clean previous builds:**
   ```bash
   npm run clean
   # Or manually delete: dist/, dist-electron/, release/
   ```

3. **Build for Windows:**
   ```bash
   npm run build
   npm run dist
   ```

4. **Verify build output:**
   ```
   release/
   ├── Sambad-Setup-1.0.1.exe     ✓ Main installer
   ├── latest.yml                  ✓ Update metadata
   └── builder-debug.yml           (ignore)
   ```

#### **Phase 3: Publish to GitHub**
**Option A: Automatic (Recommended)**
```bash
npm run publish
```
This will:
- Build the app
- Create a GitHub release
- Upload installer files
- Upload latest.yml metadata

**Option B: Manual Upload**
1. Go to: https://github.com/YOUR-USERNAME/sambad/releases
2. Click "Draft a new release"
3. Tag version: `v1.0.1`
4. Release title: `Sambad v1.0.1`
5. Description: Copy from CHANGELOG.md
6. Upload files:
   - `Sambad-Setup-1.0.1.exe`
   - `latest.yml`
7. Click "Publish release"

#### **Phase 4: Verify Release**
1. **Check GitHub:**
   - Visit: https://github.com/YOUR-USERNAME/sambad/releases
   - Verify files are uploaded
   - Verify `latest.yml` is present

2. **Verify latest.yml content:**
   ```yaml
   version: 1.0.1
   files:
     - url: Sambad-Setup-1.0.1.exe
       sha512: <hash>
       size: <bytes>
   path: Sambad-Setup-1.0.1.exe
   sha512: <hash>
   releaseDate: '2025-12-29T...'
   ```

---

## 👥 End-User Experience

### Initial Installation (v1.0.0)
1. User downloads `Sambad-Setup-1.0.0.exe` from GitHub
2. Runs installer
3. App installs to `C:\Users\<Username>\AppData\Local\Programs\Sambad`
4. Desktop shortcut created
5. App launches

### First Update Check
**5 seconds after app starts:**
1. App silently checks GitHub releases
2. If no update: No notification
3. If update available: Dialog appears

### Update Available Dialog
```
┌─────────────────────────────────────────────────┐
│  ℹ️ Update Available                            │
├─────────────────────────────────────────────────┤
│  A new version (1.0.1) is available.           │
│  Would you like to download it now?            │
├─────────────────────────────────────────────────┤
│         [Later]            [Download]           │
└─────────────────────────────────────────────────┘
```

**User clicks "Later":**
- Update check happens again in 4 hours
- User can continue working

**User clicks "Download":**
- Download starts in background
- Progress bar appears in taskbar
- User can continue working during download

### Download Progress
```
Downloading update: 45% ████████░░░░░░░░
```

### Update Downloaded Dialog
```
┌─────────────────────────────────────────────────┐
│  ✅ Update Ready                                │
├─────────────────────────────────────────────────┤
│  Update 1.0.1 has been downloaded.             │
│  The application will restart to install       │
│  the update.                                    │
├─────────────────────────────────────────────────┤
│    [Restart Later]        [Restart Now]         │
└─────────────────────────────────────────────────┘
```

**User clicks "Restart Later":**
- Update installs on next app close
- User can continue working

**User clicks "Restart Now":**
1. App saves state
2. App closes
3. Installer runs silently
4. App reopens automatically
5. User sees new version

### Automatic Checks
**Schedule:**
- Every 4 hours while app is running
- 5 seconds after app starts
- All checks are silent unless update is found

**User Never Needs To:**
- ❌ Manually check for updates
- ❌ Download updates manually
- ❌ Uninstall old version
- ❌ Reinstall new version
- ❌ Reconfigure settings
- ❌ Re-enter license

**Automatic Preservation:**
- ✅ User data (database)
- ✅ Settings
- ✅ WhatsApp session
- ✅ License activation
- ✅ Supabase configuration

---

## 🧪 Testing Strategy

### Test 1: First Installation
**Goal**: Verify initial installation works

1. Uninstall any existing Sambad installation
2. Delete app data: `C:\Users\<Username>\AppData\Roaming\sambad`
3. Install `Sambad-Setup-1.0.0.exe`
4. Launch app
5. ✓ App runs successfully
6. ✓ No update dialog (already latest)

### Test 2: Update Available
**Goal**: Verify update detection works

**Setup:**
1. Install v1.0.0
2. Publish v1.0.1 to GitHub
3. Launch app

**Expected:**
1. ✓ After 5 seconds, update dialog appears
2. ✓ Dialog shows "A new version (1.0.1) is available"
3. ✓ "Download" button is enabled

### Test 3: Download Update
**Goal**: Verify update download works

1. Click "Download" in update dialog
2. ✓ Download progress appears
3. ✓ Download completes
4. ✓ "Update Ready" dialog appears
5. ✓ App continues running normally

### Test 4: Install Update
**Goal**: Verify update installation works

1. Click "Restart Now"
2. ✓ App closes gracefully
3. ✓ Installer runs (may see UAC prompt)
4. ✓ App reopens automatically
5. ✓ Version is now 1.0.1 (check in About/Settings)
6. ✓ All data is preserved
7. ✓ Settings are preserved

### Test 5: User Postpones Update
**Goal**: Verify "Later" workflow

1. When update dialog appears, click "Later"
2. ✓ Dialog closes
3. ✓ App continues normally
4. Wait 4 hours or restart app
5. ✓ Update dialog appears again

### Test 6: Update on Next Restart
**Goal**: Verify delayed installation

1. Download update, click "Restart Later"
2. Close app normally (X button)
3. ✓ Installer runs on close
4. Reopen app manually
5. ✓ Version is updated

---

## 🔧 Troubleshooting

### Issue 1: "Update not available" but GitHub has new release
**Symptoms:**
- GitHub shows v1.0.1
- App says "no update available"

**Causes & Solutions:**

1. **Missing latest.yml**
   - Check GitHub release assets
   - Must contain `latest.yml`
   - Re-upload if missing

2. **Wrong repository URL**
   - Check `package.json` → `repository.url`
   - Must match GitHub repo exactly
   - Must be public repo (or token configured for private)

3. **Version comparison issue**
   - App version: Check `package.json`
   - GitHub version: Must be higher (1.0.1 > 1.0.0)
   - Use semantic versioning

4. **GitHub API rate limit**
   - Wait 1 hour
   - Or configure `GH_TOKEN` for higher limit

### Issue 2: Download fails
**Symptoms:**
- Update detection works
- Download starts but fails

**Causes & Solutions:**

1. **Firewall/Antivirus blocking**
   - Whitelist Sambad.exe
   - Whitelist GitHub domains: api.github.com, github.com

2. **Network issues**
   - Check internet connection
   - Try downloading manually from GitHub

3. **Corrupted release file**
   - Delete and re-upload release
   - Verify file integrity

### Issue 3: Installation fails
**Symptoms:**
- Download completes
- Restart triggered
- Installation fails or hangs

**Causes & Solutions:**

1. **Insufficient permissions**
   - Run app as administrator
   - Check Windows UAC settings

2. **App still running**
   - Ensure app closes completely
   - Check Task Manager for lingering processes

3. **Corrupted update file**
   - Delete: `%APPDATA%\..\Local\Sambad-updater\pending`
   - Re-download update

### Issue 4: "Failed to check for updates"
**Symptoms:**
- Error dialog: "An error occurred while checking for updates"

**Causes & Solutions:**

1. **No internet connection**
   - Check network connectivity

2. **GitHub down**
   - Check https://www.githubstatus.com/

3. **Invalid GitHub repo**
   - Verify repository exists
   - Verify it's public

4. **CORS / SSL issues**
   - Update electron-updater: `npm update electron-updater`

---

## 📚 Best Practices

### 1. Version Numbering
**Use Semantic Versioning:**
- **Major** (x.0.0): Breaking changes, major features
- **Minor** (1.x.0): New features, backwards compatible
- **Patch** (1.0.x): Bug fixes, small improvements

**Examples:**
- `1.0.0` → First stable release
- `1.0.1` → Bug fix
- `1.1.0` → New feature (groups refresh)
- `2.0.0` → Major rewrite

### 2. Release Notes
**Always include in GitHub release:**
- What's new
- What's fixed
- What's changed
- Known issues

**Template:**
```markdown
## What's New
- Auto-update functionality
- Improved staff privacy controls

## Bug Fixes
- Fixed phone number masking in campaigns
- Fixed groups page not refreshing

## Technical
- Updated electron-updater to 6.6.2
- Improved error handling

## Known Issues
- None
```

### 3. Testing Before Release
**Mandatory checks:**
- ✅ Build completes without errors
- ✅ App runs on clean Windows install
- ✅ Update from previous version works
- ✅ All features work in new version
- ✅ No data loss during update

### 4. Staged Rollout
**For large user base:**

1. **Beta Release:**
   - Tag as `v1.0.1-beta`
   - Share with 5-10 test users
   - Collect feedback for 2-3 days

2. **Production Release:**
   - Tag as `v1.0.1`
   - Monitor for issues
   - Be ready to rollback

3. **Rollback Plan:**
   - Keep previous release available
   - Document downgrade process
   - Communicate with users if needed

### 5. Update Frequency
**Recommended:**
- **Patch fixes**: As needed (urgent bugs)
- **Minor updates**: Every 2-4 weeks
- **Major updates**: Every 3-6 months

**Avoid:**
- Daily updates (user fatigue)
- Forced immediate updates (unless critical security fix)

### 6. Communication
**Before major update:**
- Email users (if you have contact info)
- Post on website/social media
- Mention breaking changes clearly

**After update:**
- Monitor error logs
- Respond to user feedback
- Quick hotfix if critical issues found

---

## 🎯 Final Checklist

### Before First Release
- [ ] GitHub repository is public
- [ ] `package.json` has correct repository URL
- [ ] `package.json` has correct version
- [ ] GitHub token created and saved
- [ ] Auto-updater code is enabled
- [ ] Build succeeds without errors
- [ ] Installer tested on clean machine

### For Each Release
- [ ] Version number incremented
- [ ] CHANGELOG.md updated
- [ ] Code tested locally
- [ ] Build created: `npm run build && npm run dist`
- [ ] `latest.yml` generated
- [ ] GitHub release created
- [ ] Installer and `latest.yml` uploaded
- [ ] Release published (not draft)
- [ ] Tested update from previous version

### After Release
- [ ] Verify files accessible on GitHub
- [ ] Test update check from older version
- [ ] Monitor for user issues
- [ ] Respond to feedback

---

## 📊 Expected Timeline

### Initial Setup (One-Time): ~2 hours
1. Create GitHub account/repo: 10 minutes
2. Generate GitHub token: 5 minutes
3. Configure package.json: 10 minutes
4. Enable auto-updater code: 15 minutes
5. Test build locally: 30 minutes
6. First release to GitHub: 30 minutes
7. Test update mechanism: 20 minutes

### Future Updates: ~30 minutes each
1. Update code: (varies)
2. Update version: 2 minutes
3. Build and publish: 15 minutes
4. Test update: 10 minutes
5. Monitor: ongoing

---

## 🚀 Quick Start Commands

```bash
# 1. Set GitHub token (Windows PowerShell)
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"

# 2. Update version in package.json
# Edit package.json: "version": "1.0.1"

# 3. Build production installer
npm run clean
npm run build
npm run dist

# 4. Publish to GitHub (automatic)
npm run publish

# 5. Or manually upload files from:
# ./release/Sambad-Setup-1.0.1.exe
# ./release/latest.yml
```

---

## ✅ Success Criteria

**You'll know auto-update is working when:**

1. ✅ After publishing v1.0.1, users with v1.0.0 see update dialog within 5 seconds
2. ✅ Users click "Download" and download completes successfully
3. ✅ Users click "Restart Now" and app updates seamlessly
4. ✅ Users are now on v1.0.1 with all data preserved
5. ✅ This happens for ALL future releases without any manual steps

**End Goal Achieved:**
> 🎉 **After initial installation, users receive automatic updates with ZERO manual intervention!**

---

## 📞 Support & Resources

**electron-updater Documentation:**
https://www.electron.build/auto-update

**GitHub Releases Documentation:**
https://docs.github.com/en/repositories/releasing-projects-on-github

**Troubleshooting Guide:**
https://github.com/electron-userland/electron-builder/issues

**Community Support:**
- StackOverflow: Tag `electron-updater`
- GitHub Discussions: electron-builder repo

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-29  
**Author:** Sambad Development Team
