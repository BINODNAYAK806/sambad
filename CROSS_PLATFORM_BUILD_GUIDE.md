# Cross-Platform Build Guide

This guide explains how to build Sambad for Windows, even when building on Linux or macOS.

## The Problem

Previously, the build system would bundle whatever Chromium browser Puppeteer had downloaded locally. This meant:
- Building on Linux would bundle Linux Chromium
- When the Windows app tried to run, it couldn't execute the Linux browser
- Result: "ENOENT" error when launching campaigns

## The Solution

We've implemented a cross-platform build system that:
1. Downloads the correct Chromium for your target platform
2. Automatically detects the target platform from your npm script
3. Falls back to system Chrome/Edge if bundled browser isn't found
4. Supports building for any platform from any platform

## Quick Start

### Building for Windows (from any OS)

```bash
npm run dist:win
```

This will:
1. Auto-detect that you're building for Windows
2. Download Windows Chromium (~150 MB) if not already present
3. Bundle it into the app
4. Create the Windows installer

### Manual Platform Selection

If you want to explicitly specify the target platform:

```bash
# Download Windows Chromium
node scripts/copy-chromium.cjs win64

# Verify it downloaded correctly
node scripts/verify-chromium.cjs win64

# Build the app
npm run build
npm run dist:win
```

### Building for Other Platforms

```bash
# For macOS Intel
npm run dist:mac
# or manually: node scripts/copy-chromium.cjs mac

# For macOS ARM (M1/M2)
node scripts/copy-chromium.cjs mac-arm
npm run dist:mac

# For Linux
npm run dist:linux
# or manually: node scripts/copy-chromium.cjs linux
```

## How It Works

### 1. Download Script (`scripts/copy-chromium.cjs`)

This script:
- Detects the target platform from the npm script name or command line
- Downloads the correct Chromium from Google's Chrome for Testing repository
- Saves it to `node_modules/puppeteer/.cache-chromium/`
- Uses the structure: `{platform}-{version}/{chrome-folder}/`

**Supported Platforms:**
- `win64`: Windows x64
- `mac`: macOS Intel (x64)
- `mac-arm`: macOS Apple Silicon (ARM64)
- `linux`: Linux x64

### 2. Verification Script (`scripts/verify-chromium.cjs`)

Runs before building to ensure:
- Chromium is downloaded for the target platform
- The executable exists and is accessible
- Gives helpful error messages if something is wrong

### 3. Worker Browser Detection (`electron/worker/whatsappWorker.ts`)

When the app runs, it:
1. Checks for bundled Chromium in `resources/chrome/`
2. Looks for the correct platform-specific browser
3. Falls back to system Chrome/Edge if not found
4. Uses puppeteer's browser in development mode

**Browser Search Order:**
1. Bundled Chromium: `resources/chrome/{platform}-{version}/{browser-folder}/`
2. System Chrome (Windows):
   - `C:\Program Files\Google\Chrome\Application\chrome.exe`
   - `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
   - `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`
   - Microsoft Edge as fallback
3. Development: Puppeteer's downloaded browser

## Directory Structure

After downloading Windows Chromium, you'll have:

```
node_modules/
  puppeteer/
    .cache-chromium/
      win64-1345237/
        chrome-win64/
          chrome.exe          ← The browser executable
          chrome_100_percent.pak
          chrome_200_percent.pak
          resources/
          ... (all browser files)
```

After building, the packaged app has:

```
release/
  win-unpacked/
    resources/
      chrome/
        win64-1345237/
          chrome-win64/
            chrome.exe        ← Bundled with the app
            ...
    Sambad.exe
```

## Troubleshooting

### Error: "Chromium not downloaded for target platform"

**Solution:**
```bash
# Explicitly download for Windows
node scripts/copy-chromium.cjs win64

