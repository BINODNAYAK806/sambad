# Sambad - Production-Grade Electron Desktop Application

<div align="center">
  <h3>Modern Communication Platform</h3>
  <p>Built with Electron • React • TypeScript • shadcn/ui</p>
</div>

---

## Overview

**Sambad** is a production-ready desktop application template featuring:

- **Electron 28** - Cross-platform desktop framework
- **React 18** - Modern UI library with hooks
- **TypeScript** - Full type safety across main & renderer
- **Vite** - Lightning-fast dev server & build tool
- **shadcn/ui** - Beautiful, accessible components
- **TailwindCSS** - Utility-first styling
- **Secure IPC** - contextBridge for safe communication

---

## Architecture

### Main Process (`electron/main/`)
Node.js environment that controls application lifecycle, creates windows, and handles system-level operations.

### Preload Script (`electron/preload/`)
Secure bridge between main and renderer using `contextBridge`. Exposes only necessary APIs.

### Renderer Process (`src/renderer/`)
React application running in Chromium. Isolated from Node.js for security.

### Worker Threads (`electron/worker/`)
Future location for background tasks, queue processing, and heavy computations.

---

## Features

### Security
- ✅ Node integration disabled in renderer
- ✅ Context isolation enabled
- ✅ Secure IPC via contextBridge
- ✅ Content Security Policy configured
- ✅ Fully typed IPC calls

### UI/UX
- Modern dashboard with sidebar navigation
- Responsive design with TailwindCSS
- 70+ shadcn/ui components available
- Dark mode ready
- Accessible components (Radix UI)

### Developer Experience
- Hot module reload in development
- TypeScript everywhere
- ESLint configured
- Clear folder structure
- Production-ready build process

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Copy all files** from Bolt.new to local folder (see `FOLDER_STRUCTURE.md`)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development mode:**
   ```bash
   npm run dev
   ```

   This starts:
   - Vite dev server on `http://localhost:5173`
   - Electron app with hot reload

4. **Build for production:**
   ```bash
   npm run build
   ```

   Creates installers in `dist/`:
   - Windows: `.exe`
   - macOS: `.dmg`
   - Linux: `.AppImage`, `.deb`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode |
| `npm run build` | Build production app |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |

---

## Project Structure

```
sambad/
├── electron/
│   ├── main/main.ts              # Main Electron process
│   ├── preload/preload.ts        # IPC bridge
│   └── worker/                   # Worker threads
├── src/
│   ├── renderer/
│   │   ├── App.tsx              # Main React app
│   │   └── main.tsx             # React entry
│   ├── components/ui/           # shadcn/ui components
│   ├── types/electron.d.ts      # TypeScript definitions
│   └── index.css                # Global styles
├── assets/                       # App icons
├── dist-electron/               # Compiled electron code
├── dist-renderer/               # Built React app
└── dist/                        # Final distributables
```

---

## Adding Features

### Adding a new IPC handler

**1. Main process** (`electron/main/main.ts`):
```typescript
ipcMain.handle('myFeature:doSomething', async (event, arg) => {
  return { result: 'success' };
});
```

**2. Preload script** (`electron/preload/preload.ts`):
```typescript
const electronAPI = {
  // ... existing APIs
  doSomething: (arg: string): Promise<any> =>
    ipcRenderer.invoke('myFeature:doSomething', arg),
};
```

**3. Update types** (`src/types/electron.d.ts`):
```typescript
export type ElectronAPI = {
  // ... existing types
  doSomething: (arg: string) => Promise<any>;
};
```

**4. Use in React** (`src/renderer/App.tsx`):
```typescript
const result = await window.electronAPI.doSomething('test');
```

### Adding UI Components

All shadcn/ui components are available:
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
```

Browse available components:
https://ui.shadcn.com/docs/components

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Desktop application framework |
| **React** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **TailwindCSS** | Utility-first CSS |
| **shadcn/ui** | Component library |
| **Radix UI** | Accessible primitives |
| **Lucide** | Icon system |
| **electron-builder** | App packaging |

---

## Build Configuration

Configured in `package.json` under `"build"`:

```json
{
  "appId": "com.sambad.app",
  "productName": "Sambad",
  "mac": { "target": ["dmg", "zip"] },
  "win": { "target": ["nsis", "portable"] },
  "linux": { "target": ["AppImage", "deb"] }
}
```

Customize as needed for your distribution requirements.

---

## Security Best Practices

1. **Never** enable `nodeIntegration` in renderer
2. **Always** use `contextIsolation: true`
3. **Only** expose necessary APIs via preload
4. **Validate** all IPC inputs in main process
5. **Use** Content Security Policy
6. **Keep** Electron updated

---

## Future Roadmap

- [ ] WhatsApp automation module
- [ ] Background worker threads
- [ ] Task queue system
- [ ] Database integration
- [ ] Auto-updater
- [ ] Crash reporting
- [ ] Analytics dashboard

---

## Troubleshooting

### App won't start
- Check that port 5173 is available
- Run `npm run typecheck` to find errors
- Clear `dist-electron` and retry

### IPC not working
- Verify preload script path in `main.ts`
- Check API is exposed in `preload.ts`
- Ensure handler exists in `main.ts`

### Build fails
- Run `npm run lint` and fix errors
- Check all TypeScript configs are correct
- Ensure all dependencies are installed

---

## License

MIT

---

## Support

For issues and questions:
1. Check `ELECTRON_SETUP.md`
2. Review `FOLDER_STRUCTURE.md`
3. Check official docs:
   - [Electron](https://www.electronjs.org/docs)
   - [React](https://react.dev)
   - [shadcn/ui](https://ui.shadcn.com)

---

**Built with ❤️ for production-grade desktop applications**
