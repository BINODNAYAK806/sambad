# Sambad - Minimal Electron Setup Guide

This guide provides instructions for setting up the **minimal** Electron + React + TypeScript configuration for Sambad.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sambad
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

This single command will:
- Start Vite dev server on `http://localhost:5173`
- Compile Electron TypeScript files
- Launch Electron app
- Open DevTools automatically

### 3. Test the Setup

Once the app opens, DevTools will be open by default. Run these tests in the console:

```javascript
// Test app info
await window.electronAPI.app.getInfo()
// Should return: { name: "sambad", version: "1.0.0", ... }

// Test contacts list (returns stub data)
await window.electronAPI.contacts.list()
// Should return: { success: true, data: [] }

// Test campaigns list (returns stub data)
await window.electronAPI.campaigns.list()
// Should return: { success: true, data: [] }
```

**Note:** All IPC handlers return stub data in this minimal setup.

## 📂 Project Structure

```
sambad/
├── electron/                    # Electron main & preload processes
│   ├── main/
│   │   ├── index.ts            # Full main process (with workers)
│   │   └── index.minimal.ts    # Minimal main process (no workers)
│   └── preload/
│       ├── index.ts            # Full preload (with all APIs)
│       └── index.minimal.ts    # Minimal preload (ping only)
│
├── src/                        # React renderer process
│   ├── renderer/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── renderer/types/
│       ├── electron.d.ts       # Full type definitions
│       └── electron.minimal.d.ts # Minimal type definitions
│
├── dist/                       # Vite build output (renderer)
├── dist-electron/              # TypeScript build output (main + preload)
│   ├── main/
│   │   └── index.js
│   └── preload/
│       └── index.js
│
├── package.json                # Electron + Vite scripts
├── tsconfig.json               # Base TypeScript config
├── tsconfig.renderer.json      # Renderer TypeScript config
├── tsconfig.electron.json      # Electron TypeScript config
└── vite.config.ts              # Vite configuration
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Electron in dev mode |
| `npm run dev:vite` | Start only Vite dev server |
| `npm run dev:electron` | Build Electron files and launch app |
| `npm run build` | Build renderer + Electron for production |
| `npm run build:renderer` | Build only React app |
| `npm run build:electron` | Compile only Electron TypeScript |
| `npm run preview` | Preview production build (Vite only) |
| `npm run typecheck` | Type-check all TypeScript files |
| `npm run lint` | Run ESLint |

## 🔄 Configuration Status

### Current Setup: Minimal (Pre-Configured)

✅ The project is **already configured** for minimal setup.
✅ No manual file copying required.
✅ Just run `npm install` and `npm run dev`.

The following files are actively used:
- `electron/main/index.ts` - Minimal main process (no workers)
- `electron/preload/index.ts` - Full API surface (stub implementations)
- `src/renderer/types/electron.d.ts` - Complete type definitions

Backup files for reference:
- `electron/main/index.minimal.ts`
- `electron/preload/index.minimal.ts`
- `src/renderer/types/electron.minimal.d.ts`

### Switching to Full Setup (With Workers)

To enable WhatsApp workers and full functionality:

1. Restore original files from git history, or
2. Manually integrate worker imports back into main/preload files
3. Update `tsconfig.electron.json` to include worker files
4. Install additional dependencies if needed

**Note:** The full setup files are preserved in the repository but not currently active.

## 🐛 Troubleshooting

### Electron window opens but is blank

**Cause:** Vite dev server not ready yet
**Solution:** The `wait-on` package should handle this automatically. If it doesn't work, increase the timeout in `package.json`:

```json
"dev:electron": "wait-on -t 10000 http://localhost:5173 && npm run build:electron && electron ."
```

### TypeScript compilation errors

**Cause:** Missing type definitions
**Solution:** Run type check to see specific errors:

```bash
npm run typecheck
```

### Port 5173 already in use

**Cause:** Another Vite server running
**Solution:** Kill the process or change port in `vite.config.ts`:

```typescript
server: {
  port: 5174, // Change port
  strictPort: true,
}
```

### IPC handlers not working

**Cause:** Preload script not loaded correctly
**Solution:** Check the preload path in `electron/main/index.ts`:

```typescript
preload: path.join(__dirname, '../preload/index.js')
```

Make sure the path points to the compiled `.js` file in `dist-electron/preload/`.

## 📚 Next Steps

1. ✅ Verify the basic setup works
2. ✅ Test IPC communication with `window.sambad.ping()`
3. 🚧 Add more IPC handlers as needed
4. 🚧 Integrate WhatsApp worker (for production)
5. 🚧 Add electron-builder for packaging

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

These will be available in the renderer process via `import.meta.env.VITE_*`

## ⚠️ Important Notes

- **Minimal Setup:** The current setup uses `index.minimal.ts` files that DO NOT include WhatsApp worker logic
- **Production Build:** To build for production, you'll need to add `electron-builder` configuration
- **Code Signing:** Not configured yet (required for macOS distribution)
- **Auto-Updates:** Not configured yet (uses electron-updater in full setup)

## 📖 Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Need Help?** Check the troubleshooting section above or review the full setup in the original files.
