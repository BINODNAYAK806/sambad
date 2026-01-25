# ERR_FILE_NOT_FOUND Fix - Quick Reference

## Problem Summary
The app works in development but shows ERR_FILE_NOT_FOUND (-6) after building and installing.

## Root Causes Identified & Fixed

### ✅ 1. Main Process Path Resolution
**Issue:** Incorrect HTML path construction for ASAR packaging  
**Fixed in:** `electron/main/index.ts`
- ✓ Uses `app.getAppPath()` correctly
- ✓ Joins with `'dist/index.html'`
- ✓ Added fallback path handling
- ✓ Enhanced error logging

### ✅ 2. Preload Script Path
**Issue:** Preload path not verified  
**Fixed in:** `electron/main/index.ts`
- ✓ Uses relative path from `__dirname`
- ✓ Added existence verification (dev mode)
- ✓ Added alternative path fallback

### ✅ 3. Vite Build Configuration
**Issue:** Assets might use absolute paths  
**Fixed in:** `vite.config.ts`
- ✓ `base: './'` for relative paths
- ✓ Consistent asset naming
- ✓ Disabled code splitting
- ✓ Assets organized in `assets/` folder

### ✅ 4. Electron-Builder Configuration
**Issue:** No packaging configuration  
**Fixed in:** `package.json` (build section)
- ✓ Includes `dist/**/*` (renderer)
- ✓ Includes `dist-electron/**/*` (main/preload)
- ✓ ASAR unpacking for native modules
- ✓ Chromium bundled as extra resource

---

## What Was Changed

### File: `electron/main/index.ts`
**Line 72-106:** Enhanced preload path verification  
**Line 134-176:** Improved production HTML loading with fallback

### File: `vite.config.ts`
**Line 5-38:** Updated build configuration for Electron compatibility

### File: `package.json`
**Line 102-149:** Added complete electron-builder configuration

### New Files:
- `PRODUCTION_FILE_STRUCTURE.md` - Documentation
- `verify-production-build.bat` - Build verification script
- `ELECTRON_BUILD_FIX_SUMMARY.md` - This file

---

## Build & Test Instructions

### Quick Build & Test (Recommended)

```bash
# Run automated verification
verify-production-build.bat
```

This script will:
1. ✅ Clean previous builds
2. ✅ Build renderer (Vite)
3. ✅ Build electron (TypeScript)
4. ✅ Verify all outputs exist
5. ✅ Check HTML uses relative paths
6. ⚡ Optionally test production mode

### Manual Build Steps

```bash
# 1. Clean
npm run clean

# 2. Build everything
npm run build

# 3. Test production mode (before packaging)
npm run electron:prod

# 4. If test passes, create installer
npm run dist:win
```

---

## Verification Checklist

After running `npm run build`, verify:

```
✅ dist/index.html exists
✅ dist/assets/ contains JS and CSS files
✅ dist-electron/electron/main/index.js exists
✅ dist-electron/electron/preload/index.cjs exists
✅ HTML uses ./assets/ paths (not /assets/)
```

After running `npm run dist:win`, verify:

```
✅ dist/Sambad Setup 1.0.0.exe exists
✅ Installer size is > 1GB (includes Chromium)
✅ Installation completes without errors
✅ App launches and shows UI (not blank screen)
```

---

## Expected Behavior

### Development Mode ✅
```bash
npm run dev
```
- Vite dev server runs on http://localhost:5173
- Main process loads from dev server
- Hot Module Replacement works
- DevTools open automatically

### Production Mode (Before Packaging) ✅
```bash
npm run electron:prod
```
- Loads from `dist/index.html`
- No dev server
- Tests ASAR-like environment
- Should show UI correctly

### Packaged App ✅
- Double-click `Sambad.exe`
- Loads from `app.asar/dist/index.html`
- All assets load from `app.asar/dist/assets/`
- No console errors
- Full UI functionality

---

## Debugging Production Issues

### If the packaged app still shows errors:

1. **Check Console Logs:**
   ```bash
   # Run from installation directory
   cd "C:\Users\[YourUsername]\AppData\Local\Programs\Sambad"
   .\Sambad.exe 2>&1 | Out-File debug.log
   ```

2. **Look for these log entries:**
   - `[Sambad] App path:` → Should show ASAR path
   - `[Sambad] HTML path:` → Should end with `dist/index.html`
   - `[Sambad] Preload script path:` → Should end with `preload/index.cjs`

3. **Common errors:**
   - **ERR_FILE_NOT_FOUND (-6):** File path is incorrect
   - **ERR_FAILED (-2):** File exists but can't be read
   - **Blank screen:** JavaScript error, check renderer console

4. **Extract ASAR for inspection:**
   ```bash
   npm install -g asar
   asar extract app.asar extracted
   dir extracted
   ```

---

## Path Resolution Reference

### In Production (Packaged):

| Variable | Value |
|----------|-------|
| `app.isPackaged` | `true` |
| `app.getAppPath()` | `C:\...\resources\app.asar` |
| `__dirname` | `app.asar/dist-electron/electron/main` |
| `process.resourcesPath` | `C:\...\resources` |

### File Paths:

| File | Path |
|------|------|
| HTML | `app.asar/dist/index.html` |
| Preload | `app.asar/dist-electron/electron/preload/index.cjs` |
| Assets | `app.asar/dist/assets/[name]-[hash].js` |

---

## Support

If issues persist after applying all fixes:

1. ✅ Verify all files were updated correctly
2. ✅ Run `verify-production-build.bat`
3. ✅ Test `npm run electron:prod` first
4. ✅ Check `debug.log` from packaged app
5. ✅ Review `PRODUCTION_FILE_STRUCTURE.md`

---

## Summary

All identified issues have been fixed:
- ✅ Main process path resolution
- ✅ Preload script loading
- ✅ Renderer asset paths (Vite config)
- ✅ Packaging configuration (electron-builder)

**Next Action:** Run `verify-production-build.bat` to build and test!
