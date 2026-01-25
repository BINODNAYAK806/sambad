# Preload Script Fix - CommonJS with .cjs Extension

## Problem
The Electron preload script was not executing, causing `window.electronAPI` to be undefined. Users saw:
```
"Not running in Electron environment. Please run as desktop app."
```

No preload logs appeared in the console, indicating the script never ran.

## Root Cause

**Module System Conflict with package.json**

The project has `"type": "module"` in `package.json`, which tells Node.js to treat **all** `.js` files as ES modules. However:

1. The preload script was compiled to CommonJS format (`.js` extension)
2. Node.js saw the `.js` extension and expected ESM
3. Found CommonJS code instead
4. **Failed silently** - the preload script never executed

## The Solution

Keep preload as CommonJS but use `.cjs` extension, which explicitly tells Node.js "this is CommonJS regardless of package.json settings."

### Changes Made

#### 1. Keep CommonJS Compilation
**File:** `tsconfig.preload.json`
```json
{
  "compilerOptions": {
    "module": "CommonJS",        // ✅ CommonJS output
    "moduleResolution": "node"
  }
}
```

#### 2. Rename Output to .cjs
**File:** `package.json` - Updated build script
```json
{
  "scripts": {
    "build:electron": "tsc ... && node -e \"const fs=require('fs');... rename to .cjs\""
  }
}
```

This automatically renames `index.js` → `index.cjs` after TypeScript compilation.

#### 3. Update Preload Path
**File:** `electron/main/index.ts`
```typescript
const preloadPath = path.join(__dirname, '../preload/index.cjs');  // ✅ Load .cjs
```

## Why .cjs Works

When Node.js encounters a file:

| Extension | Type | Works with "type": "module"? |
|-----------|------|------------------------------|
| `.js`     | Determined by package.json | ❌ Fails if format doesn't match |
| `.mjs`    | Always ES Module | ✅ Yes |
| `.cjs`    | Always CommonJS | ✅ Yes (explicit override) |

The `.cjs` extension explicitly declares "this is CommonJS" and works regardless of package.json settings.

## Why Not Use ESM for Preload?

Electron's preload scripts have special requirements:
- They run in a hybrid Node.js/Browser context
- Need access to Node.js modules (`electron`, etc.)
- Better stability with CommonJS in the preload context
- CommonJS is the traditional and well-tested format for Electron preloads

## Files Changed

### 1. tsconfig.preload.json
Kept as CommonJS (no change needed if already CommonJS)

### 2. electron/main/index.ts
```typescript
// Before
const preloadPath = path.join(__dirname, '../preload/index.js');

// After
const preloadPath = path.join(__dirname, '../preload/index.cjs');
```

### 3. package.json
Added automatic renaming to the build script:
```json
"build:electron": "tsc ... && node -e \"rename .js to .cjs\""
```

## Build Process

When you run `npm run build` or `npm run build:electron`:

1. TypeScript compiles preload to `index.js` (CommonJS format)
2. Post-build script automatically renames to `index.cjs`
3. Source maps are also renamed (`index.js.map` → `index.cjs.map`)
4. Main process loads `index.cjs` correctly

## Verification

After the fix, you should see:

### In Electron Console:
```
[Sambad] Preload script path: .../dist-electron/electron/preload/index.cjs
[Preload] Starting preload script
[Preload] contextBridge available: true
[Preload] ipcRenderer available: true
[Preload] ✓ electronAPI successfully exposed to window object
[Preload] ✓ Available API namespaces: [app, db, contacts, ...]
[Preload] Preload script execution completed
```

### In Renderer Console:
```
[ElectronCheck] Checking for Electron environment...
[ElectronCheck] ✓ Electron API is available
```

### Files Created:
```bash
$ ls dist-electron/electron/preload/
index.cjs        # ✅ CommonJS preload script
index.cjs.map    # ✅ Source map
index.d.ts       # ✅ Type definitions
```

## Testing

```bash
# Build the application
npm run build

# Run in development mode
npm run dev
```

**Expected Result:**
- Electron window opens
- Preload logs appear in console
- No "Not running in Electron environment" error
- `window.electronAPI` is available
- All features work correctly

## Technical Details

### Package.json Module Type
```json
{
  "type": "module"
}
```

This setting affects how Node.js interprets `.js` files:
- `.js` files = ES modules (import/export)
- `.cjs` files = CommonJS (require/module.exports) ← Our solution
- `.mjs` files = ES modules (explicit)

### Preload Output Format
```javascript
// index.cjs (CommonJS)
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");

const api = {
  app: { ... },
  db: { ... },
  // ... all IPC methods
};

electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
```

### Why This Approach?

1. **Explicit Format**: `.cjs` extension clearly indicates CommonJS
2. **Stable**: CommonJS is battle-tested for Electron preloads
3. **Automatic**: Build script handles renaming
4. **Compatible**: Works with `"type": "module"` in package.json
5. **No Breaking Changes**: API remains identical

## Alternative Solutions Considered

### ❌ Option 1: Remove "type": "module" from package.json
- Would break the ESM main process
- Not recommended for modern Electron apps

### ❌ Option 2: Convert preload to pure ESM
- Less stable in preload context
- Potential compatibility issues
- Electron preload ESM support varies by version

### ✅ Option 3: Use .cjs extension (CHOSEN)
- Explicit and clear
- Works with package.json settings
- Stable and well-supported
- Automatic via build script

## Status

✅ **FIXED** - Preload script now uses `.cjs` extension and loads correctly

**Build Status:** ✅ Success (10.60s)
**TypeScript Errors:** 0
**Preload Format:** CommonJS (.cjs)
**Exit Code:** 0

---

## Summary

The preload script wasn't running because Node.js expected ESM format (`.js` with `"type": "module"`) but found CommonJS. The fix: use `.cjs` extension to explicitly mark the file as CommonJS, which works regardless of package.json settings.

**Key Change:** `index.js` → `index.cjs` for the preload script

This simple extension change solves the module system conflict and allows the preload script to execute correctly, exposing `window.electronAPI` to the renderer process.

---

*Fix completed: December 14, 2025*
*Solution: Use .cjs extension for CommonJS preload with "type": "module" package.json*
