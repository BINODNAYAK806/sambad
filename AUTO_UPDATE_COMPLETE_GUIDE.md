# 🚀 AUTO-UPDATE ENABLED - COMPLETE SETUP GUIDE

## ✅ STEP 1: CODE CHANGES COMPLETE

The following changes have been made to your code:

### Modified Files:
1. ✅ `electron/main/index.ts` - Added auto-updater initialization
2. ✅ `package.json` - Added GitHub publish configuration

---

## 📝 STEP 2: CONFIGURE YOUR GITHUB REPOSITORY

### A. Create GitHub Repository (if you haven't already)

1. Go to https://github.com/new
2. Repository name: `sambad` (or any name you prefer)
3. Choose: Private or Public
4. Click "Create repository"

### B. Update package.json with Your Details

**Open:** `package.json`  
**Find line ~129:** 
```json
"owner": "YOUR_GITHUB_USERNAME",
"repo": "sambad"
```

**Replace with your actual GitHub username:**
```json
"owner": "your-actual-username",
"repo": "sambad"
```

**Example:**
```json
"owner": "johnsmith",
"repo": "sambad-whatsapp"
```

---

## 🔑 STEP 3: GENERATE GITHUB TOKEN

### Why needed?
electron-builder needs permission to upload releases to your GitHub repository.

### How to generate:

1. **Go to:** https://github.com/settings/tokens

2. **Click:** "Generate new token" → "Generate new token (classic)"

3. **Note:** "Sambad Auto-Update Token"

4. **Select scopes:**
   - ✅ `repo` (Full control of private repositories)
     - This automatically selects all sub-options

5. **Click:** "Generate token"

6. **IMPORTANT:** Copy the token immediately!
   - It looks like: `GITHUB_TOKEN_PLACEHOLDER`
   - You won't be able to see it again!

---

## 💻 STEP 4: SET GITHUB TOKEN IN YOUR SYSTEM

### On Windows (PowerShell):

**Option A: Temporary (Current Session Only)**
```powershell
$env:GH_TOKEN="your_token_here"
```

**Option B: Permanent (Recommended)**
```powershell
# Open System Environment Variables
rundll32.exe sysdm.cpl,EditEnvironmentVariables

# Then:
# 1. Click "New" under User variables
# 2. Variable name: GH_TOKEN
# 3. Variable value: paste your token
# 4. Click OK
# 5. RESTART your terminal/PowerShell
```

**To verify it's set:**
```powershell
echo $env:GH_TOKEN
```
Should display your token.

---

## 🏗️ STEP 5: BUILD WITH AUTO-UPDATE

### First, rebuild your app with the new changes:

```bash
# Clean previous build
npm run clean

# Build everything
npm run build
```

### Then package with publish enabled:

```bash
# This will create the installer AND prepare for GitHub releases
npx electron-builder --win --publish never
```

**Note:** Use `--publish never` for the first time to test without uploading.

---

## 📦 STEP 6: CREATE GITHUB RELEASE

After building, you'll have these files in `dist/`:

```
dist/
├── Sambad Setup 1.0.0.exe        ← Your installer
├── Sambad Setup 1.0.0.exe.blockmap
└── latest.yml                     ← Update metadata
```

### A. Create Release on GitHub:

1. Go to your repository: `https://github.com/your-username/sambad/releases`

2. Click "Create a new release"

3. Fill in:
   - **Tag version:** `v1.0.0` (must start with 'v')
   - **Release title:** `Sambad v1.0.0 - Initial Release`
   - **Description:** Add release notes

4. **Upload files:**
   - Drag and drop `Sambad Setup 1.0.0.exe`
   - Drag and drop `latest.yml`

5. Click "Publish release"

---

## 🔄 STEP 7: TEST AUTO-UPDATE (For Future Releases)

### Simulate an update:

1. **Install v1.0.0** on a test machine

2. **Build v1.0.1:**
   ```bash
   # Update version in package.json
   "version": "1.0.1"
   
   # Build
   npm run build
   npx electron-builder --win --publish never
   ```

