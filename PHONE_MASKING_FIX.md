# Phone Number Masking Fix - Staff Campaign Execution

## Problem
When staff members ran campaigns, they encountered an error:
```
Invalid phone number format: **********
```

This occurred because phone numbers were being masked for privacy at the database/IPC level, but the masking was also applied when fetching contacts for campaign execution, causing the WhatsApp worker to receive masked phone numbers instead of actual phone numbers.

## Root Cause
The phone number masking logic was implemented in the IPC handlers (`electron/main/ipc.ts`) for:
- `groups:getContacts` (line 521-541)
- `campaigns:getContacts` (line 626-646)

These handlers would check if the user role was 'STAFF' and automatically mask all phone numbers before returning them. However, this masking was being applied universally - both for viewing contacts in the UI AND for executing campaigns.

When `CampaignRunner.tsx` fetched contacts to start a campaign (lines 185 and 194), staff users would receive masked phone numbers (`**********`), which were then sent to the WhatsApp worker, causing validation failures.

## Solution
Implemented a conditional masking approach with a `skipMasking` parameter:

### 1. Backend Changes (`electron/main/ipc.ts`)
- Modified `groups:getContacts` handler to accept optional `skipMasking` parameter
- Modified `campaigns:getContacts` handler to accept optional `skipMasking` parameter  
- Updated masking logic to only apply when `skipMasking` is false or not provided
- Added comment: "Skip masking if requested (e.g., for campaign execution)"

**Key Logic:**
```typescript
// Skip masking if requested (e.g., for campaign execution)
if (role === 'STAFF' && !skipMasking) {
  return {
    success: true,
    data: data.map(c => ({ ...c, phone: userService.maskMobile(c.phone) }))
  };
}
```

### 2. Preload API Changes (`electron/preload/index.ts`)
- Updated `campaigns.getContacts` signature to accept optional `skipMasking` parameter
- Updated `groups.getContacts` signature to accept optional `skipMasking` parameter
- These parameters are properly forwarded to the IPC handlers

### 3. Frontend Changes (`src/renderer/components/CampaignRunner.tsx`)
- Updated group contacts fetch to pass `skipMasking: true`
- Updated campaign contacts fetch to pass `skipMasking: true`
- Added comments explaining why masking is skipped for campaign execution

**Example:**
```typescript
// Pass skipMasking=true to get actual phone numbers for campaign execution
const groupContacts = await window.electronAPI.groups.getContacts(campaign.group_id, true);
```

## Result
- **Staff UI View**: Phone numbers remain masked (`**********`) when staff view contact lists
- **Campaign Execution**: Actual phone numbers are used when staff run campaigns
- **Privacy**: Phone numbers are still hidden at the UI/view level for staff
- **Functionality**: Campaigns can now execute successfully with real phone numbers

## Testing Recommendations
1. Login as a staff user
2. View contacts in the contacts list - phone numbers should appear as `**********`
3. Create/select a campaign with contacts
4. Run the campaign - should execute successfully without "Invalid phone number format" error
5. Verify messages are sent to actual phone numbers

## Files Modified
1. `electron/main/ipc.ts` - Added skipMasking parameter to contact fetching handlers
2. `electron/preload/index.ts` - Updated API signatures  
3. `src/renderer/components/CampaignRunner.tsx` - Pass skipMasking=true for campaign execution
