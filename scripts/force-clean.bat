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
