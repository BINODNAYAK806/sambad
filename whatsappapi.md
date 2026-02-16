# WhatsApp Business API Integration Guide

This document outlines the process, requirements, and architectural changes needed to migrate from the current **Baileys (Web-based)** implementation to the **Official WhatsApp Business API (Meta)**.

## 1. Feasibility & Comparison

| Feature | Current (Baileys) | Official API |
|---------|-------------------|--------------|
| **Method** | WebSocket (Emulates Web Client) | RESTful API & Webhooks |
| **Stability** | High (but unofficial) | Enterprise Grade |
| **Account Risk** | High (Risk of bans) | Minimal (Compliance required) |
| **Cost** | Free (except hosting) | Per-conversation pricing |
| **Message Type** | Any | Template-based for outbound |
| **Interactive** | Simulated | Built-in Buttons/Lists |

## 2. Prerequisites

1. **Meta Business Account:** You must have a verified Business Manager account.
2. **Phone Number:** A dedicated phone number that is not currently linked to a standard WhatsApp app.
3. **Developer App:** Create a "Business" type app on the [Meta for Developers](https://developers.facebook.com/) portal.
4. **Server with Public URL:** Webhooks require a public endpoint (HTTPS) to receive incoming messages.

## 3. Integration Process

### Phase A: Setup
1. **Register App:** In Meta Developers portal, add "WhatsApp" to your app.
2. **Retrieve Tokens:** Get your **Temporary Access Token** (for testing) or **Permanent System User Token** (for production).
3. **Phone ID:** Retrieve your `Phone Number ID` and `WhatsApp Business Account ID`.

### Phase B: Architecture Changes
The current `WhatsAppContext` and `WhatsAppService` rely on `baileys` events. For the official API, you must:

1. **Replace `baileys` connection logic:**
   - Remove QR code scanning.
   - Use HTTP headers for authentication (`Authorization: Bearer <TOKEN>`).
2. **Implement Webhook Handler:**
   - Create a backend endpoint (e.g., `/api/whatsapp/webhook`).
   - Meta will POST JSON payloads to this URL for every incoming event (messages, delivery receipts).
3. **Refactor Message Sending:**
   - Use `POST /v20.0/<PHONE_NUMBER_ID>/messages`.
   - Implement **Message Templates** for notifications sent outside the 24-hour customer service window.

### Phase C: UI Adjustments
- Remove "Scan QR" UI.
- Replace with "Account Status" (Connected/Disconnected via Token validation).
- Add Template Management UI if high-volume marketing is intended.

## 4. Example Send Request (Javascript)

```javascript
const response = await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    to: "1234567890",
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }
    }
  })
});
```

## 5. Challenges & Considerations

- **Approval:** Every message template must be approved by Meta.
- **24-Hour Window:** You can only send free-form messages if the user messaged you in the last 24 hours.
- **Setup Complexity:** Requires DNS verification and SSL for webhooks.

---
*For a full implementation plan or a demo of specific modules, please let me know!*
