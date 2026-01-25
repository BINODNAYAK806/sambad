# Delay System - Quick Start

## ✅ Complete & Ready

A fully functional delay management system with presets, custom ranges, and database integration.

## 🚀 Quick Usage

### 1. Import and Use Component

```typescript
import DelaySelector from './components/DelaySelector';
import { DelaySettings } from './types/delay';

function YourComponent() {
  const [settings, setSettings] = useState<DelaySettings>({
    preset: 'medium',
  });

  return (
    <DelaySelector
      value={settings}
      onChange={setSettings}
      messageCount={100}
      showEstimate={true}
    />
  );
}
```

### 2. Pick Random Delay

```typescript
import { pickDelay } from './utils/delayUtils';

// Use a preset
const delayMs = pickDelay('medium');
await new Promise(resolve => setTimeout(resolve, delayMs));

// Use custom range
const customDelay = pickDelay('manual', { min: 10, max: 30 });
await new Promise(resolve => setTimeout(resolve, customDelay));
```

### 3. Save to Database

```typescript
import { saveCampaignDelaySettings } from './services/delayService';

await saveCampaignDelaySettings(campaignId, {
  preset: 'short',
});

// Or with custom range
await saveCampaignDelaySettings(campaignId, {
  preset: 'manual',
  customRange: { min: 15, max: 45 },
});
```

### 4. Load from Database

```typescript
import { getCampaignDelaySettings } from './services/delayService';

const settings = await getCampaignDelaySettings(campaignId);
if (settings) {
  setDelaySettings(settings);
}
```

## 📊 Delay Presets

| Preset | Range | Use Case |
|--------|-------|----------|
| **Very Short** | 1-5s | Quick notifications, alerts |
| **Short** | 5-20s | Rapid communication |
| **Medium** | 20-50s | Balanced (DEFAULT) |
| **Long** | 50-120s | Natural conversation |
| **Very Long** | 120-300s | Maximum authenticity |
| **Manual** | Custom | User-defined range |

## 📁 Files Created

### Core Files
- `src/renderer/types/delay.ts` - Type definitions & presets
- `src/renderer/utils/delayUtils.ts` - Utility functions (20+)
- `src/renderer/components/DelaySelector.tsx` - UI component
- `src/renderer/services/delayService.ts` - Database service

### Demo & Docs
- `src/renderer/components/DelaySelectorDemo.tsx` - Example usage
- `DELAY_SYSTEM_GUIDE.md` - Complete documentation
- `DELAY_SYSTEM_SUMMARY.md` - Technical summary

## 🗄️ Database Integration

The database already has the necessary tables:

### Table: campaign_delay_settings
- ✅ Row Level Security enabled
- ✅ User ownership policies
- ✅ Auto-update timestamps
- ✅ Validation constraints

### Available Operations
```typescript
// Create/Update
await saveCampaignDelaySettings(campaignId, settings);

// Read
const settings = await getCampaignDelaySettings(campaignId);

// Delete
await deleteCampaignDelaySettings(campaignId);

// Bulk Read
const map = await bulkGetCampaignDelaySettings([id1, id2, id3]);
```

## 🎯 Key Functions

### Core Utilities
```typescript
// Pick random delay in milliseconds
pickDelay(preset: DelayPreset, customRange?: DelayRange): number

// Pick from settings object
pickDelayFromSettings(settings: DelaySettings): number

// Async delay helper
delayWithPreset(preset: DelayPreset, customRange?: DelayRange): Promise<number>

// Format milliseconds
formatDelay(milliseconds: number): string

// Validate settings
validateDelaySettings(settings: DelaySettings): { valid: boolean; error?: string }

// Estimate total time
estimateTotalTime(messageCount: number, preset: DelayPreset, customRange?: DelayRange): number
```

## 💡 Example: Send Messages with Delay

```typescript
import { getCampaignDelaySettings } from './services/delayService';
import { pickDelayFromSettings, delay } from './utils/delayUtils';

async function sendCampaignMessages(
  campaignId: string,
  contacts: Contact[],
  message: string
) {
  // Load delay settings
  const settings = await getCampaignDelaySettings(campaignId) || {
    preset: 'medium'
  };

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    // Send message
    await sendMessage(contact.phone, message);
    console.log(`Message ${i + 1}/${contacts.length} sent`);

    // Wait before next message (except for last one)
    if (i < contacts.length - 1) {
      const delayMs = pickDelayFromSettings(settings);
      console.log(`Waiting ${delayMs}ms before next message...`);
      await delay(delayMs);
    }
  }

  console.log('All messages sent!');
}
```

## 🧪 Test the System

Run the demo component to test:

```typescript
import DelaySelectorDemo from './components/DelaySelectorDemo';

function App() {
  return <DelaySelectorDemo />;
}
```

Features in demo:
- ✅ Select presets
- ✅ Configure custom range
- ✅ Test delay generation
- ✅ View time estimates
- ✅ See configuration JSON

## ⚡ Time Estimates (100 messages)

| Preset | Estimated Time |
|--------|----------------|
| Very Short | ~5 minutes |
| Short | ~20 minutes |
| Medium | ~58 minutes |
| Long | ~2.8 hours |
| Very Long | ~5.8 hours |

*Note: Actual times vary due to random delays within the range*

## 🎨 UI Features

**DelaySelector Component:**
- ✅ 6 preset cards with icons
- ✅ Visual selection feedback
- ✅ Custom range slider (1-300s)
- ✅ Manual input fields
- ✅ Real-time validation
- ✅ Error alerts
- ✅ Time estimation
- ✅ Responsive design

## 🛡️ Security

- ✅ Row Level Security enabled
- ✅ Users can only access their own settings
- ✅ All CRUD operations protected
- ✅ Database constraints enforced

## 📚 Documentation

- **DELAY_SYSTEM_GUIDE.md** - Complete guide (1000+ lines)
- **DELAY_SYSTEM_SUMMARY.md** - Technical summary
- **This file** - Quick start reference

## ✅ Ready to Use

All components are:
- ✅ TypeScript ready (all checks pass)
- ✅ Database integrated (Supabase)
- ✅ Production ready
- ✅ Fully documented

Start using by importing `DelaySelector` component and utility functions!

---

**Need help?** Check `DELAY_SYSTEM_GUIDE.md` for comprehensive documentation with examples, best practices, and troubleshooting.
