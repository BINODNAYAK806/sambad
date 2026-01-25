# 📚 Sambad Development & Deployment Guide

Complete reference for all npm commands, version management, and publishing workflows.

---

## 📋 Table of Contents

1. [Development Workflow](#development-workflow)
2. [Build Commands](#build-commands)
3. [Version Management](#version-management)
4. [Publishing & Distribution](#publishing--distribution)
5. [Testing & Verification](#testing--verification)
6. [Common Workflows](#common-workflows)

---

## 🛠️ Development Workflow

### Start Development Server

```bash
npm run dev
```

**What it does:**
- Starts Vite dev server for renderer process (React UI)
- Starts Electron in development mode
- Enables hot-reload for UI changes
- Opens DevTools automatically

**When to use:**
- During active development
- Testing UI changes
- Debugging application logic

**Output:**
- UI runs at `http://localhost:5173`
- Electron window opens automatically
- Console shows both Vite and Electron logs

---

### Build for Development Testing

```bash
npm run build
```

**What it does:**
- Compiles TypeScript (renderer + electron + preload)
- Bundles React app with Vite
- Does NOT create installer

**When to use:**
- Test production-like build without creating installer
- Verify TypeScript compilation
- Check build errors before distribution

**Output:**
- `dist/` - Vite production build
- `dist-electron/` - Compiled Electron code

---

## 🏗️ Build Commands

### Clean Build Artifacts

```bash
npm run clean
```

**What it does:**
- Deletes `dist/` folder
- Deletes `dist-electron/` folder
- Deletes TypeScript build cache files

**When to use:**
- Before fresh build
- After major changes
- When build seems corrupted

**Always run before:** `npm run dist:win`

---

### Download Chromium (Only Once)

```bash
npm run download:chromium
```

**What it does:**
- Downloads Chromium browser (revision 1108766)
- Saves to `chromium/` folder (~200MB)
- Creates `chromium-info.json`

**When to use:**
- First time setting up project
- After cloning repository
- If `chromium/` folder is deleted

**Note:** Only needed ONCE. Chromium is reused for all builds.

---

### Verify Chromium Installation

```bash
npm run verify:chromium
```

**What it does:**
- Checks if `chromium/` exists
- Verifies `chromium-info.json`
- Confirms executable path

**When to use:**
- After downloading Chromium
- Before building production
- Troubleshooting build issues

---

### Build Windows Installer

```bash
npm run dist:win
```

**What it does:**
1. Runs `prebuild:dist` (clean + download + verify + copy Chromium)
2. Compiles TypeScript
3. Bundles React with Vite
4. Packages Electron app
5. Creates NSIS installer (.exe)
6. **Does NOT publish** (builds only)

**Output:**
- `dist/Sambad Setup [version].exe` (~500MB with Chromium)
- `dist/win-unpacked/` (unpacked app for debugging)

**When to use:**
- Creating installer for manual distribution
- Testing production build locally
- Before publishing to GitHub

**Time:** ~10-15 minutes

---

### Build and Publish to GitHub

```bash
npm run publish:win
```

**What it does:**
1. Runs `prebuild:dist`
2. Builds app (same as `dist:win`)
3. Creates GitHub Release (tag: `v[version]`)
4. Uploads installer to GitHub
5. Generates `latest.yml` for auto-update

**Requirements:**
- `GH_TOKEN` environment variable set
- GitHub repository exists (`BINODNAYAK806/sambad`)
- Token has `repo` scope

**When to use:**
- Deploying new version to customers
- Enabling auto-update
- Official releases

**Setup:**
```bash
# Set GitHub token (permanent)
[System.Environment]::SetEnvironmentVariable("GH_TOKEN", "GITHUB_TOKEN_PLACEHOLDER", "User")

# Restart terminal, then publish
npm run publish:win
```

---

## 📦 Version Management

### Check Current Version

```bash
# View package.json version
npm version
```

Current version is in `package.json`:
```json
{
  "version": "1.0.1"
}
```

---

### Update Version (Patch)

```bash
npm version patch
```

**Changes:** `1.0.1` → `1.0.2`

**When to use:**
- Bug fixes
- Small improvements
- Security patches

**Example:**
- Fixed worker crash issue
- Updated UI text
- Performance improvements

---

### Update Version (Minor)

```bash
npm version minor
```

**Changes:** `1.0.1` → `1.1.0`

**When to use:**
- New features
- Significant improvements
- Backward-compatible changes

**Example:**
- Added campaign scheduling
- New report types
- Enhanced contact management

---

### Update Version (Major)

```bash
npm version major
```

**Changes:** `1.0.1` → `2.0.0`

**When to use:**
- Breaking changes
- Complete redesign
- Major architecture changes

**Example:**
- Changed database schema
- New authentication system
- Removed old features

---

### Manual Version Update

Edit `package.json`:
```json
{
  "version": "1.0.2"  // Change this manually
}
```

**When to use:**
- Setting specific version
- Pre-release versions (e.g., `1.0.2-beta`)

---

## 🚀 Publishing & Distribution

### Complete Publishing Workflow

```bash
# Step 1: Update version
npm version patch  # or minor/major

# Step 2: Clean old builds
npm run clean

# Step 3: Ensure Chromium is ready
npm run verify:chromium

# Step 4: Build and publish
npm run publish:win
```

**Output:**
- GitHub Release created
- Installer uploaded
- Auto-update enabled

**Customers see:**
- "Update available" notification
- Automatic download & install

---

### Manual Distribution (No GitHub)

```bash
# Build installer only
npm run dist:win

# Share the installer
# Location: dist/Sambad Setup 1.0.1.exe
```

**When to use:**
- Beta testing
- Internal distribution
- No internet access

**Share via:**
- Email
- Cloud storage (Google Drive, Dropbox)
- USB drive

---

## ✅ Testing & Verification

### Test Development Build

```bash
# Start dev server
npm run dev

# In DevTools (Ctrl+Shift+I):
# 1. Test WhatsApp connection
# 2. Run a test campaign
# 3. Check console for errors
```

---

### Test Production Build

```bash
# Build installer
npm run dist:win

# Install on TEST PC (NOT dev PC)
# Location: dist/Sambad Setup 1.0.1.exe

# On test PC:
# 1. Install app
# 2. Connect WhatsApp
# 3. Run campaign
# 4. Check DevTools console
```

**Expected Console Output:**
```
[SafeWorker] ==================== Chromium Path Resolution ====================
[SafeWorker] ✓ Found Chromium at: C:\...\resources\chromium\chrome-win\chrome.exe
[SafeWorker] ✓ WhatsApp client initialized successfully
```

---

### Verify Auto-Update

```bash
# Build version 1.0.1
npm version patch  # → 1.0.2
npm run publish:win

# On customer PC with v1.0.1:
# 1. Open app
# 2. Wait ~30 seconds
# 3. Should show "Update available"
# 4. Click "Install update"
# 5. App restarts with v1.0.2
```

---

## 🔄 Common Workflows

### Workflow 1: Daily Development

```bash
# Start development
npm run dev

# Make changes to code...
# UI hot-reloads automatically

# Test in dev mode

# Commit changes
git add .
git commit -m "Your changes"
git push
```

---

### Workflow 2: Bug Fix Release

```bash
# Fix the bug in code...

# Update version (patch)
npm version patch  # 1.0.1 → 1.0.2

# Clean & publish
npm run clean
npm run publish:win

# Wait for build to complete
# Installer uploaded to GitHub

# Notify customers to update
```

---

### Workflow 3: New Feature Release

```bash
# Develop new feature...
# Test in dev mode

# Update version (minor)
npm version minor  # 1.0.1 → 1.1.0

# Build and test locally first
npm run clean
npm run dist:win

# Test installer on clean PC
# If OK, publish
npm run publish:win
```

---

### Workflow 4: Fresh Machine Setup

```bash
# Clone repository
git clone https://github.com/BINODNAYAK806/sambad.git
cd sambad

# Install dependencies
npm install

# Download Chromium (one-time)
npm run download:chromium
npm run verify:chromium

# Start development
npm run dev
```

---

### Workflow 5: Troubleshooting Build Issues

```bash
# Clean everything
npm run clean
rm -rf node_modules
rm -rf chromium

# Fresh install
npm install

# Re-download Chromium
npm run download:chromium
npm run verify:chromium

# Try building again
npm run dist:win
```

---

## 🔧 Advanced Commands

### Run Specific Build Steps

```bash
# Only build renderer (React)
npm run build:renderer

# Only build Electron
npm run build:electron

# Copy Chromium manually
node scripts/copy-chromium.cjs
```

---

### Debugging Commands

```bash
# Check Electron version
npx electron --version

# Check Node version
node --version

# Inspect dist folder
ls -R dist-electron/

# Check package size
du -sh dist/*.exe
```

---

## 📝 Environment Variables

### Required for Publishing

```powershell
# GitHub token (for npm run publish:win)
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"

# Make permanent
[System.Environment]::SetEnvironmentVariable("GH_TOKEN", "GITHUB_TOKEN_PLACEHOLDER", "User")
```

### Optional Environment Variables

```bash
# Supabase credentials (for app)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Sambad license (if using)
SAMBAD_ACCOUNT_ID=your_account_id
SAMBAD_LICENSE_KEY=your_license_key
```

---

## 🎯 Quick Reference

| Command | Use Case | Output |
|---------|----------|--------|
| `npm run dev` | Development | Opens app in dev mode |
| `npm run build` | Test compile | Builds without installer |
| `npm run clean` | Before rebuild | Deletes build artifacts |
| `npm run dist:win` | Create installer | `.exe` file in `dist/` |
| `npm run publish:win` | Release update | GitHub Release + auto-update |
| `npm version patch` | Bug fix | Version +0.0.1 |
| `npm version minor` | New feature | Version +0.1.0 |
| `npm version major` | Breaking change | Version +1.0.0 |

---

## ⚠️ Important Notes

### Before Every Build
```bash
npm run clean
npm run verify:chromium
```

### Before Every Publish
```bash
# 1. Update version
npm version patch

# 2. Test locally
npm run dist:win
# Install and test the .exe

# 3. Publish
npm run publish:win
```

### If Build Fails
1. Check `chromium/` folder exists
2. Run `npm run clean`
3. Run `npm install`
4. Run `npm run download:chromium`
5. Try again

---

## 🆘 Troubleshooting

### "Chromium not found" error
```bash
npm run download:chromium
npm run verify:chromium
```

### "GH_TOKEN not set" error
```powershell
[System.Environment]::SetEnvironmentVariable("GH_TOKEN", "your_token", "User")
# Restart terminal
```

### Build takes forever
- Normal! First build: ~15 minutes
- Subsequent builds: ~10 minutes
- Most time: signing Chromium files

### "Exit code: 1" in production
- Make sure you rebuilt after latest fixes
- Check DevTools console for `[SafeWorker]` logs
- Verify using `SafeWorker.wrapper.cjs`

---

## 📞 Support

For issues:
1. Check console logs (`Ctrl+Shift+I`)
2. Look for `[SafeWorker]` messages
3. Share screenshots of errors

---

**Last Updated:** January 2026  
**Current Version:** 1.0.1  
**Electron Version:** 32.3.3  
**Node Version:** 20.x
