@echo off
echo ============================================================
echo    Windows File Lock Fix for Sambad Build
echo ============================================================
echo.

echo Step 1: Killing any running Sambad/Electron processes...
taskkill /F /IM Sambad.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul
echo Done!
echo.

echo Step 2: Waiting for file locks to release...
timeout /t 3 /nobreak >nul
echo.

echo Step 3: Cleaning build artifacts...
call npm run clean
echo.

echo Step 4: Building project...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)
echo.

echo Step 5: Creating Windows distribution...
call npm run dist:win
if %errorlevel% neq 0 (
    echo.
    echo ❌ Distribution build failed! Please check the errors above.
    pause
    exit /b 1
)
echo.

echo ============================================================
echo    ✅ Build completed successfully!
echo ============================================================
echo.
echo Your Windows installer is ready in the release folder!
pause
