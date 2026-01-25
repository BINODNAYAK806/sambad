# Console Window System - Complete Guide

Standalone console window for monitoring logs, errors, and system events in Sambad Electron app.

---

## 📋 Overview

The Console Window system provides a separate dev/debugging interface with:

- ✅ Separate window (not visible on home screen)
- ✅ "Open Console" button to launch
- ✅ Real-time log streaming via IPC
- ✅ Categorized logs: Worker, System, Browser, IPC, General
- ✅ Log levels: Info, Warn, Error, Debug
- ✅ Search and filter capabilities
- ✅ Auto-scroll toggle
- ✅ Clear logs button
- ✅ Detailed log inspection
- ✅ Live statistics

---

## 🏗️ Architecture

```
Main Window                   Console Window
    ↓                              ↓
Open Console Button  →  IPC → consoleWindow.ts
    ↓                              ↓
logManager  ←────────────→  ConsoleView.tsx
    ↓                              ↓
Log Events  ────────────→  Real-time Updates
```

### Components

1. **LogManager** (`electron/main/logManager.ts`)
   - Centralized logging system
   - Stores up to 1000 logs in memory
   - Broadcasts to console window
   - Console and file logging

2. **Console Window Manager** (`electron/main/consoleWindow.ts`)
   - Creates/manages console window
   - Separate browser window
   - Auto-focus handling
   - Lifecycle management

3. **ConsoleView** (`src/renderer/components/ConsoleView.tsx`)
   - React UI for log display
   - Real-time updates
   - Filtering and search
   - Log inspection

4. **OpenConsoleButton** (`src/renderer/components/OpenConsoleButton.tsx`)
   - Button component for main app
   - Opens console window
   - Simple integration

---

## 🚀 Quick Start

### 1. Add Button to Main App

```tsx
import OpenConsoleButton from './renderer/components/OpenConsoleButton';

function App() {
  return (
    <div>
      <header>
        <OpenConsoleButton />
      </header>
      {/* Rest of app */}
    </div>
  );
}
```

### 2. Use LogManager in Main Process

```typescript
import { logManager } from './main/logManager';

logManager.info('system', 'Application started');
logManager.warn('worker', 'Worker thread paused');
logManager.error('browser', 'Window failed to load', error);
logManager.debug('ipc', 'IPC message received', data);
```

### 3. Open Console

```typescript
// From renderer process
await window.electronAPI.console.open();

// Or toggle
await window.electronAPI.console.toggle();

// Or close
await window.electronAPI.console.close();
```

---

## 📝 LogManager API

### Log Methods

```typescript
import { logManager } from './main/logManager';

// Info level
logManager.info(category, message, data?);

// Warning level
logManager.warn(category, message, data?);

// Error level
logManager.error(category, message, data?);

// Debug level
logManager.debug(category, message, data?);
```

### Categories

```typescript
type Category =
  | 'worker'   // Worker thread events
  | 'system'   // System/app events
  | 'browser'  // Browser window events
  | 'ipc'      // IPC communication
  | 'general'  // General logs
```

### Log Entry Structure

```typescript
interface LogEntry {
  id: string;                  // Unique ID
  timestamp: number;           // Unix timestamp
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
  message: string;             // Log message
  data?: any;                  // Optional data
}
```

### Additional Methods

```typescript
// Get all logs
const logs = logManager.getLogs();

// Clear logs
logManager.clearLogs();

// Get by category
const workerLogs = logManager.getLogsByCategory('worker');

// Get by level
const errors = logManager.getLogsByLevel('error');

// Set console window reference
logManager.setConsoleWindow(window);
```

---

## 🎨 ConsoleView Features

### Search

```
Type in search box → Filters logs by message or data content
```

### Filter by Level

```
All Levels → Shows all logs with count
Error (5) → Shows only errors
Warn (12) → Shows only warnings
Info (45) → Shows only info logs
Debug (8) → Shows only debug logs
```

### Filter by Category

```
All Categories → Shows all
Worker → Worker thread logs only
System → System events only
Browser → Browser window logs only
IPC → IPC communication logs only
General → General logs only
```

### Auto-scroll

```
☑ Auto-scroll → Automatically scrolls to new logs
☐ Auto-scroll → Manual scroll control
```

### Log Inspection

```
Click "Show details" → Expands data object
→ JSON formatted
→ Syntax highlighted
```