3. **Create v1.0.1 release on GitHub** (same as Step 6)

4. **Open v1.0.0 app:**
   - Wait 5 seconds
   - Should show: "Update available - v1.0.1"
   - Click "Download"
   - Wait for download
   - Click "Restart Now"
   - App updates to v1.0.1!

---

## 🚀 STEP 8: PUBLISH RELEASES AUTOMATICALLY (Optional)

### Instead of manually uploading to GitHub:

```bash
# Build and auto-publish to GitHub
npx electron-builder --win --publish always
```

This will:
1. Build your app
2. Create installer
3. Automatically create GitHub release
4. Upload files

**Requirements:**
- ✅ GH_TOKEN environment variable set
- ✅ package.json has correct owner/repo

---

## 📋 QUICK REFERENCE

### For Each New Release:

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"  // Increment: 1.0.0 → 1.0.1 → 1.1.0 → 2.0.0
   ```

2. **Build and publish:**
   ```bash
   npm run build
   npx electron-builder --win --publish always
   ```

3. **Done!** Users will auto-update within 4 hours.

### Manual Publish (Without Auto-Upload):

```bash
npm run build
npx electron-builder --win --publish never
# Then manually create GitHub release and upload files
```

---

## 🎯 HOW IT WORKS FOR USERS

### First Install (v1.0.0):
1. User downloads `Sambad Setup 1.0.0.exe`
2. Installs app
3. Opens app
4. Auto-updater is active (checking in background)

### When Update Available (v1.0.1 released):
1. User opens app (or app is running)
2. After 5 seconds: "Update available - v1.0.1. Download now?"
3. User clicks "Download"
4. Progress bar shows download %
5. "Update ready. Restart now?"
6. User clicks "Restart Now"
7. App closes, updates, and reopens with v1.0.1

### Auto-Check Schedule:
- ✅ On app startup (5 second delay)
- ✅ Every 4 hours while app runs
- ✅ Silent check (no notification if up-to-date)

---

## 🔍 TROUBLESHOOTING

### "Update check failed"
**Cause:** GitHub token not set or incorrect  
**Fix:** Verify `$env:GH_TOKEN` is set correctly

### "No updates found" (but there should be)
**Cause:** Version in installed app same or higher than GitHub release  
**Fix:** Ensure GitHub release has higher version

### "Cannot find package.json owner/repo"
**Cause:** Didn't replace YOUR_GITHUB_USERNAME  
**Fix:** Update package.json with actual username

### Update downloads but fails to install
**Cause:** Antivirus blocking  
**Fix:** Add app to antivirus exceptions

---

## 📁 IMPORTANT FILES

### package.json
- Set version before each build
- Contains GitHub owner/repo config

### latest.yml (auto-generated in dist/)
- Contains version and file checksums
- MUST be uploaded to GitHub releases
- Users' apps download this to check for updates

### Sambad Setup X.X.X.exe
- The installer file
- Upload to GitHub releases

---

## ✅ CHECKLIST FOR YOUR FIRST RELEASE

- [ ] Code changes applied (already done ✓)
- [ ] GitHub repository created
- [ ] Updated package.json with GitHub username/repo
- [ ] Generated GitHub token
- [ ] Set GH_TOKEN environment variable
- [ ] Rebuilt app: `npm run build`
- [ ] Created installer: `npx electron-builder --win --publish never`
- [ ] Created GitHub release v1.0.0
- [ ] Uploaded .exe and latest.yml to release
- [ ] Tested: Installed app, waited 5 seconds, checked logs

---

## 🎊 YOU'RE DONE!

Your app now has fully functional auto-update!

**Current build** (running in terminal) does NOT have this yet.  
**Next build** (after the changes above) will have auto-update.

**Next steps:**
1. Wait for current `npm run dist:win` to finish
2. Update package.json with your GitHub username
3. Rebuild: `npm run build`
4. Package: `npx electron-builder --win --publish never`
5. Create GitHub release and upload files

**Questions? Check:** `AUTO_UPDATE_SETUP.md` for more details!
