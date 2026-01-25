# Delay System - Complete Guide

## Overview

A comprehensive delay management system for controlling message sending intervals with preset configurations and custom ranges. Perfect for simulating natural messaging patterns and avoiding spam detection.

## Components

### 1. Type Definitions (delay.ts)

**Location**: `src/renderer/types/delay.ts`

**Key Types:**
```typescript
type DelayPreset = 'very_short' | 'short' | 'medium' | 'long' | 'very_long' | 'manual';

interface DelayRange {
  min: number;
  max: number;
}

interface DelaySettings {
  preset: DelayPreset;
  customRange?: DelayRange;
}

interface CampaignDelaySettings {
  id?: string;
  campaign_id: string;
  preset: DelayPreset;
  custom_min?: number;
  custom_max?: number;
  created_at?: string;
  updated_at?: string;
}
```

**Preset Configurations:**
```typescript
const DELAY_PRESETS = {
  very_short: { min: 1, max: 5 },      // 1-5 seconds
  short: { min: 5, max: 20 },          // 5-20 seconds
  medium: { min: 20, max: 50 },        // 20-50 seconds
  long: { min: 50, max: 120 },         // 50-120 seconds (0.8-2 min)
  very_long: { min: 120, max: 300 },   // 120-300 seconds (2-5 min)
  manual: { min: 1, max: 300 },        // Custom range
};
```

### 2. Utility Functions (delayUtils.ts)

**Location**: `src/renderer/utils/delayUtils.ts`

**Core Functions:**

#### pickDelay(preset, customRange?)
Picks a random delay in milliseconds from the specified preset or custom range.

```typescript
const delayMs = pickDelay('medium');
// Returns: random value between 20000-50000 (20-50 seconds in ms)

const customDelay = pickDelay('manual', { min: 10, max: 30 });
// Returns: random value between 10000-30000 (10-30 seconds in ms)
```

#### pickDelayFromSettings(settings)
Picks a delay from a DelaySettings object.

```typescript
const settings = { preset: 'short' };
const delayMs = pickDelayFromSettings(settings);
```

#### formatDelay(milliseconds)
Formats milliseconds into human-readable string.

```typescript
formatDelay(5000);      // "5s"
formatDelay(65000);     // "1m 5s"
formatDelay(120000);    // "2m"
```

#### formatDelayRange(range)
Formats a delay range into readable string.

```typescript
formatDelayRange({ min: 20, max: 50 });  // "20s - 50s"
formatDelayRange({ min: 65, max: 180 }); // "1m 5s - 3m"
```

#### validateDelayRange(range)
Validates a delay range.

```typescript
validateDelayRange({ min: 10, max: 20 });
// Returns: { valid: true }

validateDelayRange({ min: 30, max: 10 });
// Returns: { valid: false, error: "Minimum delay must be..." }
```

#### estimateTotalTime(messageCount, preset, customRange?)
Estimates total time for sending messages.

```typescript
const totalMs = estimateTotalTime(100, 'medium');
// Returns: estimated time in milliseconds for 100 messages
```

#### delayWithPreset(preset, customRange?)
Async function that delays execution.

```typescript
await delayWithPreset('short');
// Waits for random time between 5-20 seconds

await delayWithPreset('manual', { min: 15, max: 45 });
// Waits for random time between 15-45 seconds
```

### 3. DelaySelector Component

**Location**: `src/renderer/components/DelaySelector.tsx`

**Features:**
- ✅ Visual preset selection (6 presets)
- ✅ Custom range slider (1-300 seconds)
- ✅ Manual input fields for min/max
- ✅ Real-time validation
- ✅ Estimated time calculation
- ✅ Message count integration
- ✅ Icon indicators per preset
- ✅ Card-based UI design
- ✅ Error handling with alerts
- ✅ Disabled state support

**Props:**
```typescript
interface DelaySelectorProps {
  value: DelaySettings;
  onChange: (settings: DelaySettings) => void;
  messageCount?: number;
  showEstimate?: boolean;
  disabled?: boolean;
}
```

**Usage:**
```typescript
<DelaySelector
  value={delaySettings}
  onChange={setDelaySettings}
  messageCount={100}
  showEstimate={true}
  disabled={false}
/>
```

### 4. Database Schema

**Location**: `supabase/migrations/20240312000000_create_campaign_delay_settings.sql`

