# Campaign Monitor Guide

Complete guide for the CampaignMonitor component with live progress tracking.

---

## 📋 Overview

The CampaignMonitor system provides real-time progress tracking for WhatsApp campaigns with:

- ✅ Live progress bar with percentage
- ✅ Counters: Sent, Failed, Pending, Total
- ✅ Estimated time remaining (dynamic calculation)
- ✅ Current message indicator
- ✅ Control buttons: Pause, Resume, Stop
- ✅ QR code display for authentication
- ✅ Error handling and status badges
- ✅ Compact mode for embedded displays
- ✅ Automatic IPC subscription management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  CampaignMonitor Component                  │
│  ┌───────────────────────────────────────┐  │
│  │  useCampaignProgress Hook             │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  IPC Event Listeners            │  │  │
│  │  │  - onQrCode                     │  │  │
│  │  │  - onReady                      │  │  │
│  │  │  - onProgress                   │  │  │
│  │  │  - onComplete                   │  │  │
│  │  │  - onError                      │  │  │
│  │  │  - onPaused                     │  │  │
│  │  │  - onResumed                    │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                         │  │
│  │  State Management:                     │  │
│  │  - Campaign stats                      │  │
│  │  - Progress tracking                   │  │
│  │  - Time estimation                     │  │
│  │  - Control methods                     │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  UI Components:                              │
│  - Progress bar                              │
│  - Counter cards                             │
│  - Status badges                             │
│  - Control buttons                           │
│  - QR code display                           │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Basic Usage

```tsx
import CampaignMonitor from './renderer/components/CampaignMonitor';

function App() {
  return (
    <div>
      <CampaignMonitor />
    </div>
  );
}
```

### With Props

```tsx
<CampaignMonitor
  showControls={true}   // Show pause/resume/stop buttons
  compact={false}       // Compact mode for embedded displays
  className="my-4"      // Additional CSS classes
/>
```

### Compact Mode

```tsx
<CampaignMonitor compact={true} />
```

Output:
```
[===================>   ] 75%  45/60  [Running]
```

---

## 📝 Using the Custom Hook

### Basic Hook Usage

```tsx
import { useCampaignProgress } from './renderer/hooks/useCampaignProgress';

function MyComponent() {
  const { stats, controls, isWorkerReady } = useCampaignProgress();

  return (
    <div>
      <p>Progress: {stats.progress}%</p>
      <p>Sent: {stats.sentCount}/{stats.totalMessages}</p>
      <p>Status: {stats.status}</p>

      <button onClick={controls.pause}>Pause</button>
      <button onClick={controls.resume}>Resume</button>
      <button onClick={controls.stop}>Stop</button>
    </div>
  );
}
```

### Hook Return Values

```typescript
interface UseCampaignProgressResult {
  stats: CampaignStats;
  controls: {
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
  isWorkerReady: boolean;
}
```

### CampaignStats Interface

```typescript
interface CampaignStats {
  campaignId: string | null;
  status: 'idle' | 'authenticating' | 'ready' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;                  // 0-100
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  currentMessage: {
    id: string | null;
    recipientNumber: string | null;
    status: 'sent' | 'failed' | null;
  };
  error: string | null;
  qrCode: string | null;
  startTime: number | null;          // Timestamp
  estimatedTimeRemaining: number | null;  // Seconds
}
```

---

## 🎨 Component Props

### CampaignMonitor Props

```typescript
interface CampaignMonitorProps {
  showControls?: boolean;   // Default: true
  compact?: boolean;        // Default: false
  className?: string;       // Default: ''
}
```

**showControls**: Show/hide pause/resume/stop buttons
**compact**: Enable compact mode (single-line display)
**className**: Additional CSS classes for styling

---

## 📊 Features

### 1. Progress Bar

```tsx
// Automatic progress tracking (0-100%)
<Progress value={stats.progress} />
```

### 2. Counter Cards

```tsx
// Four counters with icons:
- Total messages
- Sent (green)
- Failed (red)
- Pending (blue)
```

### 3. Estimated Time

```tsx
// Dynamic calculation based on average message time
// Displayed in format: "5m 30s" or "2h 15m"
Estimated Time Remaining: {formatTime(stats.estimatedTimeRemaining)}
```

Algorithm:
```typescript
const avgTimePerMessage = elapsedTime / sentCount;
const remainingMessages = totalMessages - sentCount;
const estimatedMs = avgTimePerMessage * remainingMessages;
```

### 4. Status Badges

