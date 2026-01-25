# Campaign Monitor - Quick Reference

Fast reference for CampaignMonitor component and useCampaignProgress hook.

---

## 🚀 Quick Start

### Import and Use

```tsx
import CampaignMonitor from './renderer/components/CampaignMonitor';

<CampaignMonitor />
```

Done! That's it. Everything else is automatic.

---

## 📦 Component Props

```tsx
<CampaignMonitor
  showControls={true}   // Show pause/resume/stop buttons
  compact={false}       // Single-line compact mode
  className=""          // Additional CSS classes
/>
```

---

## 🪝 Custom Hook

```tsx
import { useCampaignProgress } from './renderer/hooks/useCampaignProgress';

const { stats, controls, isWorkerReady } = useCampaignProgress();
```

### Stats Object

```typescript
stats.campaignId             // string | null
stats.status                 // 'idle' | 'authenticating' | 'ready' | 'running' | 'paused' | 'completed' | 'error'
stats.progress               // 0-100
stats.totalMessages          // number
stats.sentCount              // number
stats.failedCount            // number
stats.pendingCount           // number
stats.currentMessage         // { id, recipientNumber, status }
stats.error                  // string | null
stats.qrCode                 // string | null
stats.startTime              // timestamp | null
stats.estimatedTimeRemaining // seconds | null
```

### Controls Object

```typescript
await controls.pause();      // Pause campaign
await controls.resume();     // Resume campaign
await controls.stop();       // Stop campaign
```

### Worker Ready

```typescript
isWorkerReady  // boolean - WhatsApp client ready
```

---

## 🎨 Display Modes

### Full Mode (Default)

```tsx
<CampaignMonitor />
```

Shows:
- Progress bar with percentage
- 4 counter cards (Total, Sent, Failed, Pending)
- Estimated time remaining
- Current message indicator
- Control buttons
- QR code (if needed)
- Status badge

### Compact Mode

```tsx
<CampaignMonitor compact={true} />
```

Shows:
```
[===================>   ] 75%  45/60  [Running]
```

---

## 📊 Progress Tracking

### Automatic Updates

```tsx
// No code needed - automatically tracks:
- Progress percentage (0-100%)
- Messages sent/failed/pending
- Current message being sent
- Estimated time remaining
- Campaign status
```

### Manual Listening

```tsx
useEffect(() => {
  const unsubscribe = window.electronAPI.campaignWorker.onProgress((data) => {
    console.log('Progress:', data);
  });

  return unsubscribe;
}, []);
```

---

## 🎮 Control Methods

### Via Component

```tsx
<CampaignMonitor showControls={true} />
// Buttons appear automatically
```

### Via Hook

```tsx
const { controls } = useCampaignProgress();

<button onClick={controls.pause}>Pause</button>
<button onClick={controls.resume}>Resume</button>
<button onClick={controls.stop}>Stop</button>
```

### Via Direct IPC

```tsx
await window.electronAPI.campaignWorker.pause();
await window.electronAPI.campaignWorker.resume();
await window.electronAPI.campaignWorker.stop();
```

---

## ⏱️ Time Estimation

### How It Works

```typescript
// Automatically calculated:
avgTimePerMessage = elapsedTime / sentCount
remainingTime = avgTimePerMessage * pendingCount

// Updated on each progress event
```

### Display Format

```
45s      → "45s"
90s      → "1m 30s"
3600s    → "1h 0m"
```

---

## 🔔 Status Badges

```
Idle           [Gray]
Authenticating [Yellow + Spinner]
Ready          [Green]
Running        [Blue + Spinner]
Paused         [Orange]
Completed      [Green]
Error          [Red]
```

---

## 🎯 Common Patterns

### Pattern 1: Basic Monitor

```tsx
function Dashboard() {
  return <CampaignMonitor />;
}
```

### Pattern 2: Custom UI

```tsx
function Custom() {
  const { stats, controls } = useCampaignProgress();

  return (
    <div>
      <p>{stats.sentCount}/{stats.totalMessages}</p>
      <progress value={stats.progress} max={100} />
      <button onClick={controls.pause}>Pause</button>
    </div>
  );
}
```

### Pattern 3: Compact Sidebar

```tsx
function Sidebar() {
  return (
    <aside>
      <h3>Active Campaign</h3>
      <CampaignMonitor compact={true} />
    </aside>
  );
}
```

### Pattern 4: Hide Controls

```tsx
<CampaignMonitor showControls={false} />
// External controls elsewhere
```

### Pattern 5: Listen for Completion

```tsx
useEffect(() => {
  const unsubscribe = window.electronAPI.campaignWorker.onComplete((data) => {
    alert(`Campaign complete! ${data.sentCount} sent`);
  });

  return unsubscribe;
}, []);
```

---

## 🔌 IPC Events

All auto-subscribed by `useCampaignProgress()`:

```typescript
onQrCode((qrCode) => ...)           // QR code for auth
onReady(() => ...)                  // Client ready
onProgress((data) => ...)           // Message sent/failed
onComplete((data) => ...)           // Campaign finished
onError((data) => ...)              // Error occurred
onPaused((campaignId) => ...)       // Campaign paused
onResumed((campaignId) => ...)      // Campaign resumed
```

---

## 📱 Responsive

```tsx
// Desktop: 4 columns
// Tablet: 2 columns
// Mobile: 2 columns (stacked)
```

All automatic, no configuration needed.

---

## 🐛 Error Handling

```tsx
// Errors automatically displayed in UI
{stats.error && (
  <Alert variant="destructive">
    {stats.error}
  </Alert>
)}
```

---

## 📚 Files

```
Hook:
  /src/renderer/hooks/useCampaignProgress.ts

Component:
  /src/renderer/components/CampaignMonitor.tsx

Demo:
  /src/renderer/components/CampaignMonitorDemo.tsx
```

---

## ✅ Features

- ✅ Progress bar (0-100%)
- ✅ Counters: Total, Sent, Failed, Pending
- ✅ Estimated time remaining
- ✅ Current message indicator
- ✅ Control buttons (pause/resume/stop)
- ✅ QR code display
- ✅ Status badges
- ✅ Error alerts
- ✅ Compact mode
- ✅ Responsive design
- ✅ TypeScript types
- ✅ Auto IPC subscription
- ✅ Cleanup on unmount

---

## 🎉 That's It!

Most common usage:

```tsx
import CampaignMonitor from './renderer/components/CampaignMonitor';

<CampaignMonitor />
```

See `CAMPAIGN_MONITOR_GUIDE.md` for detailed documentation.