**Table: campaign_delay_settings**

**Columns:**
- `id` (uuid) - Primary key
- `campaign_id` (uuid) - Foreign key to campaigns (unique)
- `preset` (text) - Delay preset type
- `custom_min` (integer, nullable) - Custom minimum seconds
- `custom_max` (integer, nullable) - Custom maximum seconds
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- ✅ Valid preset check (must be one of 6 presets)
- ✅ Custom range required for 'manual' preset
- ✅ Min ≤ Max validation
- ✅ Positive values only
- ✅ Unique campaign_id

**Security:**
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own campaign settings
- ✅ Policies for SELECT, INSERT, UPDATE, DELETE
- ✅ Campaign ownership verification

**Triggers:**
- ✅ Auto-update `updated_at` on record changes

### 5. Delay Service

**Location**: `src/renderer/services/delayService.ts`

**Functions:**

#### getCampaignDelaySettings(campaignId)
Fetches delay settings for a campaign.

```typescript
const settings = await getCampaignDelaySettings(campaignId);
// Returns: DelaySettings | null
```

#### saveCampaignDelaySettings(campaignId, settings)
Saves or updates delay settings.

```typescript
const saved = await saveCampaignDelaySettings(campaignId, {
  preset: 'medium',
});
// Returns: CampaignDelaySettings
```

#### deleteCampaignDelaySettings(campaignId)
Deletes delay settings for a campaign.

```typescript
await deleteCampaignDelaySettings(campaignId);
```

#### getDefaultDelaySettings()
Returns default delay settings.

```typescript
const defaults = await getDefaultDelaySettings();
// Returns: { preset: 'medium' }
```

#### bulkGetCampaignDelaySettings(campaignIds)
Fetches delay settings for multiple campaigns.

```typescript
const settingsMap = await bulkGetCampaignDelaySettings([id1, id2, id3]);
// Returns: Map<string, DelaySettings>
```

### 6. Demo Component

**Location**: `src/renderer/components/DelaySelectorDemo.tsx`

**Features:**
- Complete integration example
- Test delay generation
- Save settings functionality
- Message count input
- Current configuration display
- Usage examples
- JSON preview

## Delay Presets in Detail

### Very Short (1-5 seconds)
- **Use Case**: Quick notifications, alerts
- **Best For**: Urgent messages, small batches
- **Risk**: May appear automated
- **Icon**: Speed/Fast

### Short (5-20 seconds)
- **Use Case**: Rapid communication
- **Best For**: Time-sensitive campaigns
- **Risk**: Moderate spam risk
- **Icon**: Speed

### Medium (20-50 seconds)
- **Use Case**: Balanced approach (DEFAULT)
- **Best For**: Most campaigns
- **Risk**: Low spam risk
- **Icon**: Timer

### Long (50-120 seconds)
- **Use Case**: Natural conversation pace
- **Best For**: Personal messages, quality over speed
- **Risk**: Very low spam risk
- **Icon**: Schedule

### Very Long (120-300 seconds)
- **Use Case**: Maximum authenticity
- **Best For**: High-value contacts, premium campaigns
- **Risk**: Minimal spam risk
- **Icon**: Schedule

### Manual Range (Custom)
- **Use Case**: Specific requirements
- **Best For**: Advanced users, special scenarios
- **Risk**: Depends on configuration
- **Icon**: Custom/Manual

## Usage Examples

### Basic Implementation

```typescript
import DelaySelector from './components/DelaySelector';
import { DelaySettings } from './types/delay';

function CampaignSettings() {
  const [delaySettings, setDelaySettings] = useState<DelaySettings>({
    preset: 'medium',
  });

  return (
    <DelaySelector
      value={delaySettings}
      onChange={setDelaySettings}
      messageCount={50}
      showEstimate={true}
    />
  );
}
```

### With Campaign Creation

