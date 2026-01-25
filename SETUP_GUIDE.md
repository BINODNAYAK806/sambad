# Quick Setup Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git (optional)

## Step-by-Step Setup

### 1. Create Project Directory

```bash
mkdir sambad
cd sambad
```

### 2. Copy All Files

Copy these files to their respective locations:

```
sambad/
├── electron/
│   ├── main/
│   │   ├── index.ts
│   │   └── supabase.ts
│   ├── preload/
│   │   └── index.ts
│   └── worker/              (empty folder)
├── src/
│   └── renderer/
│       ├── types/
│       │   └── electron.d.ts
│       ├── index.html
│       ├── index.tsx
│       └── App.tsx
├── assets/                  (empty folder for icons)
├── package.json             (from package.production.json)
├── vite.renderer.config.ts
├── tsconfig.main.json
├── tsconfig.preload.json
├── tsconfig.renderer.json
├── tsconfig.node.json
├── .env.example
└── .gitignore
```

### 3. Rename Files

- Copy `package.production.json` as `package.json`

### 4. Install Dependencies

```bash
npm install
```

Expected output: ~50 packages installed

### 5. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials (optional for now).

### 6. Run Development Server

```bash
npm run dev
```

This will:
1. Start Vite on port 5173
2. Compile Electron TypeScript
3. Launch the Sambad desktop app

### 7. Verify It Works

You should see:
- Desktop window titled "Sambad"
- Material UI interface with sidebar
- Home, Contacts, Campaigns, Settings navigation
- System information card

## Build for Production

```bash
npm run build
```

Output in `release/` folder:
- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage` or `.deb`

## Common Issues

### Port Already in Use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### TypeScript Errors

```bash
npm run typecheck
```

### Missing Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ Get app running
2. Configure Supabase (see PRODUCTION_ELECTRON_README.md)
3. Create database tables
4. Start building features
5. Customize UI theme

## File Checklist

Before running, ensure these files exist:

- [ ] `electron/main/index.ts`
- [ ] `electron/preload/index.ts`
- [ ] `src/renderer/index.tsx`
- [ ] `src/renderer/App.tsx`
- [ ] `src/renderer/index.html`
- [ ] `package.json`
- [ ] `vite.renderer.config.ts`
- [ ] All `tsconfig.*.json` files

## Need Help?

Read the full documentation:
- `PRODUCTION_ELECTRON_README.md` - Complete documentation
- `FOLDER_STRUCTURE_GUIDE.md` - File organization

## Quick Commands

```bash
# Development
npm run dev

# Type checking
npm run typecheck

# Build production
npm run build

# Preview build
npm run preview
```

**You're ready to build!**
