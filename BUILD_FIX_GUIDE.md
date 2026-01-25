# ✅ BUILD FIX GUIDE - Quick Solution

**Problem:** Build fails with `EBUSY: resource busy or locked` on chrome.dll

**Solution:** Kill locked processes and rebuild

---

## 🔧 QUICK FIX (3 Steps)

### **Step 1: Kill All Node/Electron Processes**

```powershell
# Kill all node and electron processes
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*electron*"} | Stop-Process -Force

# Confirm they're gone
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*electron*"}
```

### **Step 2: Clean Build**

```powershell
npm run clean
```

### **Step 3: Build and Publish**

```powershell
$env:GH_TOKEN = "GITHUB_TOKEN_PLACEHOLDER"
npm run publish:win
```

---

## ✅ WHAT I FIXED

1. **Updated package.json** - Added puppeteer to `asarUnpack`:
   ```json
   "asarUnpack": [
     "**/*.node",
     "dist-electron/chromium/**/*",
     "dist-electron/electron/worker/**/*",
     "node_modules/puppeteer*/**/*"  ← Added this
   ]
   ```

2. **Created publish script** - `npm run publish:win` includes `-p always`

---

## 📋 IF STILL FAILS

### Option A: Manual Process Kill

1. Open PowerShell as Admin
2. Run: `taskkill /F /IM node.exe`
3. Run: `taskkill /F /IM electron.exe`
4. Then try build again

### Option B: Restart Computer

Sometimes the simplest solution works best!

---

## 🎯 EXPECTED BUILD TIME

- Clean: ~5 seconds
- Build: ~2 minutes
- Package: ~3-5 minutes
- Upload to GitHub: ~2-3 minutes

**Total: ~10-12 minutes**

---

## ✅ SUCCESS INDICATORS

You'll know it worked when you see:
```
✓ building        target=nsis file=dist/Sambad Setup 1.0.1.exe
✓ published to GitHub
```

Then check: `https://github.com/BINODNAYAK806/sambad/releases`

---

**Run the 3 commands above and you should be good to go!** 🚀
