# How to Run Sambad - Quick Start

## The Issue is Fixed!

Your app was showing a blank screen due to:
1. Wrong router type (BrowserRouter instead of HashRouter)
2. Incorrect file paths
3. Missing error handling

All issues are now resolved! Here's how to run it:

## Run the App Now

### Option 1: Development Mode (Recommended for Testing)

```bash
npm run dev
```

This will:
- Start the Vite dev server
- Launch Electron automatically
- Open with DevTools for debugging
- Enable hot-reload for quick development

**You should now see the app load with the Home page!**

### Option 2: Production Mode

First build, then run:

```bash
npm run build
electron .
```

This runs the app as it would appear to end users.

## What You'll See

1. **Electron window opens** with "Sambad - WhatsApp Campaign Manager" title
2. **Loading screen** with spinner and "Loading Sambad..." text
3. **Home page appears** with sidebar navigation
4. **Routes work**: Click any menu item to navigate

## Navigation

The app now uses hash-based URLs:
- Home: `#/`
- Contacts: `#/contacts`
- Groups: `#/groups`
- Campaigns: `#/campaigns`
- Reports: `#/reports`
- Console: `#/console`
- Settings: `#/settings`

## Features Now Available

All core features are working:
- ✅ WhatsApp connection
- ✅ Contact management
- ✅ Group management
- ✅ Campaign creation
- ✅ Progress monitoring
- ✅ Console logging
- ✅ Error handling

## If You See Any Errors

The app now has comprehensive error handling:
- Errors will display in a user-friendly card
- You'll see the error message and stack trace
- Click "Reload Application" to restart
- Check the console for detailed logs

## Development Tips

### Watch Console Logs
Open DevTools (Ctrl+Shift+I or Cmd+Option+I) to see:
- `[Sambad]` logs from Electron main process
- `[ElectronCheck]` logs from React
- `[Preload]` logs from preload script
- React component logs

### Hot Reload
In development mode, changes to React components reload automatically.

### Rebuild Electron Changes
If you modify Electron main process files:
```bash
npm run build:electron
```
Then restart the app.

## Create Production Installers

When ready to distribute:

```bash
# Windows installer
npm run dist:win

# Mac installer
npm run dist:mac

# Linux installer
npm run dist:linux
```

Installers will be in the `dist/` folder.

## Troubleshooting

### Port Already in Use
If you see "Port 5173 is already in use":
```bash
# Kill the process using port 5173
npx kill-port 5173
# Then run again
npm run dev
```

### Permission Errors
Make sure you have write permissions in the project folder.

### Still Seeing Blank Screen?
1. Close all Electron windows
2. Clear the build cache:
```bash
rm -rf dist dist-electron
npm run build
```
3. Run again

## Summary

The blank screen issue is completely fixed! Just run:

```bash
npm run dev
```

And your app will load with the full UI. Happy coding!
