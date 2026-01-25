# Production File Structure for Sambad Electron App

## Overview
This document describes the expected file structure after building and packaging the Sambad application.

---

## Development Build Structure (After `npm run build`)

```
d:/sam-12/
├── dist/                          # Vite renderer output
│   ├── index.html                 # Main HTML file
│   ├── assets/                    # Bundled JS/CSS
│   │   ├── index-[hash].js        # Main JS bundle
│   │   ├── index-[hash].css       # Main CSS bundle
│   │   └── [other-assets]         # Images, fonts, etc.
│   └── ...
│
├── dist-electron/                 # Compiled Electron code
│   ├── chromium/                  # Bundled Chromium for WhatsApp
│   │   └── [chromium files]
│   └── electron/
│       ├── main/                  # Main process (compiled from TypeScript)
│       │   ├── index.js           # Entry point (from electron/main/index.ts)
│       │   └── [other modules]    # IPC, services, etc.
│       ├── preload/               # Preload scripts
│       │   └── index.cjs          # Preload (CommonJS, from electron/preload/index.ts)
│       └── worker/                # Worker threads
│           └── [worker files]
│
└── package.json                   # Main package.json
```

---

## Packaged Application Structure (After `npm run dist:win`)

### Installed Application Path
```
C:/Users/[Username]/AppData/Local/Programs/Sambad/
├── Sambad.exe                     # Main executable
├── resources/
│   ├── app.asar                   # Packaged application (see structure below)
│   ├── app.asar.unpacked/         # Unpacked files (native modules, chromium)
│   │   ├── dist-electron/
│   │   │   ├── chromium/          # Chromium executable & libraries
│   │   │   └── electron/
│   │   │       └── worker/        # Worker scripts
│   │   └── node_modules/
│   │       └── better-sqlite3/    # Native module (.node files)
│   └── chromium/                  # Extra resources - Chromium backup
│
└── [Electron runtime files]
```

### Inside app.asar (Packaged Archive)
```
app.asar/
├── dist/                          # Renderer (Frontend)
│   ├── index.html                 # Main HTML (loaded by main process)
│   └── assets/                    # JS/CSS bundles
│       ├── index-[hash].js        # All React code bundled here
│       ├── index-[hash].css       # All styles bundled here
│       └── [other assets]         # Images, fonts, etc.
│
├── dist-electron/                 # Electron code
│   └── electron/
│       ├── main/                  # Main process
│       │   ├── index.js           # Entry point
│       │   ├── ipc.js             # IPC handlers
│       │   ├── supabase.js        # Database logic
│       │   └── [other modules]
│       └── preload/               # Preload scripts
│           └── index.cjs          # Preload script
│
└── package.json                   # Application metadata
```

---

## Path Resolution in Production

### Main Process (`dist-electron/electron/main/index.js`)

**Key Variables:**
- `__dirname` = `app.asar/dist-electron/electron/main`
- `app.getAppPath()` = `C:/Users/.../resources/app.asar`
- `process.resourcesPath` = `C:/Users/.../resources`

**HTML File Loading:**
```typescript
// Correct path resolution
const appPath = app.getAppPath();
const htmlPath = path.join(appPath, 'dist', 'index.html');
// Result: app.asar/dist/index.html ✅

mainWindow.loadFile(htmlPath);
// Electron handles ASAR internally, loads correctly
```

**Preload Script Loading:**
```typescript
// Relative path from main/index.js
const preloadPath = path.join(__dirname, '../preload/index.cjs');
// Result: app.asar/dist-electron/electron/preload/index.cjs ✅
```

### Renderer Process (Vite Build)

**Asset Loading in `index.html`:**
```html
<!-- All paths are relative -->
<script type="module" src="./assets/index-[hash].js"></script>
<link rel="stylesheet" href="./assets/index-[hash].css">
```

**How it works:**
1. Electron loads `file:///C:/Users/.../resources/app.asar/dist/index.html`
2. Browser resolves `./assets/index-[hash].js` relative to the HTML file
3. Result: `file:///C:/Users/.../resources/app.asar/dist/assets/index-[hash].js` ✅
4. Electron's protocol handler extracts from ASAR automatically

---

## Common Issues & Solutions

### Issue 1: ERR_FILE_NOT_FOUND for index.html
**Cause:** Incorrect path resolution in main process
**Solution:** Use `path.join(app.getAppPath(), 'dist', 'index.html')`

### Issue 2: ERR_FILE_NOT_FOUND for assets (JS/CSS)
**Cause:** Absolute paths in Vite build (e.g., `/assets/index.js`)
**Solution:** Set `base: './'` in `vite.config.ts`

### Issue 3: Preload script not found
**Cause:** Wrong relative path from __dirname
**Solution:** Use `path.join(__dirname, '../preload/index.cjs')`

### Issue 4: Native modules fail to load
**Cause:** .node files packaged inside ASAR
**Solution:** Add to `asarUnpack` in electron-builder config:
```json
"asarUnpack": [
  "**/*.node",
  "dist-electron/chromium/**/*"
]
```

### Issue 5: Worker threads fail
**Cause:** Worker scripts can't be loaded from ASAR
**Solution:** Unpack worker directory:
```json
"asarUnpack": [
  "dist-electron/electron/worker/**/*"
]
```

---

## Verification Checklist

After building, verify:

✅ `dist/index.html` exists
✅ `dist/assets/` contains JS and CSS bundles
✅ `dist-electron/electron/main/index.js` exists
✅ `dist-electron/electron/preload/index.cjs` exists
✅ All paths in `index.html` are relative (start with `./`)
✅ electron-builder config includes both `dist` and `dist-electron`
✅ Native modules are in `asarUnpack` config

---

## Testing Production Build

```bash
# 1. Clean build
npm run clean

# 2. Build renderer and electron
npm run build

# 3. Test production mode locally (before packaging)
npm run electron:prod

# 4. If step 3 works, package the app
npm run dist:win

# 5. Install and test the packaged .exe
# Look for executable in: dist/Sambad Setup 1.0.0.exe
```

---

## Debugging Production Issues

**Enable logging in packaged app:**
1. Open PowerShell as Administrator
2. Navigate to installation directory
3. Run: `.\Sambad.exe 2>&1 | Out-File -FilePath debug.log`
4. Check `debug.log` for errors

**Common log entries to look for:**
- `[Sambad] App path:` - Should show ASAR path
- `[Sambad] HTML path:` - Should show `app.asar/dist/index.html`
- `[Sambad] Preload script path:` - Should show `app.asar/dist-electron/electron/preload/index.cjs`
- Error codes: `-6` = File not found, `-300` = Protocol error

