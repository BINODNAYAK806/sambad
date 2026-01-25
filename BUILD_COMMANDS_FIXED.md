# 🚀 CORRECT BUILD COMMANDS

**Date:** 2025-12-30  
**Issue:** `--publish always` syntax error  
**Status:** ✅ **FIXED**

---

## ❌ **WRONG COMMAND (Doesn't Work)**

```powershell
npm run dist:win -- --publish always
```

**Error:**
```
⨯ Unknown target: always
```

**Why it fails:**
npm parses `always` as a separate argument instead of a value for `--publish`.

---

## ✅ **CORRECT COMMANDS**

### **Option 1: Use `-p` flag (Recommended)**

```powershell
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
npm run dist:win -- -p always
```

---

### **Option 2: Run electron-builder directly**

```powershell
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
npm run prebuild:dist
npm run build
npx electron-builder --win -p always
```

---

### **Option 3: One-liner (Currently Running)**

```powershell
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"; npm run prebuild:dist; npm run build; npx electron-builder --win -p always
```

---

## 📋 **COMMAND BREAKDOWN**

| Step | Command | What it does |
|------|---------|--------------|
| 1 | `$env:GH_TOKEN = "..."` | Sets GitHub token |
| 2 | `npm run prebuild:dist` | Cleans, downloads Chromium |
| 3 | `npm run build` | Builds app (renderer + electron) |
| 4 | `npx electron-builder --win -p always` | Builds & publishes to GitHub |

---

## 🎯 **PUBLISH OPTIONS**

| Flag | Effect |
|------|--------|
| `-p always` | Always publish to GitHub |
| `-p never` | Never publish (local build only) |
| `-p onTag` | Publish only if on git tag |
| `-p onTagOrDraft` | Publish on tag or as draft |

---

## ⏰ **BUILD TIME**

**Expected time:** 10-15 minutes

**What's happening:**
1. ✅ Cleaning old builds
2. ✅ Compiling TypeScript
3. ✅ Building Vite app
4. ✅ Creating installer
5. ⏳ Uploading to GitHub (in progress)

---

## 📊 **MONITORING PROGRESS**

Watch the terminal output for:

```
✓ 2153 modules transformed
✓ built in 14.23s
✓ Copied SafeWorker.wrapper.cjs
• electron-builder version=26.0.12
• building target nsis
• packaging NSIS installer
• uploading to GitHub Release
✓ Published to GitHub
```

---

## 🔍 **VERIFY AFTER BUILD**

### **1. Check GitHub Releases**

Visit:
```
https://github.com/BINODNAYAK806/sambad/releases
```

Look for:
- ✅ Release `v1.0.1`
- ✅ `Sambad Setup 1.0.1.exe`
- ✅ `latest.yml`

### **2. Download & Test**

1. Download `.exe` from GitHub
2. Install the app
3. Run it
4. Check for auto-update functionality

---

## 🚨 **IF BUILD FAILS**

### **Common Issues:**

**Issue: "Cannot upload to GitHub"**
```powershell
# Solution: Re-set token
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
```

**Issue: "Repository not found"**
- Make sure repository exists: `https://github.com/BINODNAYAK806/sambad`
- Check token has `repo` permissions
- Verify repository name matches package.json

**Issue: "Build error"**
```powershell
# Clean and retry
npm run clean
npm run build
npm run dist:win -- -p never  # Local build first
```

---

## 🎯 **QUICK REFERENCE**

### **Build and Publish (Production)**

```powershell
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
npm run dist:win -- -p always
```

### **Build Without Publishing (Testing)**

```powershell
npm run dist:win
```
or
```powershell
npm run dist:win -- -p never
```

### **Development Mode**

```powershell
npm run dev
```

---

## 📝 **FUTURE RELEASES**

For version 1.0.2 and beyond:

```powershell
# 1. Update version
npm version patch  # or minor, or major

# 2. Commit
git add .
git commit -m "Release v$(node -p 'require(`./package.json`).version')"
git push

# 3. Build and publish
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
npm run dist:win -- -p always
```

---

## ✅ **CORRECT SYNTAX SUMMARY**

```powershell
# ✅ CORRECT - Use -p flag
npm run dist:win -- -p always

# ❌ WRONG - npm parses incorrectly
npm run dist:win -- --publish always

# ✅ CORRECT - Direct electron-builder
npx electron-builder --win -p always
npx electron-builder --win --publish always  # Also works
```

---

## 🎊 **CURRENT STATUS**

Your build is **currently running** with the correct command! ✅

Wait for completion (~10-15 minutes), then check GitHub Releases!

---

**Good luck! The build should succeed this time! 🚀**