```tsx
- Idle (gray)
- Authenticating (yellow with spinner)
- Ready (green)
- Running (blue with spinner)
- Paused (orange)
- Completed (green)
- Error (red)
```

### 5. Current Message Indicator

```tsx
// Shown only when running
Current Message: Sending to 1234567890 [spinner]
```

### 6. QR Code Display

```tsx
// Auto-displays when authentication required
// Uses QR Server API for rendering
<img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrCode}`} />
```

### 7. Control Buttons

```tsx
// When Running:
[Pause] [Stop]

// When Paused:
[Resume] [Stop]
```

---

## 🔌 IPC Integration

### Already Configured

The IPC wiring is complete in:
- `/electron/preload/index.ts` - IPC bridge
- `/electron/main/index.ts` - IPC handlers
- `/electron/main/workerManager.ts` - Worker management

### IPC Methods (via electronAPI)

```typescript
// Start campaign
await window.electronAPI.campaignWorker.start(campaign);

// Control methods
await window.electronAPI.campaignWorker.pause();
await window.electronAPI.campaignWorker.resume();
await window.electronAPI.campaignWorker.stop();

// Get status
const status = await window.electronAPI.campaignWorker.getStatus();
```

### IPC Events (Auto-subscribed by Hook)

```typescript
// All events automatically subscribed in useCampaignProgress()
window.electronAPI.campaignWorker.onQrCode((qrCode) => { ... });
window.electronAPI.campaignWorker.onReady(() => { ... });
window.electronAPI.campaignWorker.onProgress((data) => { ... });
window.electronAPI.campaignWorker.onComplete((data) => { ... });
window.electronAPI.campaignWorker.onError((data) => { ... });
window.electronAPI.campaignWorker.onPaused((campaignId) => { ... });
window.electronAPI.campaignWorker.onResumed((campaignId) => { ... });
```

---

## 💡 Usage Examples

### Example 1: Basic Monitor

```tsx
import CampaignMonitor from './renderer/components/CampaignMonitor';

function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1>Campaign Dashboard</h1>
      <CampaignMonitor />
    </div>
  );
}
```

### Example 2: Custom UI with Hook

```tsx
import { useCampaignProgress } from './renderer/hooks/useCampaignProgress';

function CustomMonitor() {
  const { stats, controls } = useCampaignProgress();

  return (
    <div>
      <h2>Campaign: {stats.campaignId || 'None'}</h2>

      <div className="stats">
        <div>Total: {stats.totalMessages}</div>
        <div>Sent: {stats.sentCount}</div>
        <div>Failed: {stats.failedCount}</div>
        <div>Pending: {stats.pendingCount}</div>
      </div>

      <progress value={stats.progress} max={100} />

      {stats.status === 'running' && (
        <div>
          <p>ETA: {stats.estimatedTimeRemaining}s</p>
          <button onClick={controls.pause}>Pause</button>
        </div>
      )}

      {stats.status === 'paused' && (
        <button onClick={controls.resume}>Resume</button>
      )}
    </div>
  );
}
```

### Example 3: Sidebar Compact Monitor

```tsx
function Sidebar() {
  return (
    <aside className="w-64 border-r">
      <h3>Active Campaign</h3>
      <CampaignMonitor compact={true} />
    </aside>
  );
}
```

### Example 4: Multiple Monitors

```tsx
function MultiCampaignView() {
  // Note: Current implementation supports one active campaign
  // This is a conceptual example for future multi-campaign support

  return (
    <div className="grid grid-cols-2 gap-4">
      <CampaignMonitor showControls={false} />
      <CampaignMonitor showControls={false} />
    </div>
  );
}
```

### Example 5: With External Controls

```tsx
import { useCampaignProgress } from './renderer/hooks/useCampaignProgress';

function ExternalControls() {
  const { stats, controls } = useCampaignProgress();

  return (
    <div>
      <div className="toolbar">
        <button onClick={controls.pause} disabled={stats.status !== 'running'}>
          Pause
        </button>
        <button onClick={controls.resume} disabled={stats.status !== 'paused'}>
          Resume
        </button>
        <button onClick={controls.stop} disabled={stats.status === 'idle'}>
          Stop
        </button>
      </div>

      <CampaignMonitor showControls={false} />
    </div>
  );
}
```

---

## 🎯 Status Flow

```
idle
  ↓ (start campaign)
authenticating (if first time)
  ↓ (scan QR)
ready
  ↓ (auto-start)
running
  ↓ (pause)
paused
  ↓ (resume)
