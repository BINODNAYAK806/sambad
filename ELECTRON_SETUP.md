# Sambad - Electron Desktop Application Setup Guide

## Important Note
This is an **Electron desktop application** and cannot run in Bolt.new's browser environment.
You need to set this up locally on your machine.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

## Quick Start

### 1. Download the Project
Copy all files from this project to your local machine.

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
```bash
npm run dev
```
This will:
- Start Vite dev server for the renderer
- Launch Electron with hot-reload enabled
- Open the Sambad desktop application

### 4. Build for Production
```bash
npm run build
```

This creates distributable packages in the `dist/` folder:
- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage` or `.deb`

## Project Structure

```
sambad/
├── electron/
│   ├── main/
│   │   └── main.ts          # Main Electron process
│   ├── preload/
│   │   └── preload.ts       # Secure IPC bridge
│   └── worker/              # Future worker threads
├── src/
│   ├── renderer/            # React application
│   │   ├── components/      # React components
│   │   ├── App.tsx         # Main React app
│   │   └── main.tsx        # React entry point
│   └── types/              # TypeScript definitions
├── assets/                  # Icons and images
├── dist/                    # Build output
└── package.json
```

## Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build production app
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

## Security Features

✅ nodeIntegration disabled
✅ contextIsolation enabled
✅ Secure contextBridge IPC
✅ Content Security Policy
✅ Typed IPC communication

## Tech Stack

- **Electron** - Desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives
- **electron-builder** - Packaging tool

## Next Steps

1. Customize the UI in `src/renderer/`
2. Add IPC handlers in `electron/main/main.ts`
3. Expose APIs in `electron/preload/preload.ts`
4. Build your features (WhatsApp automation, workers, etc.)

## Troubleshooting

**Electron window doesn't open:**
- Make sure port 5173 is available
- Check console for errors
- Try `npm run dev` again

**Build fails:**
- Run `npm run typecheck` to find TypeScript errors
- Ensure all dependencies are installed
- Clear `dist/` and rebuild

**IPC not working:**
- Check preload script is loaded
- Verify contextBridge API is exposed
- Check main process IPC handlers

---

Built with ❤️ for production-grade desktop applications
