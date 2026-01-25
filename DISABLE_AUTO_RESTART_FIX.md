# Quick Fix: Disable Automatic WhatsApp Restarts During Campaigns

## Problem
WhatsApp shows "Reconnecting..." during campaigns even though:
- WhatsApp is logged in ✅
- Network is fine ✅  
- Session is valid ✅

## Root Cause
**BotSupervisor is automatically restarting WhatsApp:**
- Every 2 hours (scheduled restart)
- After 500 messages (message count restart)

This causes:
- Campaign to pause/freeze
- "Reconnecting to WhatsApp..." message
- Campaign never resumes

## Solution: Delay Restarts During Campaigns

### File: `electron/worker/BotSupervisor.ts`

#### Change 1: Track Campaign State (Add after line 40)

```typescript
private isCampaignActive = false;
```

#### Change 2: Update Message Handler (Line 254-262)

```typescript
case 'MESSAGE_SENT':
  this.messageCount++;
  this.isCampaignActive = true;  // ✅ Mark campaign as active

  if (this.messageCount >= (this.config.maxMessagesBeforeRestart || 500)) {
    console.log(`[BotSupervisor] Message count threshold reached (${this.messageCount})`);
    setTimeout(() => {
      this.performSoftRestart('message_count');
    }, 5000);
  }
  break;

case 'COMPLETE':  // ✅ Campaign completed
case 'ERROR':     // ✅ Campaign failed
  this.isCampaignActive = false;
  this.messageCount = 0;  // Reset counter
  break;
```

#### Change 3: Delay Restart If Campaign Active (Line 210)

```typescript
private async performSoftRestart(reason: 'scheduled_time' | 'message_count'): Promise<void> {
  // ✅ DON'T restart during active campaign
  if (this.isCampaignActive) {
    console.log(`[BotSupervisor] Delaying ${reason} restart - campaign in progress`);
    console.log(`[BotSupervisor] Will retry in 5 minutes`);
    
    // Retry in 5 minutes
    setTimeout(() => {
      this.performSoftRestart(reason);
    }, 5 * 60 * 1000);
    
    return;
  }

  console.log(`[BotSupervisor] Performing soft restart (reason: ${reason})`);

  this.sendToRenderer('whatsapp:reconnecting', {
    message: 'Performing maintenance restart...',
  });

  // ... rest of restart logic remains the same
}
```

## Result

### Before Fix:
```
Campaign Running → 500 messages sent → AUTO-RESTART ❌ →
"Reconnecting..." → Campaign STUCK ❌
```

### After Fix:
```
Campaign Running → 500 messages sent → Restart DELAYED ✅ →
Campaign CONTINUES → Campaign COMPLETES ✅ →
Then restart happens (when idle) ✅
```

## Alternative: Increase Thresholds

If you don't want to delay restarts, just increase the limits:

### File: `electron/main/workerManager.ts` (Line 48)

```typescript
this.supervisor = new BotSupervisor({
  workerScript: workerPath,
  mainWindow: this.mainWindow,
  userDataPath: this.userDataPath,
  accountId: accountId,
  licenseKey: licenseKey,
  maxRestarts: 10,
  restartDelay: 3000,
  softRestartInterval: 24 * 60 * 60 * 1000,  // ✅ 24 hours instead of 2
  maxMessagesBeforeRestart: 10000,           // ✅ 10,000 instead of 500
  // rest...
});
```

## Testing

1. Start a campaign with 600 messages
2. Let it run past 500 messages
3. **Expected:** No "Reconnecting..." message ✅
4. **Expected:** Campaign completes all 600 messages ✅
5. After campaign completes, restart should happen ✅

## Files to Modify

1. `electron/worker/BotSupervisor.ts`
   - Add `isCampaignActive` property
   - Track campaign state in message handler
   - Check campaign state before restarting

**OR**

2. `electron/main/workerManager.ts`
   - Increase `softRestartInterval` to 24 hours
   - Increase `maxMessagesBeforeRestart` to 10,000

## Recommendation

**Use Option 1 (Delay restart during campaigns)**

Why?
- Restarts still happen (for stability)
- But ONLY when safe (campaign not running)
- Best of both worlds

---

**Priority:** CRITICAL  
**Complexity:** Low (3 simple changes)  
**Time:** 15 minutes  
**Version:** 1.0.3
