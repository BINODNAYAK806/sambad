# 📸 Media + Caption Flow - How It Works

## ✅ Database Structure

```sql
CREATE TABLE campaign_media (
  id TEXT PRIMARY KEY,
  campaign_id BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT,              -- ✅ Local file path
  caption TEXT,                 -- ✅ Caption with variables like {{v1}}
  created_at TIMESTAMPTZ NOT NULL
);
```

---

## 🔄 Complete Flow

### 1️⃣ Creating Campaign with Media

**User Action:**
1. Click "Create Campaign"
2. Add media file (image.png)
3. Set caption: "Hello {{v1}}, check this out!"
4. Click Save

**What Happens:**
```javascript
// CampaignDialog.tsx - Line 128-142
for (const attachment of mediaAttachments) {
  const arrayBuffer = await attachment.file.arrayBuffer();
  const base64Data = btoa(new Uint8Array(arrayBuffer).reduce(...));
  
  await window.electronAPI.campaigns.addMedia(campaignId, {
    fileName: attachment.file.name,
    fileType: attachment.type,
    fileSize: attachment.file.size,
    fileData: base64Data,           // Base64 encoded file
    caption: attachment.caption,     // "Hello {{v1}}, check this out!"
  });
}
```

**Backend (supabase.ts - Line 358-402):**
```typescript
// 1. Save file to disk
const filePath = path.join(os.homedir(), '.sambad', 'media', uniqueFileName);
fs.writeFileSync(filePath, Buffer.from(media.fileData, 'base64'));

// 2. Save to database with file_path and caption
await client.from('campaign_media').insert({
  campaign_id: campaignId,
  file_name: media.fileName,
  file_type: media.fileType,
  file_size: media.fileSize,
  file_path: filePath,              // ✅ Path saved!
  caption: media.caption,           // ✅ Caption saved!
});
```

---

### 2️⃣ Running Campaign

**User Action:**
1. Click "Run Campaign"
2. Campaign loads contacts from group

**What Happens:**
```javascript
// CampaignRunner.tsx - Line 140-162
// 1. Fetch media from database
const mediaResult = await window.electronAPI.campaigns.getMedia(campaign.id);
// Returns: [{ file_path: "~/.sambad/media/image.png", caption: "Hello {{v1}}, check this out!" }]

// 2. Attach media to EACH message
const messages = contacts.map((contact) => ({
  recipientNumber: contact.phone,
  templateText: campaign.message_template,
  variables: contact.variables,          // { v1: "John", v2: "Doe" }
  mediaAttachments: mediaAttachments,    // ✅ All media with captions
}));
```

---

### 3️⃣ Sending Media to Contact

**WhatsApp Worker (whatsappWorker.ts - Line 156-275):**

```typescript
// For EACH media attachment
for (let i = 0; i < attachmentsToSend.length; i++) {
  const attachment = attachmentsToSend[i];
  
  // 1. Load media from file_path
  const media = MessageMedia.fromFilePath(attachment.url);
  // attachment.url = ~/.sambad/media/image.png
  
  // 2. Resolve caption variables
  const caption = attachment.caption
    ? resolveTemplateVariables(attachment.caption, variables)
    : undefined;
  // attachment.caption = "Hello {{v1}}, check this out!"
  // After resolve: "Hello John, check this out!"
  
  // 3. Send media WITH caption
  await client.sendMessage(chatId, media, {
    caption: caption,  // ✅ Each media sent with its own caption!
  });
}
```

---

## 🎯 Example Scenario

### Campaign Setup:
- **Name:** "Product Launch"
- **Message:** "Hi {{v1}}! 🎉"
- **Group:** "All Customers" (3 contacts)
- **Media 1:** product.png, Caption: "New {{v2}} available!"
- **Media 2:** discount.pdf, Caption: "Special offer for {{v1}}"

### Contact List:
| Name | Phone | v1 | v2 |
|------|-------|----|----|
| John | 1234 | John | Laptop |
| Jane | 5678 | Jane | Phone |
| Mike | 9012 | Mike | Tablet |

### What Gets Sent to John (1234):

**Message 1 (product.png):**
```
📸 [product.png image]
Caption: "New Laptop available!"
```

**Message 2 (discount.pdf):**
```
📄 [discount.pdf document]
Caption: "Special offer for John"
```

### What Gets Sent to Jane (5678):

**Message 1 (product.png):**
```
📸 [product.png image]
Caption: "New Phone available!"
```

**Message 2 (discount.pdf):**
```
📄 [discount.pdf document]
Caption: "Special offer for Jane"
```

---

## ✅ Key Points

1. **Each media has its OWN caption** - stored in `campaign_media.caption`
2. **Caption variables are resolved PER CONTACT** - `{{v1}}` becomes contact's v1 value
3. **All media sent to ALL contacts** - but with personalized captions
4. **File stored once, sent multiple times** - saved in `~/.sambad/media/`
5. **Caption is optional** - if no caption, only media is sent

---

## 🧪 Testing

**Create campaign with:**
- Media 1: image.png, Caption: "Hi {{v1}}!"
- Media 2: doc.pdf, Caption: "Your {{v2}} is ready"

**Expected for contact (v1=John, v2=Order):**
```
Message 1: [image.png] "Hi John!"
Message 2: [doc.pdf] "Your Order is ready"
```

**Restart app and test now!** ✅
