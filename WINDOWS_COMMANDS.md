# Windows Command Reference

Quick reference for common tasks on Windows.

---

## Development Commands

### Install Dependencies
```cmd
npm install
```

### Run in Development Mode
```cmd
npm run dev
```

### Stop Development Server
Press `Ctrl+C` in the terminal

---

## Build Commands

### Build for Testing
```cmd
npm run build
```

### Build Windows Installer
```cmd
npm run dist:win
```

### Clean + Build (Recommended)
```cmd
npm run clean
npm run dist:win
```

---

## Cleanup Commands

### Clean Build Folders (npm)
```cmd
npm run clean
```

### Clean Build Folders (Manual)
```cmd
rmdir /s /q release
rmdir /s /q dist
rmdir /s /q dist-electron
rmdir /s /q node_modules\.cache
```

### Force Kill Processes (If app won't close)
Open Task Manager (`Ctrl+Shift+Esc`) and end:
- sambad.exe
- electron.exe
- node.exe

Or use Command Prompt as Administrator:
```cmd
taskkill /F /IM electron.exe
taskkill /F /IM sambad.exe
taskkill /F /IM node.exe
```

---

## Troubleshooting Commands

### Verify Chromium Installation
```cmd
npm run verify:chromium
```

### Verify Packaged Build
```cmd
npm run verify:packaged
```

### Full Clean Reinstall
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
npm run clean
npm run dist:win
```

### Check Node Version
```cmd
node --version
```
Should be 18 or higher

### Check npm Version
```cmd
npm --version
```

---

## Common Issues and Fixes

### "scripts\force-clean.bat is not recognized"
**Fix**: Use `npm run clean` instead

### "EBUSY: resource busy or locked"
**Fix**:
1. Close the app completely
2. Check Task Manager for lingering processes
3. Try again

### "Cannot find module"
**Fix**:
```cmd
npm install
```

### Build hangs or freezes
**Fix**:
1. Press `Ctrl+C` to stop
2. Run: `npm run clean`
3. Close all Node/Electron processes
4. Try again: `npm run dist:win`

---

## Output Locations

- **Development Build**: `dist/` and `dist-electron/`
- **Production Installer**: `release/`
- **Logs**: View in the app's Console window
- **Database**: `sambad.db` (in app data folder)
- **WhatsApp Session**: `.wwebjs_auth/` (in app data folder)

---

## Tips

1. **Always clean before building for distribution**:
   ```cmd
   npm run clean && npm run dist:win
   ```

2. **If build fails, try a full reinstall**:
   ```cmd
   rmdir /s /q node_modules
   npm install
   npm run dist:win
   ```

3. **Check for locked files**: Close all instances of the app, including in Task Manager

4. **Run Command Prompt as Administrator** if you get permission errors

5. **Antivirus interference**: Temporarily disable antivirus if builds fail repeatedly
