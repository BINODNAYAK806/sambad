# Fix: Unable to Find Electron App

## The Problem

You're seeing this error:
```
Error launching app
Unable to find Electron app at C:\Users\Lenovo\Downloads\sam-12\sam-12
Cannot find module 'C:\Users\Lenovo\Downloads\sam-12\sam-12\dist-electron\electron\main\index.js'
```

## Root Cause

The application files are **not built** or are **incomplete**. The error occurs because:

1. **Missing `dist/` folder** - The React frontend isn't built
2. **Missing or incomplete `dist-electron/` folder** - The Electron backend isn't built
3. **The app is trying to start without required files**

## Quick Fix (Recommended)

**On your Windows machine, run:**

```bash
fix-app-launch.bat
```

This will:
- Stop any running processes
- Clean old builds
- Rebuild everything
- Verify the build succeeded

## Manual Fix

If the batch script doesn't work, run these commands **one by one**:

### 1. Stop Running Processes

```bash
taskkill /F /IM Sambad.exe /T
taskkill /F /IM electron.exe /T
```

### 2. Clean Old Builds

```bash
npm run clean
```

### 3. Rebuild Everything

```bash
npm run build
```

This command will:
- Build the React frontend → Creates `dist/` folder
- Build the Electron backend → Creates `dist-electron/` folder
- Takes about 1-2 minutes

### 4. Verify Build

```bash
verify-build.bat
```

This checks if all required files exist.

### 5. Run the App

**For testing (development mode):**
```bash
npm run dev
```

**For production testing:**
```bash
npm run electron:prod
```

**To create installer:**
```bash
npm run dist:win
```

## Understanding the Build Process

### What Gets Built?

1. **`dist/` folder** - Your React frontend
   - `dist/index.html` - Main HTML file
   - `dist/assets/` - JavaScript, CSS, images

2. **`dist-electron/` folder** - Your Electron backend
   - `dist-electron/electron/main/index.js` - Main process entry point
   - `dist-electron/electron/main/ipc.js` - IPC handlers
   - `dist-electron/electron/preload/index.cjs` - Preload script
   - Other supporting files

### Build Commands Explained

```bash
npm run build
```
This runs TWO builds:
1. `npm run build:renderer` - Builds React app (creates `dist/`)
2. `npm run build:electron` - Compiles TypeScript (creates `dist-electron/`)

## Verification Checklist

After building, verify these files exist:

### ✅ Must Have - Renderer
- [ ] `dist/index.html`
- [ ] `dist/assets/` folder with files

### ✅ Must Have - Electron Main
- [ ] `dist-electron/electron/main/index.js`
- [ ] `dist-electron/electron/main/ipc.js`
- [ ] `dist-electron/electron/main/supabase.js`

### ✅ Must Have - Electron Preload
- [ ] `dist-electron/electron/preload/index.cjs`

### ✅ Must Have - Configuration
- [ ] `package.json` with `"main": "dist-electron/electron/main/index.js"`

## Common Build Errors

### Error: "Cannot find module 'X'"

**Cause:** Missing dependencies

**Fix:**
```bash
npm install
npm run build
```

### Error: "TypeScript compilation failed"

**Cause:** Code errors in `.ts` or `.tsx` files

**Fix:** Check the error messages, fix the code errors

### Error: "Out of memory"

**Cause:** Node.js ran out of memory during build

**Fix:**
```bash
set NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Error: "EPERM: operation not permitted"

**Cause:** Windows file permissions or antivirus

**Fix:**
1. Close all Electron/Node processes
2. Run Command Prompt as Administrator
3. Add antivirus exclusion for your project folder

## Running the App

### Development Mode (Recommended for Testing)

```bash
npm run dev
```

This:
- Starts Vite dev server on http://localhost:5173
- Launches Electron
- Enables hot reload (changes reflect immediately)
- Shows developer tools

### Production Mode (Testing Final Build)

```bash
npm run electron:prod
```

This:
- Uses the built files from `dist/`
- Runs like the final packaged app
- No hot reload
- More accurate for testing

### Creating Installer

```bash
npm run dist:win
```

This:
- Builds everything in production mode
- Creates Windows installer in `release/` folder
- Takes 3-5 minutes
- Output: `release/Sambad-1.0.0-Setup.exe`

## Project Structure

```
sam-12/
├── dist/                          ← React build output
│   ├── index.html
│   └── assets/
├── dist-electron/                 ← Electron build output
│   └── electron/
│       ├── main/
│       │   └── index.js          ← Entry point (package.json "main")
│       └── preload/
│           └── index.cjs
├── electron/                      ← Electron source code
│   ├── main/
│   │   └── index.ts
│   └── preload/
│       └── index.ts
├── src/                           ← React source code
│   └── renderer/
├── package.json                   ← Must have correct "main" entry
└── electron-builder.json5         ← Build configuration
```

## Troubleshooting Steps

### If build succeeds but app won't start:

1. **Verify package.json:**
   ```bash
   type package.json | findstr "main"
   ```
   Should show: `"main": "dist-electron/electron/main/index.js"`

2. **Check file exists:**
   ```bash
   dir dist-electron\electron\main\index.js
   ```
   Should show the file with size (not "File Not Found")

3. **Check Node version:**
   ```bash
   node --version
   ```
   Should be v18 or higher

4. **Check Electron version:**
   ```bash
   npx electron --version
   ```
   Should show v32.x.x

### If build fails repeatedly:

1. **Delete everything and start fresh:**
   ```bash
   rd /s /q node_modules
   rd /s /q dist
   rd /s /q dist-electron
   rd /s /q release
   npm install
   npm run build
   ```

2. **Check disk space:**
   ```bash
   dir
   ```
   Make sure you have at least 5GB free

3. **Check for path length issues:**
   - Windows has 260 character path limit
   - Move project to shorter path: `C:\sambad\`

## Success Indicators

You'll know everything is working when:

1. **Build output shows:**
   ```
   ✓ 1748 modules transformed.
   ✓ built in X.XXs
   ```

2. **Files exist:**
   ```bash
   verify-build.bat
   ```
   Shows all ✓ checkmarks

3. **App starts:**
   ```bash
   npm run electron:prod
   ```
   Opens without errors

## Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run clean` | Delete build output | Before fresh build |
| `npm run build` | Build everything | Before running/packaging |
| `npm run dev` | Development mode | During development |
| `npm run electron:prod` | Test production build | Before creating installer |
| `npm run dist:win` | Create Windows installer | For distribution |
| `verify-build.bat` | Check build is complete | Troubleshooting |
| `fix-app-launch.bat` | Automated fix | When app won't launch |

## Summary

The "Cannot find module" error means **your app isn't built yet**. Simply run:

```bash
npm run build
```

Then start the app with:

```bash
npm run electron:prod
```

Or use the automated fix:

```bash
fix-app-launch.bat
```

That's it! Your app will work once the build completes successfully.
