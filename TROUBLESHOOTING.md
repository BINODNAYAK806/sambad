# Troubleshooting Guide

## Blank Screen After Starting App

### Problem
Electron window opens but shows blank white screen with only console logs from preload script.

### Root Cause
The Vite development server is not running. In development mode, Electron tries to load the app from `http://localhost:5173`, but if the server isn't running, nothing loads.

### Solution

**Option 1: Use the Combined Dev Command (RECOMMENDED)**
```bash
npm run dev
```
This single command:
1. Starts Vite dev server
2. Waits for it to be ready
3. Builds Electron code
4. Launches Electron app

**Option 2: Start Services Separately**
```bash
# Terminal 1: Start Vite dev server
npm run dev:vite

# Terminal 2: Wait for server to start, then run Electron
npm run dev:electron
```

### How to Verify It's Working

1. **Check Vite Server is Running**
   ```bash
   curl http://localhost:5173
   ```
   Should return HTML content

2. **Check Console Logs**
   When app loads correctly, you should see:
   - `[Preload]` logs from preload script
   - `[Sambad]` logs from main process
   - `[Sambad] React app starting...` from React
   - `[ElectronCheck]` logs from React components

3. **Visual Confirmation**
   - Loading spinner appears briefly
   - Home page loads with sidebar navigation
   - URL bar (in dev tools) shows `http://localhost:5173`

### Common Issues

#### Port 5173 Already in Use
```bash
# Kill the process using the port
npx kill-port 5173
# Or find and kill manually
lsof -ti:5173 | xargs kill -9
```

#### Electron Won't Start
```bash
# Rebuild Electron code
npm run build:electron
# Then try again
npm run dev:electron
```

#### Still Seeing Blank Screen After Starting Dev Server
1. Close all Electron windows
2. Stop all running npm processes (Ctrl+C)
3. Clear the build cache:
   ```bash
   rm -rf dist dist-electron node_modules/.vite
   ```
4. Start fresh:
   ```bash
   npm run dev
   ```

#### Permission Errors
```bash
# Fix permissions
chmod -R 755 electron
chmod -R 755 src
```

### Development Mode vs Production Mode

**Development Mode** (what you're using now)
- Requires Vite dev server running
- Loads from `http://localhost:5173`
- Has hot-reload
- Shows DevTools by default
- Command: `npm run dev`

**Production Mode** (for testing final build)
- Uses built files from `dist/` folder
- Loads from `file://` protocol
- No hot-reload
- Commands:
  ```bash
  npm run build    # Build everything
  electron .       # Run production build
  ```

### Quick Diagnostic Checklist

Run these commands to diagnose issues:

```bash
# 1. Check if Vite server is running
curl -I http://localhost:5173

# 2. Check if Electron code is built
ls -la dist-electron/electron/main/index.js

# 3. Check if React code is built (production only)
ls -la dist/index.html

# 4. Check for running processes
ps aux | grep -E "(vite|electron)" | grep -v grep

# 5. Check environment variables
grep -E "VITE_|SAMBAD" .env
```

### Account Configuration Issues

Make sure your account is activated in the Settings page, or your `.env` file exists and contains:
```env
SAMBAD_ACCOUNT_ID=https://your-account-id.sambad.app
VITE_SAMBAD_ACCOUNT_ID=https://your-account-id.sambad.app
SAMBAD_LICENSE_KEY=your_license_key_here
VITE_SAMBAD_LICENSE_KEY=your_license_key_here
```

Without these, the app may run but account sync features will be disabled. You can activate your account from Settings > Account.

### When to Use Each Command

| Command | Use When |
|---------|----------|
| `npm run dev` | Starting development work (recommended) |
| `npm run dev:vite` | Only starting the dev server |
| `npm run dev:electron` | Dev server already running, just need Electron |
| `npm run build` | Creating production build to test |
| `npm run dist` | Creating installers for distribution |
| `electron .` | Running after `npm run build` |

### Still Not Working?

1. **Check Node.js Version**
   ```bash
   node --version  # Should be 18+
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Logs**
   - Main process logs: Check terminal output
   - Renderer logs: Check DevTools Console (Ctrl+Shift+I)
   - Preload logs: Check DevTools Console

4. **Enable Verbose Logging**
   Add to your startup command:
   ```bash
   DEBUG=* npm run dev
   ```

### Success Indicators

You'll know it's working when:
- ✅ Vite dev server shows "ready in Xms"
- ✅ Electron window opens
- ✅ Loading spinner appears briefly
- ✅ Home page with sidebar loads
- ✅ Navigation works (clicking menu items changes content)
- ✅ No errors in console

### Contact for Help

If still stuck:
1. Check the console for specific error messages
2. Check terminal output for build errors
3. Review the full console logs in DevTools
4. Check the Network tab to see if resources are loading
