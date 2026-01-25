# Sambad - Complete Folder Structure

Copy all files from Bolt.new to your local machine following this structure:

```
sambad/
│
├── electron/
│   ├── main/
│   │   └── main.ts                    # Copy from: electron-main.ts
│   ├── preload/
│   │   └── preload.ts                 # Copy from: electron-preload.ts
│   └── worker/                        # Empty folder for future workers
│
├── src/
│   ├── renderer/
│   │   ├── App.tsx                    # Copy from: electron-renderer-App.tsx
│   │   └── main.tsx                   # Copy from: electron-renderer-main.tsx
│   ├── types/
│   │   └── electron.d.ts              # Copy from: electron-types.d.ts
│   ├── components/                    # Copy entire src/components folder (shadcn/ui)
│   ├── hooks/                         # Copy entire src/hooks folder
│   ├── lib/                           # Copy entire src/lib folder
│   └── index.css                      # Copy from: src/index.css
│
├── assets/                            # Create this folder for app icons
│   └── icon.png                       # (Add your app icon later)
│
├── index.html                         # Copy from: electron-index.html
├── package.json                       # Copy from: electron-package.json
├── vite.config.ts                     # Copy from: electron-vite.config.ts
├── tsconfig.json                      # Copy existing
├── tsconfig.app.json                  # Copy existing
├── tsconfig.electron.json             # Copy from: tsconfig.electron.json
├── tailwind.config.js                 # Copy existing
├── postcss.config.js                  # Copy existing
├── components.json                    # Copy existing
├── eslint.config.js                   # Copy existing
├── .gitignore                         # Copy existing + add electron-specific
└── README.md                          # New readme (below)
```

## Step-by-Step Setup

### 1. Create Project Folder
```bash
mkdir sambad
cd sambad
```

### 2. Copy Files
Copy all files from Bolt.new to their respective locations according to the structure above.

**Important file mappings:**
- `electron-main.ts` → `electron/main/main.ts`
- `electron-preload.ts` → `electron/preload/preload.ts`
- `electron-types.d.ts` → `src/types/electron.d.ts`
- `electron-renderer-App.tsx` → `src/renderer/App.tsx`
- `electron-renderer-main.tsx` → `src/renderer/main.tsx`
- `electron-index.html` → `index.html`
- `electron-package.json` → `package.json`
- `electron-vite.config.ts` → `vite.config.ts`

### 3. Copy UI Components
Copy these entire folders:
- `src/components/` (all shadcn/ui components)
- `src/hooks/`
- `src/lib/`

### 4. Update .gitignore
Add to your `.gitignore`:
```
dist-electron
dist-renderer
dist
*.log
```

### 5. Install & Run
```bash
npm install
npm run dev
```

## Troubleshooting

**If files are in wrong locations:**
- Main process won't compile → check `electron/main/main.ts`
- Preload script missing → check `electron/preload/preload.ts`
- React app won't load → check `src/renderer/` files
- Types not working → check `src/types/electron.d.ts`

**Build errors:**
- Run `npm run typecheck` to find TypeScript issues
- Ensure all paths in `vite.config.ts` are correct
- Check that `tsconfig.electron.json` includes correct files
