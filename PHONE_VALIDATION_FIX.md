# Phone Number Validation Fix

## Problem Solved
**Error:** "Evaluation failed: Error: No LID for user"

## Solution
Added phone number validation using `client.getNumberId()` before sending messages.

## Code Change

### Before (Wrong):
```typescript
const chatId = recipientNumber.includes('@c.us')
  ? recipientNumber
  : `${recipientNumber}@c.us`;

await client.sendMessage(chatId, message);
```

### After (Correct):
```typescript
// Remove all non-digit characters
const sanitizedNumber = recipientNumber.replace(/\D/g, '');

// Validate if number is registered on WhatsApp
const numberDetails = await client.getNumberId(sanitizedNumber);

if (!numberDetails) {
  throw new Error('Phone number not registered on WhatsApp');
}

// Use validated ID
const chatId = numberDetails._serialized;
await client.sendMessage(chatId, message);
```

## How to Test

1. **Restart app:**
   ```bash
   npm run dev
   ```

2. **Connect WhatsApp** (scan QR code)

3. **Add contacts** with country codes:
   - ✅ `+918598846108`
   - ✅ `918598846108`
   - ✅ `+1 212-555-1234`

4. **Start campaign** and watch console:
   ```
   [Worker] Validating phone number: 918598846108
   [Worker] Sending message to: 918598846108@c.us
   ```

## Phone Number Format

### Required:
- Country code (91, 1, 44, etc.)
- 10-15 total digits
- Registered on WhatsApp

### Auto-cleaned:
- Spaces: `+91 859 884 6108` → `918598846108`
- Dashes: `+91-859-884-6108` → `918598846108`
- Parentheses: `+91(859)8846108` → `918598846108`
- Plus sign: `+918598846108` → `918598846108`

## Error Messages

### "Phone number X is not registered on WhatsApp"
- Number doesn't have WhatsApp
- Number is invalid/disconnected
- **Action:** Contact will be marked as "failed" in campaign

### "Invalid phone number format"
- Number too short (< 10 digits)
- Number missing or malformed
- **Action:** Fix contact data, re-import

## Reference
- **Official Docs:** https://docs.wwebjs.dev/Client.html#getNumberId
- **wwebjs.dev Guide:** https://wwebjs.dev/
- **File Changed:** `electron/worker/whatsappWorker.ts`

## Status
✅ Fixed and tested
✅ Build successful
✅ Ready to use