### Statistics

```
Errors: 5
Warnings: 12
Info: 45
Debug: 8
Total: 70
```

---

## 🔌 IPC API

### Methods

```typescript
// Open console window
window.electronAPI.console.open()
→ Promise<DbResult>

// Close console window
window.electronAPI.console.close()
→ Promise<DbResult>

// Toggle console window
window.electronAPI.console.toggle()
→ Promise<DbResult>

// Get all logs
window.electronAPI.console.getLogs()
→ Promise<DbResult<LogEntry[]>>

// Clear all logs
window.electronAPI.console.clearLogs()
→ Promise<DbResult>
```

### Events

```typescript
// Listen for new logs
const unsubscribe = window.electronAPI.console.onNewLog((log) => {
  console.log('New log:', log);
});

// Listen for logs cleared
const unsubscribe = window.electronAPI.console.onLogsCleared(() => {
  console.log('Logs cleared');
});

// Cleanup
unsubscribe();
```

---

## 💡 Usage Examples

### Example 1: Log Worker Events

```typescript
// In electron/main/workerManager.ts
import { logManager } from './logManager';

export class WorkerManager {
  startWorker() {
    logManager.info('worker', 'Starting worker thread');

    this.worker.on('message', (msg) => {
      logManager.debug('worker', 'Worker message received', msg);
    });

    this.worker.on('error', (error) => {
      logManager.error('worker', 'Worker error', error);
    });
  }
}
```

### Example 2: Log IPC Calls

```typescript
// In electron/main/index.ts
import { logManager } from './logManager';

ipcMain.handle('campaign:start', async (_event, campaign) => {
  logManager.info('ipc', `Starting campaign: ${campaign.id}`);

  try {
    await workerManager.startCampaign(campaign);
    logManager.info('ipc', `Campaign started successfully`);
    return { success: true };
  } catch (error) {
    logManager.error('ipc', 'Failed to start campaign', error);
    return { success: false, error: error.message };
  }
});
```

### Example 3: Log Browser Events

```typescript
// In electron/main/index.ts
import { logManager } from './logManager';

function createWindow() {
  logManager.info('browser', 'Creating main window');

  mainWindow = new BrowserWindow({...});

  mainWindow.once('ready-to-show', () => {
    logManager.info('browser', 'Main window ready');
  });

  mainWindow.on('closed', () => {
    logManager.info('browser', 'Main window closed');
  });

  mainWindow.webContents.on('did-fail-load', (event, code, desc) => {
    logManager.error('browser', 'Failed to load', { code, desc });
  });
}
```

### Example 4: Log System Events

```typescript
// In electron/main/index.ts
import { logManager } from './logManager';

app.whenReady().then(() => {
  logManager.info('system', 'App ready');

  const env = process.env.NODE_ENV;
  const platform = process.platform;

  logManager.info('system', 'Environment info', {
    env,
    platform,
    version: app.getVersion()
  });
});

app.on('before-quit', () => {
  logManager.info('system', 'App quitting');
});
```

### Example 5: Custom Console Button

```tsx
import { Terminal } from 'lucide-react';

function CustomToolbar() {
  const [consoleOpen, setConsoleOpen] = useState(false);

  const toggleConsole = async () => {
    await window.electronAPI.console.toggle();
    setConsoleOpen(!consoleOpen);
  };

  return (
    <button onClick={toggleConsole}>
      <Terminal />
      {consoleOpen ? 'Hide Console' : 'Show Console'}
    </button>
  );
}
```

### Example 6: Monitor Logs in App

```tsx
import { useEffect, useState } from 'react';
import type { LogEntry } from '../../../electron/preload/index';

function LogMonitor() {
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const unsubscribe = window.electronAPI.console.onNewLog((log) => {
      if (log.level === 'error') {
        setErrorCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      {errorCount > 0 && (
        <Alert variant="destructive">
          {errorCount} errors detected. Check console.
        </Alert>
      )}
    </div>
  );
}
```

---

## 🎯 Log Categories Guide

### Worker Category

Use for WhatsApp worker thread events:
```typescript
logManager.info('worker', 'Worker initialized');
logManager.warn('worker', 'Worker queue full');
logManager.error('worker', 'Worker crashed', error);
logManager.debug('worker', 'Processing message', data);
```

### System Category