```typescript
function CreateCampaign() {
  const [campaignData, setCampaignData] = useState({
    name: '',
    message: '',
    delaySettings: { preset: 'medium' } as DelaySettings,
  });

  const handleSave = async () => {
    const campaign = await createCampaign({
      name: campaignData.name,
      message: campaignData.message,
    });

    await saveCampaignDelaySettings(campaign.id, campaignData.delaySettings);
  };

  return (
    <Box>
      <TextField
        label="Campaign Name"
        value={campaignData.name}
        onChange={(e) => setCampaignData(prev => ({
          ...prev,
          name: e.target.value
        }))}
      />

      <DelaySelector
        value={campaignData.delaySettings}
        onChange={(settings) => setCampaignData(prev => ({
          ...prev,
          delaySettings: settings
        }))}
        messageCount={100}
      />

      <Button onClick={handleSave}>Create Campaign</Button>
    </Box>
  );
}
```

### Sending Messages with Delays

```typescript
import { pickDelayFromSettings, delay } from './utils/delayUtils';

async function sendCampaignMessages(
  campaignId: string,
  contacts: Contact[]
) {
  const settings = await getCampaignDelaySettings(campaignId);

  if (!settings) {
    throw new Error('No delay settings found');
  }

  for (const contact of contacts) {
    await sendMessage(contact, message);

    const delayMs = pickDelayFromSettings(settings);
    console.log(`Waiting ${delayMs}ms before next message...`);

    await delay(delayMs);
  }
}
```

### Using the Async Helper

```typescript
import { delayWithPreset } from './utils/delayUtils';

async function processWithDelay() {
  console.log('Step 1');

  await delayWithPreset('short');

  console.log('Step 2');

  await delayWithPreset('manual', { min: 15, max: 30 });

  console.log('Step 3');
}
```

### Loading and Saving Settings

```typescript
async function loadCampaignDelays(campaignId: string) {
  const settings = await getCampaignDelaySettings(campaignId);

  if (settings) {
    setDelaySettings(settings);
  } else {
    const defaults = await getDefaultDelaySettings();
    setDelaySettings(defaults);
  }
}

async function saveDelays(campaignId: string, settings: DelaySettings) {
  try {
    await saveCampaignDelaySettings(campaignId, settings);
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
```

### Bulk Loading

```typescript
async function loadMultipleCampaignSettings(campaignIds: string[]) {
  const settingsMap = await bulkGetCampaignDelaySettings(campaignIds);

  for (const [campaignId, settings] of settingsMap) {
    console.log(`Campaign ${campaignId}:`, settings);
  }
}
```

### Validation Before Saving

```typescript
import { validateDelaySettings } from './utils/delayUtils';

function handleSaveSettings(settings: DelaySettings) {
  const validation = validateDelaySettings(settings);

  if (!validation.valid) {
    alert(`Invalid settings: ${validation.error}`);
    return;
  }

  saveCampaignDelaySettings(campaignId, settings);
}
```

## Time Estimations

### Calculate Estimated Time

```typescript
import { estimateTotalTime, formatEstimatedTime } from './utils/delayUtils';

const messageCount = 100;
const preset = 'medium';

const totalMs = estimateTotalTime(messageCount, preset);
const formatted = formatEstimatedTime(totalMs);

console.log(`Estimated time: ${formatted}`);
// Output: "Estimated time: 58 minutes, 20 seconds"
```

### Time Examples by Preset

**100 Messages:**
- Very Short: ~5 minutes
- Short: ~20 minutes
- Medium: ~58 minutes
- Long: ~2.8 hours
- Very Long: ~5.8 hours

**1000 Messages:**
- Very Short: ~50 minutes
- Short: ~3.5 hours
- Medium: ~9.7 hours
- Long: ~28 hours
- Very Long: ~58 hours

## Database Operations

### Create Delay Settings

```sql
INSERT INTO campaign_delay_settings (campaign_id, preset)
VALUES ('campaign-uuid', 'medium');
```

### Update to Manual Range

```sql
UPDATE campaign_delay_settings
SET preset = 'manual',
    custom_min = 15,
    custom_max = 45
WHERE campaign_id = 'campaign-uuid';
```

### Query Settings

```sql
SELECT *
FROM campaign_delay_settings
WHERE campaign_id = 'campaign-uuid';
```

### Delete Settings

```sql
DELETE FROM campaign_delay_settings
WHERE campaign_id = 'campaign-uuid';
```

## Validation Rules

### Preset Validation
- ✅ Must be one of: very_short, short, medium, long, very_long, manual
- ❌ Empty or null preset
- ❌ Unknown preset value

