@echo off
echo ============================================================
echo    Sambad App Launch Fix - Complete Rebuild
echo ============================================================
echo.

echo [Step 1/5] Stopping any running processes...
taskkill /F /IM Sambad.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo Done!
echo.

echo [Step 2/5] Waiting for file locks to release...
timeout /t 3 /nobreak >nul
echo.

echo [Step 3/5] Cleaning old build artifacts...
call npm run clean
if %errorlevel% neq 0 (
    echo Warning: Clean script had issues, continuing anyway...
)
echo.

echo [Step 4/5] Building the application...
echo This may take a few minutes...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Check the error messages above.
    echo.
    echo Common issues:
    echo   1. Missing dependencies - run: npm install
    echo   2. TypeScript errors - check your code
    echo   3. Out of memory - close other programs
    echo.
    pause
    exit /b 1
)
echo.

echo [Step 5/5] Verifying build output...
if not exist "dist\index.html" (
    echo ❌ ERROR: Renderer build failed - dist\index.html not found
    echo.
    echo Try running: npm run build:renderer
    pause
    exit /b 1
)

if not exist "dist-electron\electron\main\index.js" (
    echo ❌ ERROR: Electron build failed - main entry point not found
    echo.
    echo Try running: npm run build:electron
    pause
    exit /b 1
)

echo ✓ Renderer built successfully
echo ✓ Electron main built successfully
echo ✓ Preload script built successfully
echo.

echo ============================================================
echo    ✅ Build Complete!
echo ============================================================
echo.
echo You can now:
echo   1. Run in development: npm run dev
echo   2. Test production build: npm run electron:prod
echo   3. Create installer: npm run dist:win
echo.
echo To start the app now, run: npm run electron:prod
echo.
pause