# Then rebuild
npm run dist:win
```

### Error: "Chrome directory not found in packaged app"

**Cause:** The build didn't include the Chromium browser.

**Solution:**
1. Verify Chromium is downloaded: `node scripts/verify-chromium.cjs win64`
2. Check `electron-builder.json5` has the extraResources config
3. Rebuild: `npm run dist:win`
4. Verify the packaged app: `node scripts/verify-packaged-chromium.cjs`

### Error: "spawn chrome.exe ENOENT" (in packaged app)

**Cause:** Browser path detection failed.

**Fallback:** The app will try to use system Chrome/Edge automatically. If you have Chrome installed on Windows, campaigns should still work.

**Permanent Fix:** Ensure Windows Chromium is bundled:
1. `node scripts/copy-chromium.cjs win64`
2. `npm run dist:win`
3. Verify: `node scripts/verify-packaged-chromium.cjs`

### Building for Windows on Linux

This works perfectly! The script downloads Windows Chromium even on Linux:

```bash
# On Linux, building for Windows
node scripts/copy-chromium.cjs win64
npm run dist:win
```

The only requirement is:
- Internet connection (to download ~150 MB browser)
- `unzip` command (usually pre-installed on Linux)

## File Sizes

Expect these sizes after downloading:

| Platform | Download Size | Extracted Size |
|----------|--------------|----------------|
| Windows  | ~150 MB      | ~350 MB        |
| macOS    | ~180 MB      | ~400 MB        |
| Linux    | ~150 MB      | ~350 MB        |

The final packaged app will be approximately 350-400 MB due to the bundled browser.

## Advanced Usage

### Download Multiple Platforms

You can bundle browsers for multiple platforms (useful for building universal installers):

```bash
# Download all platforms
node scripts/copy-chromium.cjs win64
node scripts/copy-chromium.cjs mac
node scripts/copy-chromium.cjs linux

# electron-builder will bundle the one for the target platform
npm run dist:win   # Uses win64 browser
npm run dist:mac   # Uses mac browser
npm run dist:linux # Uses linux browser
```

### Skip Chromium Download

If you already have it downloaded and verified:

```bash
# Build without re-running prebuild
npm run build
electron-builder
```

### Use Environment Variables

```bash
# Set target platform explicitly
TARGET_PLATFORM=win64 node scripts/copy-chromium.cjs

# Then build
npm run dist:win
```

## Development vs Production

**Development** (`npm run dev`):
- Uses Puppeteer's auto-downloaded browser
- No special setup needed
- Browser is in `node_modules/puppeteer/.local-chromium/`

**Production** (`npm run dist:win`):
- Uses explicitly downloaded browser
- Must run download script first
- Browser is bundled into the app

## Why Chrome for Testing?

We use Google's "Chrome for Testing" builds because:
- ✅ Stable, headless-ready builds
- ✅ Direct download URLs (no API key needed)
- ✅ Available for all platforms
- ✅ Same version as Puppeteer expects
- ✅ No license restrictions for bundling

## Support

If you encounter issues:

1. Check what's downloaded:
   ```bash
   ls node_modules/puppeteer/.cache-chromium/
   ```

2. Verify the expected platform:
   ```bash
   node scripts/verify-chromium.cjs win64
   ```

3. Check the packaged app:
   ```bash
   node scripts/verify-packaged-chromium.cjs
   ```

4. Check the console logs when running a campaign (they show browser detection details)

## Summary

✅ **What's Fixed:**
- Cross-platform builds now work correctly
- Building for Windows on Linux/Mac works
- Bundled browser is platform-specific
- System Chrome/Edge fallback for resilience

✅ **What You Need to Do:**
1. Run `npm run dist:win` (it handles everything automatically)
2. Or manually: `node scripts/copy-chromium.cjs win64` before building
3. Distribute the `release/win-unpacked` folder or installer

✅ **What's Improved:**
- Automatic platform detection
- Helpful error messages
- Verification scripts
- Multiple fallback options
- Clear documentation
