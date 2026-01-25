# Sambad - Quick Start Guide

## Copy Files from Bolt.new to Local Machine

### Step 1: Download/Copy All Files

From Bolt.new, download or copy these files to your local machine:

**Create a new folder:**
```bash
mkdir sambad
cd sambad
```

### Step 2: File Mapping

Create the following structure and copy files:

#### Create folders:
```bash
mkdir -p electron/main
mkdir -p electron/preload
mkdir -p electron/worker
mkdir -p src/renderer
mkdir -p src/types
mkdir -p assets
```

#### Copy main files:

| Bolt.new File | → | Local Location |
|---------------|---|----------------|
| `electron-package.json` | → | `package.json` |
| `electron-main.ts` | → | `electron/main/main.ts` |
| `electron-preload.ts` | → | `electron/preload/preload.ts` |
| `electron-types.d.ts` | → | `src/types/electron.d.ts` |
| `electron-renderer-App.tsx` | → | `src/renderer/App.tsx` |
| `electron-renderer-main.tsx` | → | `src/renderer/main.tsx` |
| `electron-index.html` | → | `index.html` |
| `electron-vite.config.ts` | → | `vite.config.ts` |
| `tsconfig.electron.json` | → | `tsconfig.electron.json` |

#### Copy existing files as-is:
- `src/index.css` → `src/index.css`
- `tailwind.config.js` → `tailwind.config.js`
- `postcss.config.js` → `postcss.config.js`
- `components.json` → `components.json`
- `eslint.config.js` → `eslint.config.js`
- `tsconfig.json` → `tsconfig.json`
- `tsconfig.app.json` → `tsconfig.app.json`

#### Copy entire folders:
- `src/components/` → `src/components/`
- `src/hooks/` → `src/hooks/`
- `src/lib/` → `src/lib/`

### Step 3: Create .gitignore

Create `.gitignore` file:
```
node_modules
dist
dist-electron
dist-renderer
*.log
.DS_Store
.env
.vite
```

### Step 4: Install Dependencies

```bash
npm install
```

Expected output: ~70+ packages installed

### Step 5: Run Development Mode

```bash
npm run dev
```

This will:
1. Start Vite dev server (port 5173)
2. Compile Electron TypeScript
3. Launch Sambad desktop app
4. Open DevTools automatically

### Step 6: Verify It Works

You should see:
- Desktop window titled "Sambad"
- Sidebar with Home, Contacts, Campaigns, Settings
- Welcome card with system information
- Example input and dialog components

### Step 7: Build for Production (Optional)

```bash
npm run build
```

Output location: `dist/` folder
- Windows: `Sambad-Setup-1.0.0.exe`
- macOS: `Sambad-1.0.0.dmg`
- Linux: `Sambad-1.0.0.AppImage`

---

## Common Issues

### Port 5173 already in use
```bash
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173   # Windows
```

### TypeScript errors
```bash
npm run typecheck
```

### Missing dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Electron won't start
- Check Node.js version: `node --version` (need 18+)
- Try: `npm run dev:vite` in one terminal, then `npm run dev:electron` in another

---

## What's Next?

1. **Customize UI** - Edit `src/renderer/App.tsx`
2. **Add features** - Create new IPC handlers
3. **Add modules** - Build WhatsApp automation, workers, etc.
4. **Deploy** - Build and distribute your app

---

## Need Help?

- Read `SAMBAD_README.md` for detailed documentation
- Check `FOLDER_STRUCTURE.md` for file organization
- Review `ELECTRON_SETUP.md` for setup details

**You're ready to build with Sambad!**