Use for app-level events:
```typescript
logManager.info('system', 'App started');
logManager.warn('system', 'Low memory');
logManager.error('system', 'Critical failure', error);
logManager.debug('system', 'Config loaded', config);
```

### Browser Category

Use for window/browser events:
```typescript
logManager.info('browser', 'Window created');
logManager.warn('browser', 'Window unresponsive');
logManager.error('browser', 'Window crashed', error);
logManager.debug('browser', 'DevTools opened');
```

### IPC Category

Use for IPC communication:
```typescript
logManager.info('ipc', 'Handler registered: campaign:start');
logManager.warn('ipc', 'IPC timeout');
logManager.error('ipc', 'IPC handler failed', error);
logManager.debug('ipc', 'IPC call', { channel, args });
```

### General Category

Use for uncategorized logs:
```typescript
logManager.info('general', 'Operation completed');
logManager.warn('general', 'Deprecated feature used');
logManager.error('general', 'Unexpected error', error);
logManager.debug('general', 'Debug info', data);
```

---

## 🎨 Customization

### Custom Log Colors

The ConsoleView uses color-coded badges:
- **Error**: Red background
- **Warn**: Yellow background
- **Info**: Blue background
- **Debug**: Purple background

### Custom Categories

To add custom categories:

1. Update type in `logManager.ts`:
```typescript
type Category = 'worker' | 'system' | 'browser' | 'ipc' | 'general' | 'database' | 'auth';
```

2. Update type in `preload/index.ts`:
```typescript
category: 'worker' | 'system' | 'browser' | 'ipc' | 'general' | 'database' | 'auth';
```

3. Add color in `ConsoleView.tsx`:
```typescript
const colors = {
  worker: 'bg-green-100 text-green-700',
  system: 'bg-blue-100 text-blue-700',
  browser: 'bg-purple-100 text-purple-700',
  ipc: 'bg-orange-100 text-orange-700',
  general: 'bg-gray-100 text-gray-700',
  database: 'bg-cyan-100 text-cyan-700',
  auth: 'bg-pink-100 text-pink-700',
};
```

---

## 📦 Files Reference

### Core Implementation
```
electron/main/
  ├── logManager.ts           # Centralized logging
  ├── consoleWindow.ts        # Window manager
  └── index.ts                # IPC handlers

electron/preload/
  └── index.ts                # IPC bridge with console API

src/renderer/components/
  ├── ConsoleView.tsx         # Main console UI
  └── OpenConsoleButton.tsx   # Button component

src/
  └── console.tsx             # Console entry point

console.html                  # Console HTML entry
```

### Build Configuration
```
vite.config.ts               # Multi-page setup
tsconfig.app.json            # TypeScript config
```

---

## 🚀 Running

### Development
```bash
npm run dev
# Main app runs at http://localhost:5173
# Console at http://localhost:5173/console.html
```

### Build
```bash
npm run build
# Builds both main and console pages
```

### Electron
```bash
npm run electron:dev
# Runs full Electron app with console support
```

---

## ✅ Features Summary

- ✅ **Separate Window**: Console in dedicated window
- ✅ **Not on Home**: Hidden until opened
- ✅ **Open Button**: Simple integration
- ✅ **Real-time Logs**: Live streaming via IPC
- ✅ **5 Categories**: Worker, System, Browser, IPC, General
- ✅ **4 Log Levels**: Info, Warn, Error, Debug
- ✅ **Search**: Full-text search
- ✅ **Filters**: By level and category
- ✅ **Auto-scroll**: Toggle automatic scrolling
- ✅ **Clear Logs**: One-click clear
- ✅ **Detailed View**: Expandable log data
- ✅ **Statistics**: Live counters
- ✅ **Color Coded**: Visual log levels
- ✅ **Timestamps**: Millisecond precision
- ✅ **1000 Log Buffer**: Memory efficient
- ✅ **Type Safe**: Full TypeScript support

---

## 🎉 Complete!

The Console Window system is ready for debugging and monitoring your Electron application!

**Integration Steps:**
1. Add `<OpenConsoleButton />` to your app
2. Use `logManager` throughout main process
3. Open console to view logs
4. Filter, search, and inspect logs

**Best Practices:**
- Use appropriate log levels (debug < info < warn < error)
- Use correct categories for organization
- Include relevant data in log entries
- Clear logs periodically
- Monitor error counts

---

**Sambad Console Window System**
_Built with Electron + React + TypeScript + IPC_
