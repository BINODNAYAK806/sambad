# Windows Cleanup Guide

## Quick Fix for "scripts\force-clean.bat is not recognized" Error

The `.bat` file doesn't exist on your local Windows machine. Use these alternatives instead:

---

## Method 1: Use npm clean (RECOMMENDED)

```cmd
cd C:\Users\lenovo\Downloads\sam-12\sam-12
npm run clean
```

This runs the cross-platform Node.js cleanup script that works on all systems.

---

## Method 2: Manual Cleanup (If npm clean fails)

### Step 1: Kill Processes
Open Task Manager (`Ctrl+Shift+Esc`) and end these processes:
- `sambad.exe`
- `electron.exe`
- `node.exe`
- `app-builder.exe`

### Step 2: Delete Build Folders
```cmd
rmdir /s /q release
rmdir /s /q dist
rmdir /s /q dist-electron
rmdir /s /q node_modules\.cache
```

---

## Method 3: Create the .bat file locally

Create a file `scripts\force-clean.bat` with this content:

```batch
@echo off
echo ============================================
echo    FORCE CLEAN BUILD ARTIFACTS
echo ============================================
echo.
echo This will forcefully delete all build folders.
echo Close the app before running this script!
echo.
pause
echo.

echo Killing any running Electron processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM sambad.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM app-builder.exe 2>nul
echo.

echo Waiting 2 seconds for processes to fully close...
timeout /t 2 /nobreak >nul
echo.

echo Removing release folder...
if exist release (
    rmdir /s /q release
    if exist release (
        echo [WARNING] Could not remove release folder - it may be locked
    ) else (
        echo [SUCCESS] release folder removed
    )
) else (
    echo [SKIP] release folder doesn't exist
)

echo Removing dist folder...
if exist dist (
    rmdir /s /q dist
    if exist dist (
        echo [WARNING] Could not remove dist folder - it may be locked
    ) else (
        echo [SUCCESS] dist folder removed
    )
) else (
    echo [SKIP] dist folder doesn't exist
)

echo Removing dist-electron folder...
if exist dist-electron (
    rmdir /s /q dist-electron
    if exist dist-electron (
        echo [WARNING] Could not remove dist-electron folder - it may be locked
    ) else (
        echo [SUCCESS] dist-electron folder removed
    )
) else (
    echo [SKIP] dist-electron folder doesn't exist
)

echo Removing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo [SUCCESS] node_modules cache removed
) else (
    echo [SKIP] node_modules cache doesn't exist
)

echo.
echo ============================================
echo    CLEANUP COMPLETE
echo ============================================
echo.
echo You can now run: npm run dist:win
echo.
pause
```

Then run: `scripts\force-clean.bat`

---

## After Cleanup: Rebuild the App

```cmd
npm run dist:win
```

---

## Common Issues

### "Cannot remove folder - it may be locked"
- The app is still running
- A file explorer window is open in that folder
- An antivirus is scanning the folder
- Solution: Close everything and try again

### npm command not found
- You need Node.js installed
- Download from: https://nodejs.org/

### Permission denied errors
- Run Command Prompt as Administrator
- Right-click CMD → "Run as administrator"
