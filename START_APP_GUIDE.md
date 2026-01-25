# How to Start Sambad App

## Quick Start

### First Time Setup

**On Windows:**
```bash
fix-app-launch.bat
```

**On Mac/Linux:**
```bash
npm run clean
npm run build
npm run electron:prod
```

### Already Built?

**Check if your app is ready:**
```bash
npm run verify
```

**If verification passes, start the app:**
```bash
npm run electron:prod
```

## Detailed Instructions

### 1. Verify Everything is Built

Run the verification script:
```bash
npm run verify
```

This checks:
- ✓ package.json is configured correctly
- ✓ React frontend is built (dist/ folder)
- ✓ Electron backend is built (dist-electron/ folder)
- ✓ All required files exist
- ✓ Dependencies are installed

### 2. If Verification Fails

**You'll see which files are missing. To fix:**

```bash
# Install dependencies (if needed)
npm install

# Build everything
npm run build

# Verify again
npm run verify
```

### 3. Start the App

**Option A: Development Mode (Recommended During Development)**

```bash
npm run dev
```

Features:
- Hot reload (changes update automatically)
- Developer tools enabled
- Detailed console logs
- Faster iteration

**Option B: Production Mode (Recommended for Testing)**

```bash
npm run electron:prod
```

Features:
- Uses built files (like final app)
- No hot reload
- Production-like behavior
- Better performance

**Option C: Directly with Electron**

```bash
electron .
```

Only works if app is already built!

## Common Issues

### Error: "Cannot find module"

**Problem:** App not built or incomplete build

**Fix:**
```bash
npm run build
npm run verify
npm run electron:prod
```

### Error: "Cannot find Electron app"

**Problem:** Missing entry point or wrong directory

**Fix:**
```bash
# Verify package.json main entry
cat package.json | grep "main"

# Should show: "main": "dist-electron/electron/main/index.js"

# If wrong, rebuild
npm run build
```

### Error: Port 5173 already in use

**Problem:** Another dev server is running

**Fix:**
```bash
# Kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9

# Then start again
npm run dev
```

### Error: ENOENT dist/index.html

**Problem:** Renderer not built

**Fix:**
```bash
npm run build:renderer
npm run verify
```

### App opens but shows blank screen

**Problem:** Renderer built but not loading correctly

**Fix:**
1. Open DevTools (View → Toggle Developer Tools)
2. Check Console for errors
3. Try rebuilding:
   ```bash
   npm run clean
   npm run build
   npm run electron:prod
   ```

## Build Commands Reference

| Command | What it does | When to use |
|---------|--------------|-------------|
| `npm install` | Install dependencies | First time or after package.json changes |
| `npm run build` | Build everything | Before running or packaging |
| `npm run build:renderer` | Build React app only | When only frontend changed |
| `npm run build:electron` | Build Electron only | When only backend changed |
| `npm run clean` | Delete build folders | Before fresh build |
| `npm run verify` | Check build status | Troubleshooting |
| `npm run dev` | Start development mode | During development |
| `npm run electron:prod` | Start production mode | Testing final build |
| `npm run dist:win` | Create Windows installer | For distribution |

## Development Workflow

### Making Changes

1. **Start dev mode:**
   ```bash
   npm run dev
   ```

2. **Make changes to your code**

3. **See changes automatically** (hot reload)

4. **If you change Electron main process files:**
   - Stop the app (Ctrl+C)
   - Restart: `npm run dev`

### Testing Before Release

1. **Build production version:**
   ```bash
   npm run build
   ```

2. **Test production build:**
   ```bash
   npm run electron:prod
   ```

3. **Create installer:**
   ```bash
   npm run dist:win
   ```

4. **Test installer:**
   - Find in `release/` folder
   - Install on clean machine
   - Test all features

## Automated Scripts

### Windows Users

**Fix app launch issues:**
```bash
fix-app-launch.bat
```

**Verify build:**
```bash
verify-build.bat
```

**Fix file locking:**
```bash
fix-windows-lock.bat
```

### All Platforms

**Verify build (cross-platform):**
```bash
npm run verify
```

## Success Indicators

### Build Success

You'll see:
```
✓ 1748 modules transformed.
✓ built in X.XXs
```

### Verification Success

You'll see:
```
============================================================
   ✅ All checks passed!
============================================================

Your app is ready to run:
  - Development: npm run dev
  - Production:  npm run electron:prod
```

### App Started Successfully

You'll see:
- Sambad window opens
- No error dialogs
- UI loads completely
- Can interact with features

## Getting Help

### Check Logs

**Development mode logs:**
- Show in terminal where you ran `npm run dev`

**Production mode logs:**
- Windows: `%APPDATA%\Sambad\logs\`
- Mac: `~/Library/Logs/Sambad/`
- Linux: `~/.config/Sambad/logs/`

### Debug Mode

Enable detailed logging:

```bash
# Windows
set DEBUG=*
npm run electron:prod

# Mac/Linux
DEBUG=* npm run electron:prod
```

### Still Not Working?

1. **Check build:**
   ```bash
   npm run verify
   ```

2. **Clean rebuild:**
   ```bash
   npm run clean
   npm install
   npm run build
   npm run verify
   ```

3. **Check documentation:**
   - `APP_LAUNCH_FIX.md` - Launch issues
   - `TROUBLESHOOTING.md` - General issues
   - `README.md` - Overview

## Quick Command Summary

```bash
# First time or after git pull
npm install
npm run build

# Verify everything
npm run verify

# Start the app
npm run electron:prod

# Or for development
npm run dev
```

That's it! Your app should now start successfully.
