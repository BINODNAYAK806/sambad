# 📁 SAMBAD - LOCAL DATA STORAGE LOCATIONS

## 🎯 Main Storage Directory

### **Windows:**
```
C:\Users\[Your-Username]\AppData\Roaming\Sambad\
```

**Quick access:**
1. Press `Win + R`
2. Type: `%APPDATA%\Sambad`
3. Press Enter

---

## 📂 Complete File Structure

```
C:\Users\[Username]\AppData\Roaming\Sambad\
│
├── 📄 sambad.db                    # Main SQLite database
│   └── Contains:
│       • Contacts
│       • Campaigns  
│       • Campaign runs
│       • Messages
│       • Groups
│       • Users
│       • Permissions
│       • All app data
│
├── 📁 .wwebjs_auth\                # WhatsApp authentication
│   └── session-[name]\
│       • Contains WhatsApp session data
│       • QR code authentication info
│       • Keeps you logged in
│
├── 📁 campaign_media\              # Campaign media files
│   └── [campaign-id]\
│       • Images uploaded for campaigns
│       • Videos, documents
│       • Stored as base64 or file paths
│
├── 📁 temp_media\                  # Temporary media files
│   └── Temporary uploads before processing
│
├── 📁 logs\                        # Application logs
│   └── Contains debug and error logs
│
├── 📄 error.log                    # Error log file
│   └── All application errors logged here
│
├── 📄 .env                         # Environment variables (legacy)
│   └── Supabase credentials (if using cloud mode)
│
├── 📄 .sambad-credentials         # Encrypted credentials
│   └── Stored securely
│
└── 📄 supabase-config.json        # Supabase configuration
    └── Database connection settings
```

---

## 📊 Data Storage Breakdown

### 1️⃣ **Database (sambad.db)**
**Location:** `%APPDATA%\Sambad\sambad.db`  
**Type:** SQLite Database  
**Size:** Grows with data (typically 10-100 MB)

**Contents:**
- ✅ All contacts with phone numbers, names, tags
- ✅ Campaign configurations and schedules
- ✅ Campaign execution history
- ✅ Message delivery status
- ✅ User accounts and permissions
- ✅ Groups and group memberships
- ✅ License and subscription info

