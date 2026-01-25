# Sambad - Production Electron Application

## Overview

Production-grade Electron desktop application with:
- **Electron** - Desktop application framework
- **React 18** - UI library with hooks
- **TypeScript** - Full type safety
- **Material UI** - Modern React component library
- **Vite** - Fast build tool and dev server
- **Supabase** - Database and backend services

## Architecture

```
sambad/
├── electron/
│   ├── main/
│   │   ├── index.ts           # Main Electron process
│   │   └── supabase.ts        # Supabase integration
│   ├── preload/
│   │   └── index.ts           # Secure IPC bridge
│   └── worker/                # Worker threads (future)
├── src/
│   └── renderer/
│       ├── index.html         # HTML entry
│       ├── index.tsx          # React entry
│       ├── App.tsx            # Main React component
│       └── types/
│           └── electron.d.ts  # TypeScript definitions
├── assets/                    # Icons and resources
├── dist/                      # Build output
└── release/                   # Packaged apps
```

## Security Features

✅ **nodeIntegration: false** - Renderer cannot access Node.js
✅ **contextIsolation: true** - Isolated JavaScript contexts
✅ **sandbox: false** - Required for preload script
✅ **Secure IPC** - Only exposed APIs via contextBridge
✅ **Content Security Policy** - Restricts resource loading

## IPC Methods

### App Methods
- `app.getInfo()` - Get application information
- `app.getPath(name)` - Get system paths
- `app.quit()` - Quit application

### Database Methods
- `db.query(sql, params)` - Execute SQL query
- `db.insert(table, data)` - Insert record
- `db.update(table, id, data)` - Update record
- `db.delete(table, id)` - Delete record

### Contact Methods
- `contacts.list()` - List all contacts
- `contacts.create(contact)` - Create new contact
- `contacts.update(id, contact)` - Update contact
- `contacts.delete(id)` - Delete contact

### Campaign Methods
- `campaigns.list()` - List all campaigns
- `campaigns.create(campaign)` - Create new campaign
- `campaigns.update(id, campaign)` - Update campaign
- `campaigns.delete(id)` - Delete campaign
- `campaigns.start(id)` - Start campaign
- `campaigns.stop(id)` - Stop campaign

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Steps

1. **Clone or copy all files to your local machine**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run development mode:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Development

### Running Dev Server

```bash
npm run dev
```

This will:
1. Start Vite dev server on port 5173
2. Compile TypeScript for Electron
3. Launch Electron with hot-reload

### Type Checking

```bash
npm run typecheck
```

Checks TypeScript types for:
- Main process
- Preload script
- Renderer process

### Linting

```bash
npm run lint
```

## Building

### Development Build

```bash
npm run build:electron
```

Compiles TypeScript for Electron main and preload.

### Production Build

```bash
npm run build
```

Creates distributable packages in `release/` folder:

**Windows:**
- `Sambad-Setup-1.0.0.exe` (installer)
- `Sambad-1.0.0.exe` (portable)

**macOS:**
- `Sambad-1.0.0.dmg` (installer)
- `Sambad-1.0.0-mac.zip` (portable)

**Linux:**
- `Sambad-1.0.0.AppImage` (universal)
- `sambad_1.0.0_amd64.deb` (Debian/Ubuntu)

## Supabase Integration

### Setup

1. Create a Supabase project at https://supabase.com

2. Get your credentials:
   - Project URL
   - Anon key

3. Add to `.env`:
   ```
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Database Schema

Create these tables in Supabase:

**contacts table:**
```sql
CREATE TABLE contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**campaigns table:**
```sql
CREATE TABLE campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'draft',
  contacts INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Adding New IPC Handlers

### 1. Add handler in main process

`electron/main/index.ts`:
```typescript
ipcMain.handle('myFeature:action', async (_event, arg) => {
  // Implementation
  return { success: true, data: result };
});
```

### 2. Expose in preload

`electron/preload/index.ts`:
```typescript
const api = {
  // ... existing
  myFeature: {
    action: (arg: string) => ipcRenderer.invoke('myFeature:action', arg),
  },
};
```

### 3. Update TypeScript types

Types are automatically inferred from the preload API.

### 4. Use in React

```typescript
const result = await window.electronAPI.myFeature.action('test');
```

## Material UI Theme Customization

Edit theme in `src/renderer/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark'
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});
```

## Worker Threads

Place worker scripts in `electron/worker/` folder.

Example worker:
```typescript
// electron/worker/example.ts
import { parentPort } from 'worker_threads';

parentPort?.on('message', (data) => {
  // Process data
  parentPort?.postMessage({ result: 'done' });
});
```

Use from main process:
```typescript
import { Worker } from 'worker_threads';

const worker = new Worker('./electron/worker/example.js');
worker.postMessage({ task: 'process' });
worker.on('message', (result) => {
  console.log(result);
});
```

## Troubleshooting

### Port 5173 already in use
```bash
lsof -ti:5173 | xargs kill -9  # macOS/Linux
```

### Electron won't start
- Check Node.js version: `node --version` (need 18+)
- Clear dist: `rm -rf dist`
- Rebuild: `npm run build:electron`

### TypeScript errors
```bash
npm run typecheck
```

### IPC not working
- Verify preload path in `electron/main/index.ts`
- Check API is exposed in `electron/preload/index.ts`
- Ensure types are up to date

### Build fails
- Run `npm run typecheck` first
- Check all dependencies are installed
- Clear `dist` and `release` folders

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode |
| `npm run dev:renderer` | Start Vite dev server only |
| `npm run dev:electron` | Start Electron only |
| `npm run build` | Build production packages |
| `npm run build:renderer` | Build React app |
| `npm run build:electron` | Compile Electron TypeScript |
| `npm run build:main` | Compile main process |
| `npm run build:preload` | Compile preload script |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 28.x | Desktop framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Material UI | 5.x | Component library |
| Vite | 5.x | Build tool |
| Supabase | 2.x | Database |

## License

MIT

## Support

For issues and questions, check:
- Electron docs: https://www.electronjs.org/docs
- React docs: https://react.dev
- Material UI docs: https://mui.com
- Supabase docs: https://supabase.com/docs
