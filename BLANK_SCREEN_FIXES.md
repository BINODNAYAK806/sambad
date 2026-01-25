# Blank Screen Fixes - Complete Guide

This document explains the fixes applied to resolve blank screen issues when running the app in production mode or as a built executable.

## Problems Fixed

### 1. Environment Variable Loading
**Problem:** The .env file was not being loaded correctly in production builds, causing Supabase initialization to fail.

**Solution:**
- Added multi-location .env loading (development path and user data directory)
- App now gracefully handles missing .env files
- Added clear logging to show where environment is being loaded from
- Users can place .env in their AppData folder for production use

### 2. Production Mode Detection
**Problem:** The app couldn't reliably detect if it was running in development or production mode.

**Solution:**
- Added `app.isPackaged` check alongside NODE_ENV
- Used explicit NODE_ENV in all npm scripts via cross-env
- Added comprehensive logging to show environment detection

### 3. File Path Resolution
**Problem:** The HTML file path was incorrect in packaged applications, using relative paths that didn't work in ASAR archives.

**Solution:**
- Switched to using `app.getAppPath()` for reliable path resolution
- Properly handles both ASAR packaged and unpacked scenarios
- Added error handling and logging for file loading

### 4. Error Handling
**Problem:** When things went wrong, users just saw a blank screen with no explanation.

**Solution:**
- Added error dialogs for failed loads and crashes
- Added timeout to force show window if ready-to-show doesn't fire
- Comprehensive logging throughout initialization process

## Updated NPM Scripts

### Development
```bash
npm run dev
```
Runs both Vite dev server and Electron in development mode with hot reload.

### Test Production Build Locally
```bash
npm run electron:prod
```
Builds the app and runs it in production mode locally (without packaging). Use this to test before creating the installer.

### Create Installer
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```
Creates a distributable installer for the specified platform.

## How to Use in Production

### For End Users

When you install the app via the .exe installer, you need to configure Supabase credentials:

1. **Option 1: Settings Page (Recommended)**
   - Open the app
   - Go to Settings
   - Enter your Supabase URL and API Key
   - (Note: This UI needs to be implemented)

2. **Option 2: Manual .env File**
   - Create a `.env` file in: `%APPDATA%/Sambad/.env` (Windows)
   - Add your credentials:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Restart the app

### For Developers

During development, keep your .env file in the project root as usual. The app will automatically load it.

## Environment Detection Logic

The app uses multiple checks to determine if it's in development or production:

```javascript
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
```

- `app.isPackaged` is false when running from source, true when running from installer
- `NODE_ENV` is explicitly set by npm scripts
- Both checks ensure reliable detection in all scenarios

## File Structure in Production

When packaged, the app structure looks like:

```
Sambad/
├── resources/
│   └── app.asar           # Contains all your app files
│       ├── dist/          # Built React app
│       │   └── index.html
│       └── dist-electron/ # Built Electron code
│           └── electron/
│               ├── main/
│               └── preload/
└── Sambad.exe
```

The app uses `app.getAppPath()` which returns the path to `app.asar`, allowing it to find files correctly.

## Troubleshooting

### "Failed to Load Application" Error
- Check that the build completed successfully
- Verify the dist/ folder contains index.html and assets
- Run `npm run build` again

### Blank Screen After Installing
1. Open the app
2. Press `Ctrl+Shift+I` (opens DevTools if enabled)
3. Check Console for error messages
4. Verify Supabase credentials are configured

### "Database features disabled" Warning
- This means .env file wasn't found or Supabase credentials are missing
- Follow the "For End Users" section above to configure credentials

## Testing Before Distribution

Before creating an installer for distribution:

1. Run the full build:
   ```bash
   npm run build
   ```

2. Test the production build locally:
   ```bash
   npm run electron:prod
   ```

3. Verify everything works correctly

4. Create the installer:
   ```bash
   npm run dist:win
   ```

5. Install and test the .exe on a clean machine (without Node.js or development tools)

## Key Changes Made

### electron/main/index.ts
- Added `app.isPackaged` check for production detection
- Improved .env loading with fallback to user data directory
- Fixed HTML file path using `app.getAppPath()`
- Added error dialogs and crash handlers
- Added timeout for window show

### package.json
- Installed `cross-env` for cross-platform NODE_ENV setting
- Updated all scripts to explicitly set NODE_ENV
- Added new `electron:prod` script for local production testing

### Error Handling
- Shows user-friendly error dialogs when load fails
- Handles render process crashes gracefully
- Forces window to show after 10 seconds if ready-to-show doesn't fire
- Comprehensive logging throughout the application lifecycle

## Next Steps (Recommended)

1. **Implement Settings UI**: Create a settings page where users can configure Supabase credentials through the UI instead of manually editing .env files.

2. **First-Run Setup**: Add a welcome wizard that appears on first launch to collect Supabase credentials.

3. **Credential Storage**: Use electron-store or similar to securely store user configuration instead of relying on .env files.

4. **Better Error Messages**: Show specific instructions in error dialogs based on the type of error encountered.

5. **Auto-Update**: Implement auto-update functionality so users can receive fixes without reinstalling.