### Range Validation
- ✅ Min and Max must be positive integers
- ✅ Min ≤ Max
- ✅ Both required for manual preset
- ❌ Negative values
- ❌ Min > Max
- ❌ Zero delay
- ❌ Max > 3600 seconds (1 hour)

### Database Constraints
- ✅ CHECK: preset must be valid
- ✅ CHECK: custom range required for manual
- ✅ CHECK: min ≤ max
- ✅ CHECK: positive values
- ✅ UNIQUE: one setting per campaign

## Error Handling

### Common Errors

**"Manual preset requires custom range"**
- Cause: Using manual preset without customRange
- Solution: Provide customRange object

**"Minimum delay must be less than or equal to maximum delay"**
- Cause: Min > Max
- Solution: Correct the range values

**"Delay range values must be non-negative"**
- Cause: Negative min or max value
- Solution: Use positive values only

**"Maximum delay cannot exceed 1 hour"**
- Cause: Max > 3600 seconds
- Solution: Keep max ≤ 3600

### Handling Errors in Code

```typescript
try {
  const delayMs = pickDelay('manual', { min: 10, max: 30 });
  await delay(delayMs);
} catch (error) {
  console.error('Delay error:', error);
  // Fallback to default
  await delay(30000);
}
```

## Best Practices

### Choosing Delay Presets

1. **Start with Medium**: Good balance for most use cases
2. **Use Long for Personal**: Better for one-on-one communication
3. **Very Short for Urgent**: Only when time-critical
4. **Manual for Control**: When you need specific timing

### Security Considerations

1. **Avoid Spam Detection**: Use longer delays for bulk messages
2. **Rate Limiting**: Consider platform rate limits
3. **User Experience**: Don't make users wait unnecessarily
4. **Testing**: Test with small batches first

### Performance Tips

1. **Bulk Loading**: Use bulkGetCampaignDelaySettings for multiple campaigns
2. **Caching**: Cache delay settings when possible
3. **Validation**: Validate settings before saving
4. **Error Recovery**: Have fallback delays

### UI/UX Guidelines

1. **Show Estimates**: Always show estimated time for user awareness
2. **Clear Labels**: Use descriptive labels for presets
3. **Visual Feedback**: Show selected preset clearly
4. **Validation Messages**: Display clear error messages
5. **Disable When Needed**: Disable selector during active campaigns

## Integration Checklist

- [ ] Import types from `types/delay.ts`
- [ ] Import utilities from `utils/delayUtils.ts`
- [ ] Add DelaySelector component to campaign form
- [ ] Implement save functionality with delayService
- [ ] Add validation before saving
- [ ] Show estimated time to users
- [ ] Test with different presets
- [ ] Test manual range validation
- [ ] Test database operations
- [ ] Handle errors gracefully

## Testing Scenarios

### Component Testing
- [ ] Select each preset
- [ ] Switch between presets
- [ ] Enter custom range values
- [ ] Use slider for custom range
- [ ] Test validation errors
- [ ] Test with different message counts
- [ ] Test disabled state

### Utility Testing
- [ ] pickDelay with each preset
- [ ] pickDelay with custom range
- [ ] Validate various ranges
- [ ] Format different delay values
- [ ] Calculate time estimates
- [ ] Test error conditions

### Database Testing
- [ ] Create delay settings
- [ ] Update existing settings
- [ ] Delete settings
- [ ] Query settings
- [ ] Test RLS policies
- [ ] Test constraints
- [ ] Test bulk operations

## Summary

**Files Created**: 7 files
- Types: 1 file (delay.ts)
- Utils: 1 file (delayUtils.ts)
- Components: 2 files (DelaySelector.tsx, DelaySelectorDemo.tsx)
- Service: 1 file (delayService.ts)
- Migration: 1 file (SQL schema)
- Documentation: 1 file (this guide)

**Features Delivered**:
- ✅ 6 delay presets (very_short to manual)
- ✅ Custom range with slider
- ✅ Real-time validation
- ✅ Time estimation
- ✅ Database schema with RLS
- ✅ Service layer for CRUD
- ✅ Full TypeScript support
- ✅ Material UI components
- ✅ Comprehensive utilities

**Delay Ranges**:
- Very Short: 1-5s
- Short: 5-20s
- Medium: 20-50s
- Long: 50-120s
- Very Long: 120-300s
- Manual: Custom (1-300s)

All components are production-ready with complete validation, error handling, and database integration!
