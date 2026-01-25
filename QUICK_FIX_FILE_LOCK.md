# Quick Fix: Windows File Lock Error

## ⚡ Fast Solution

**On your Windows machine, run:**

```bash
fix-windows-lock.bat
```

## 📋 Manual Commands

**If batch script fails, run these one by one:**

```bash
# 1. Kill processes
taskkill /F /IM Sambad.exe /T
taskkill /F /IM electron.exe /T

# 2. Wait
timeout /t 3

# 3. Clean
npm run clean

# 4. Build
npm run build
npm run dist:win
```

## 🎯 What Fixed

The error you're seeing now is **different** from before:
- ✅ **OLD ERROR FIXED:** "Corrupted asar file"
- ⚠️ **NEW ERROR:** Windows file locking (common issue)

## 🔧 If Still Failing

1. **Close everything** (Explorer windows, terminals)
2. **Add antivirus exclusion** for your project folder
3. **Restart computer** if desperate
4. **Run commands again**

## 📖 Full Guide

See `WINDOWS_FILE_LOCK_FIX.md` for detailed troubleshooting.

---

**Note:** Run these commands on your **Windows PC**, not in this chat!
