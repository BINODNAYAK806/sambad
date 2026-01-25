# Windows File Lock Fix Guide

## The Problem

When building on Windows, you may encounter this error:
```
The process cannot access the file because it is being used by another process.
remove C:\...\release\win-unpacked\resources\app.asar
```

This happens when Windows has locked files in the release directory.

## Quick Fix (Automated)

**Run this batch script on your Windows machine:**

```bash
fix-windows-lock.bat
```

This script will:
1. Kill any running Sambad/Electron processes
2. Wait for file locks to release
3. Clean build artifacts
4. Rebuild the project
5. Create the Windows distribution

## Manual Fix Steps

If the automated script doesn't work, follow these steps:

### 1. Close All Running Apps

**Check Task Manager (Ctrl + Shift + Esc):**
- Look for `Sambad.exe`
- Look for `electron.exe`
- Look for `node.exe` (if any are related to your build)
- Right-click → "End Task" on each

**Or use Command Prompt:**
```bash
taskkill /F /IM Sambad.exe /T
taskkill /F /IM electron.exe /T
```

### 2. Close Windows Explorer Windows

- Close any Windows Explorer windows showing the `release/` folder
- Close any command prompts with `cd` in the release directory

### 3. Check for File Locks

Download [Microsoft Handle](https://docs.microsoft.com/en-us/sysinternals/downloads/handle):
```bash
handle.exe app.asar
```

This will show which process is locking the file.

### 4. Clean Build Directory

**Option A: Use npm clean script**
```bash
npm run clean
```

**Option B: Manually delete**
```bash
rmdir /s /q release
rmdir /s /q dist
rmdir /s /q dist-electron
```

### 5. Rebuild

```bash
npm run build
npm run dist:win
```

## Common Causes & Solutions

### Antivirus Scanning Files

**Problem:** Your antivirus is scanning the build files while electron-builder tries to package them.

**Solution:**
1. Open Windows Security (or your antivirus)
2. Go to "Virus & threat protection"
3. Click "Manage settings"
4. Scroll to "Exclusions"
5. Add your project folder: `C:\Users\Lenovo\Downloads\sam-12\sam-12\`

### Windows Defender Real-Time Protection

**Temporary disable (not recommended):**
1. Windows Security → Virus & threat protection
2. Manage settings → Turn off Real-time protection (temporary)
3. Run your build
4. Turn it back ON immediately

**Better: Add exclusion (recommended above)**

### Windows Search Indexing

**Problem:** Windows Search is indexing your build files.

**Solution:**
1. Open "Indexing Options" (search in Start menu)
2. Click "Modify"
3. Uncheck your project folder
4. Click "OK"

### Previous Build Still Running

**Problem:** The app from a previous build is still running in the background.

**Solution:**
```bash
# Kill all Node and Electron processes
taskkill /F /IM node.exe /T
taskkill /F /IM electron.exe /T
taskkill /F /IM Sambad.exe /T

# Wait a moment
timeout /t 3

# Then rebuild
npm run dist:win
```

## Nuclear Option: Restart Computer

If nothing else works:

1. **Save all your work**
2. **Restart your computer**
3. **Run immediately after restart:**
   ```bash
   cd C:\Users\Lenovo\Downloads\sam-12\sam-12
   npm run dist:win
   ```

This releases all file locks and starts fresh.

## Prevention Tips

### 1. Don't Open the App During Build

- Close the app before running `npm run dist:win`
- Don't test the app from the `release/` folder while building

### 2. Use Developer Mode

For testing changes, use dev mode instead:
```bash
npm run dev
```

Only build distributions when ready to release.

### 3. Clean Between Builds

Always clean before rebuilding:
```bash
npm run clean && npm run dist:win
```

### 4. Close Unnecessary Programs

Before building:
- Close Windows Explorer windows
- Close unnecessary terminals
- Close resource-heavy programs

## Verify Success

After successful build, you should see:
```
✅ Build completed successfully!
```

Your installer will be in:
```
release/Sambad Setup 1.0.0.exe
```

## Still Having Issues?

If you continue to have problems:

1. **Check disk space:** Ensure you have at least 5GB free
2. **Check permissions:** Run Command Prompt as Administrator
3. **Check path length:** Move project to shorter path (e.g., `C:\sambad\`)
4. **Check antivirus logs:** See if it's blocking files
5. **Use Process Explorer:** Download from Microsoft Sysinternals for advanced troubleshooting

## Success Indicators

You'll know it's working when you see:
```
• packaging       platform=win32 arch=x64 electron=32.3.3
• building        target=nsis file=release\Sambad Setup 1.0.0.exe
• building block map  blockMapFile=release\Sambad Setup 1.0.0.exe.blockmap
```

Without any file access errors!

## Summary of Commands

```bash
# Complete fix sequence
taskkill /F /IM Sambad.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul
timeout /t 3
npm run clean
npm run build
npm run dist:win
```

Or simply run:
```bash
fix-windows-lock.bat
```

---

**Remember:** This is a Windows-specific file locking issue, not a problem with your code. The original asar corruption issue has been fixed!