running
  ↓ (complete/error/stop)
completed / error / idle
```

---

## ⏱️ Time Estimation

### How It Works

1. **Track Start Time**: When first message is sent
2. **Calculate Average**: `avgTime = elapsedTime / sentCount`
3. **Estimate Remaining**: `remaining = avgTime * pendingCount`
4. **Update Continuously**: Recalculated on each progress update

### Format Examples

```typescript
0s      → "--"
45s     → "45s"
90s     → "1m 30s"
3600s   → "1h 0m"
7260s   → "2h 1m"
```

### Accuracy

- More accurate as campaign progresses
- Accounts for actual delays (not theoretical)
- Updates in real-time
- Null until first message is sent

---

## 🎨 Styling

### Default Styles

```tsx
// Card-based layout
// Tailwind CSS classes
// shadcn/ui components
```

### Custom Styling

```tsx
<CampaignMonitor className="shadow-lg border-2 border-blue-500" />
```

### Theme Support

```tsx
// Automatically uses your app's theme
// Supports light/dark mode (via shadcn/ui)
// Customizable via Tailwind classes
```

---

## 🐛 Error Handling

### Error Display

```tsx
{stats.error && (
  <Alert variant="destructive">
    <XCircle className="h-4 w-4" />
    <AlertDescription>{stats.error}</AlertDescription>
  </Alert>
)}
```

### Error Sources

1. Worker initialization failure
2. WhatsApp connection issues
3. Message sending failures
4. Network errors
5. Campaign stop/pause errors

### Error Recovery

```tsx
// Errors are displayed but don't crash the app
// User can restart campaign after fixing issues
// Failed messages are tracked separately
```

---

## 📱 Responsive Design

### Breakpoints

```tsx
// Desktop (lg)
grid-cols-4  // 4 counter cards

// Tablet (md)
grid-cols-2  // 2 counter cards

// Mobile
grid-cols-2  // 2 counter cards (stacked)
```

### Compact Mode

Perfect for:
- Sidebars
- Headers
- Dashboard widgets
- Mobile views

---

## 🔧 Advanced Usage

### Listen to Specific Events

```tsx
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    const unsubscribe = window.electronAPI.campaignWorker.onProgress((data) => {
      console.log('Progress:', data);
      // Custom handling
    });

    return unsubscribe;
  }, []);

  return <div>Custom Component</div>;
}
```

### Manual Control Without UI

```tsx
function ManualControl() {
  const handlePause = async () => {
    await window.electronAPI.campaignWorker.pause();
  };

  const handleResume = async () => {
    await window.electronAPI.campaignWorker.resume();
  };

  const handleStop = async () => {
    await window.electronAPI.campaignWorker.stop();
  };

  return (
    <div>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleResume}>Resume</button>
      <button onClick={handleStop}>Stop</button>
    </div>
  );
}
```

### Access Raw Stats

```tsx
function StatsExporter() {
  const { stats } = useCampaignProgress();

  const exportStats = () => {
    const data = {
      campaignId: stats.campaignId,
      progress: stats.progress,
      sent: stats.sentCount,
      failed: stats.failedCount,
      pending: stats.pendingCount,
      eta: stats.estimatedTimeRemaining,
    };

    console.log(JSON.stringify(data, null, 2));
  };

  return <button onClick={exportStats}>Export Stats</button>;
}
```

---

## 📚 Related Files

- `/src/renderer/hooks/useCampaignProgress.ts` - Custom hook
- `/src/renderer/components/CampaignMonitor.tsx` - Main component
- `/src/renderer/components/CampaignMonitorDemo.tsx` - Demo component
- `/electron/preload/index.ts` - IPC bridge
- `/electron/main/index.ts` - IPC handlers
- `/electron/main/workerManager.ts` - Worker manager
- `/electron/worker/whatsappWorker.ts` - Worker implementation

---

## ✅ Build Status

```bash
npm run build       ✅ PASSED
npm run typecheck   ✅ PASSED
```

---

## 🎉 Complete!

The CampaignMonitor system is fully functional with:

- ✅ Live progress tracking
- ✅ Real-time updates via IPC
- ✅ Estimated time remaining
- ✅ Full campaign control
- ✅ Custom hook for flexibility
- ✅ Compact mode option
- ✅ Complete TypeScript types
- ✅ Responsive design
- ✅ Error handling
- ✅ QR code authentication
- ✅ Status indicators
- ✅ Multiple usage patterns

**Ready to use in your Electron application!**
