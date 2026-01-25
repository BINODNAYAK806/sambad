# Quick Fix - QR Code and API Issues

## Problem
The app is showing:
- `[ElectronAPI] Timeout waiting for electronAPI`
- QR code not loading
- "WhatsApp client is not ready" error

## Root Cause
The app is running in a **regular web browser** instead of **Electron desktop app**.

---

## ✅ SOLUTION - Run in Electron

### Step 1: Stop Everything
```bash
# Press Ctrl+C in your terminal to stop any running processes

# Or kill all Node/Electron processes:
# Windows:
taskkill /F /IM electron.exe
taskkill /F /IM node.exe

# Linux/Mac:
pkill -f electron
pkill -f node
```

### Step 2: Clean Build
```bash
npm run build:electron
```

### Step 3: Start Properly
```bash
npm run dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. **Automatically launch Electron desktop app**
3. Load the Vite server inside Electron window

### Step 4: Wait for Window
- Wait for the **Electron desktop window** to open (not browser)
- You should see "Sambad - WhatsApp Campaign Manager" window
- Don't use the browser tab - use the desktop app window

---

## ⚠️ Important Notes

### DO NOT:
- ❌ Open http://localhost:5173 in Chrome/Firefox/Edge
- ❌ Use the browser - it won't have Electron APIs
- ❌ Run `npm run dev:vite` alone

### DO:
- ✅ Run `npm run dev` (starts both Vite + Electron)
- ✅ Wait for Electron desktop window to open
- ✅ Use the desktop app window only

---

## 🔍 How to Tell if You're in the Right Place

### ✅ CORRECT (Electron Desktop App):
- Window title: "Sambad - WhatsApp Campaign Manager"
- Standalone desktop window (not a browser tab)
- Console shows: `[Preload] ✓ electronAPI successfully exposed`
- No "[ElectronAPI] Timeout" errors
- WhatsApp connection works

### ❌ WRONG (Browser):
- Browser address bar showing "localhost:5173"
- Chrome/Firefox/Edge browser tab
- Console shows: `[ElectronAPI] Timeout waiting for electronAPI`
- WhatsApp connection fails
- electronAPI is undefined

---

## 🎯 Expected Flow

1. Run `npm run dev`
2. Terminal shows:
   ```
   VITE v5.x.x ready at http://localhost:5173
   [Sambad] App ready, initializing...
   [Sambad] Creating main window
   [Preload] ✓ electronAPI successfully exposed
   ```
3. **Electron window opens** (desktop app, not browser)
4. Click "Connect WhatsApp" in the desktop window
5. QR code appears
6. Scan with phone
7. Ready to send campaigns!

---

## 🚀 Complete Restart Commands

```bash
# Stop everything
taskkill /F /IM electron.exe
taskkill /F /IM node.exe

# Clean and rebuild
npm run build:electron

# Start correctly
npm run dev
```

**Then use the Electron desktop window that opens, NOT the browser!**

---

## 📝 package.json Scripts Reference

```json
{
  "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
  "dev:vite": "vite",
  "dev:electron": "wait-on http://localhost:5173 && npm run build:electron && electron ."
}
```

- `npm run dev` → Starts BOTH Vite and Electron ✅
- `npm run dev:vite` → Starts ONLY Vite (browser only) ❌
- `npm run dev:electron` → Starts ONLY Electron (needs Vite running first) ⚠️

**Always use `npm run dev`!**

---

## ✅ Success Checklist

After running `npm run dev`:
- [ ] Electron desktop window opened
- [ ] Window title is "Sambad - WhatsApp Campaign Manager"
- [ ] No browser tabs open to localhost:5173
- [ ] Console shows `[Preload] ✓ electronAPI successfully exposed`
- [ ] No "[ElectronAPI] Timeout" errors
- [ ] WhatsApp Connection section is visible
- [ ] Click "Connect WhatsApp" → QR code appears
- [ ] Everything works!

---

## 🎉 You're Ready!

Once the Electron window opens:
1. Navigate to any page using the sidebar
2. Click "Connect WhatsApp"
3. QR code will display properly
4. Scan with your phone
5. Start sending campaigns!

**Remember: Always use the Electron desktop window, not the browser!**