**To view:**
- Download: [DB Browser for SQLite](https://sqlitebrowser.org/)
- Open: `sambad.db`
- Browse tables and data

---

### 2️⃣ **WhatsApp Session (.wwebjs_auth)**
**Location:** `%APPDATA%\Sambad\.wwebjs_auth\`  
**Type:** Folder with session files  
**Size:** ~50-200 MB

**Contents:**
- ✅ WhatsApp authentication tokens
- ✅ Session data (keeps you logged in)
- ✅ Chat archives and metadata
- ✅ Media cache

**Important:**
- ⚠️ Don't delete this folder (you'll need to re-scan QR code)
- ⚠️ Contains sensitive authentication data
- ✅ Backup this folder to restore WhatsApp session

---

### 3️⃣ **Campaign Media (campaign_media)**
**Location:** `%APPDATA%\Sambad\campaign_media\`  
**Type:** Folder with subfolders per campaign  
**Size:** Depends on media uploaded

**Structure:**
```
campaign_media\
├── campaign-1\
│   ├── image1.jpg
│   ├── image2.png
│   └── video1.mp4
└── campaign-2\
    └── document.pdf
```

**Contents:**
- ✅ Images attached to campaigns
- ✅ Videos for WhatsApp messages
- ✅ Documents and PDFs
- ✅ Audio files

---

### 4️⃣ **Configuration Files**

**supabase-config.json**
```
Location: %APPDATA%\Sambad\supabase-config.json
Contains: Database URL and API key
Used for: Cloud database connection
```

**.env (Legacy)**
```
Location: %APPDATA%\Sambad\.env
Contains: Environment variables
Used for: Older versions, Supabase credentials
```

**.sambad-credentials**
```
Location: %APPDATA%\Sambad\.sambad-credentials
Contains: Encrypted sensitive data
Used for: Secure storage of API keys
```

---

### 5️⃣ **Logs (logs/)**
**Location:** `%APPDATA%\Sambad\logs\`  
**Type:** Text log files  
**Size:** Usually small (1-10 MB)

**Contents:**
- ✅ Application startup/shutdown logs
- ✅ Database operations
- ✅ Campaign execution logs
- ✅ Error traces
- ✅ Debug information

**Log files:**
- `main.log` - Main process logs
- `renderer.log` - UI logs
- `[date].log` - Daily log files

---

## 🔍 How to Access Your Data

### **Method 1: Windows Explorer**
1. Press `Win + R`
2. Type: `%APPDATA%\Sambad`
3. Press `Enter`

### **Method 2: From App**
The path is logged when you start the app:
```
[Sambad] User data path: C:\Users\[Username]\AppData\Roaming\Sambad
```

### **Method 3: PowerShell**
```powershell
cd $env:APPDATA\Sambad
dir
```

---

## 💾 Backup Your Data

### **What to Backup:**

**Essential (Must backup):**
```
✅ sambad.db                 # Your entire database
✅ .wwebjs_auth\            # WhatsApp session (avoid re-scanning QR)
✅ campaign_media\          # Your media files
```

**Optional:**
```
⭐ supabase-config.json     # Database settings
⭐ logs\                    # For troubleshooting
```

### **How to Backup:**

**Quick Backup:**
```powershell
# Copy entire Sambad folder
xcopy "%APPDATA%\Sambad" "D:\Backup\Sambad" /E /I /Y
```

**Scheduled Backup Script:**
Create a file `backup-sambad.bat`:
```batch
@echo off
set SOURCE=%APPDATA%\Sambad
set DEST=D:\Backups\Sambad-%date:~-4,4%%date:~-10,2%%date:~-7,2%
xcopy "%SOURCE%" "%DEST%" /E /I /Y
echo Backup complete: %DEST%
pause
```

---

## 📦 Data Size Reference

| Component | Typical Size | Can Grow To |
|-----------|--------------|-------------|
| sambad.db | 10-50 MB | 500+ MB (with lots of data) |
| .wwebjs_auth | 50-200 MB | 500 MB (active WhatsApp) |
| campaign_media | 0-100 MB | Unlimited (depends on uploads) |
| logs | 1-10 MB | 50 MB (rotates) |
| **Total** | **~100 MB** | **1+ GB** |

---

## 🔒 Data Privacy & Security

### **Sensitive Files:**
⚠️ These files contain sensitive data:
- `sambad.db` - All contacts, messages, campaigns
- `.wwebjs_auth/` - WhatsApp authentication
- `.sambad-credentials` - API keys
- `supabase-config.json` - Database credentials

### **Security Tips:**
```
✅ Don't share these files
✅ Keep backups encrypted
✅ Don't upload to public cloud
✅ Use external drive for backups
```

---

## 🧹 Clean Up / Reset

### **To completely reset the app:**

**Warning: This deletes ALL data!**

```powershell
# Close Sambad app first
# Then run:
Remove-Item -Recurse -Force "$env:APPDATA\Sambad"
```

### **To reset only WhatsApp (re-scan QR code):**
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\Sambad\.wwebjs_auth"
```

### **To clear logs only:**
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\Sambad\logs"
```

---

## 📱 Moving Data to Another Computer

### **Steps:**

1. **On old computer:**
   ```powershell
   xcopy "%APPDATA%\Sambad" "D:\sambad-backup" /E /I /Y
   ```

2. **Copy to USB/cloud:** `D:\sambad-backup\`

3. **On new computer:**
   ```powershell
   # Install Sambad first, then close it
   xcopy "D:\sambad-backup" "%APPDATA%\Sambad" /E /I /Y
   ```

4. **Start Sambad** - All data restored!

---

## 🔧 Troubleshooting

### **Database locked error:**
```
→ Close all Sambad instances
→ Check Task Manager (Ctrl+Shift+Esc)
→ End any "Sambad.exe" processes
→ Restart Sambad
```

### **WhatsApp won't connect:**
```
→ Delete: %APPDATA%\Sambad\.wwebjs_auth
→ Restart app
→ Scan QR code again
```

### **Data not showing:**
```
→ Check: %APPDATA%\Sambad\sambad.db exists
→ Check file size (should be > 10 KB)
→ If corrupted, restore from backup
```

---

## 📊 Summary

**Main Directory:**
```
C:\Users\[Your-Username]\AppData\Roaming\Sambad\
```

**Quick Access:**
- Press `Win + R` → Type `%APPDATA%\Sambad` → Enter

**Most Important Files:**
1. `sambad.db` - Your database
2. `.wwebjs_auth/` - WhatsApp session  
3. `campaign_media/` - Media files

**Backup Recommendation:**
- ✅ Backup weekly (or before major operations)
- ✅ Copy entire `Sambad` folder to external drive
- ✅ Keep at least 2 backup copies

---

## 🎯 Quick Commands

**Open data folder:**
```powershell
explorer "%APPDATA%\Sambad"
```

**Check folder size:**
```powershell
Get-ChildItem -Recurse "$env:APPDATA\Sambad" | Measure-Object -Property Length -Sum
```

**List all files:**
```powershell
dir "$env:APPDATA\Sambad" /s
```

**Backup to desktop:**
```powershell
xcopy "%APPDATA%\Sambad" "%USERPROFILE%\Desktop\Sambad-Backup" /E /I /Y
```

---

**Need to find your data? Just press `Win+R` and type `%APPDATA%\Sambad`! 📂**
