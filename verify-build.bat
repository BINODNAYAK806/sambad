@echo off
echo ============================================================
echo    Sambad Build Verification Tool
echo ============================================================
echo.

set ERROR_FOUND=0

echo Checking required files...
echo.

echo [1] Checking package.json...
if exist "package.json" (
    echo    ✓ package.json exists
    findstr /C:"\"main\": \"dist-electron/electron/main/index.js\"" package.json >nul
    if %errorlevel% equ 0 (
        echo    ✓ Main entry point is correctly set
    ) else (
        echo    ❌ Main entry point is NOT correctly set
        set ERROR_FOUND=1
    )
) else (
    echo    ❌ package.json NOT FOUND
    set ERROR_FOUND=1
)
echo.

echo [2] Checking renderer build (React app)...
if exist "dist\index.html" (
    echo    ✓ dist\index.html exists
) else (
    echo    ❌ dist\index.html MISSING - renderer not built
    set ERROR_FOUND=1
)

if exist "dist\assets" (
    echo    ✓ dist\assets folder exists
) else (
    echo    ❌ dist\assets MISSING - renderer not built
    set ERROR_FOUND=1
)
echo.

echo [3] Checking Electron main process...
if exist "dist-electron\electron\main\index.js" (
    echo    ✓ Main process entry point exists
) else (
    echo    ❌ Main process entry point MISSING
    set ERROR_FOUND=1
)

if exist "dist-electron\electron\main\ipc.js" (
    echo    ✓ IPC handlers exist
) else (
    echo    ❌ IPC handlers MISSING
    set ERROR_FOUND=1
)
echo.

echo [4] Checking Electron preload script...
if exist "dist-electron\electron\preload\index.cjs" (
    echo    ✓ Preload script exists
) else (
    echo    ❌ Preload script MISSING
    set ERROR_FOUND=1
)
echo.

echo [5] Checking dependencies...
if exist "node_modules" (
    echo    ✓ node_modules exists
) else (
    echo    ❌ node_modules MISSING - run: npm install
    set ERROR_FOUND=1
)
echo.

echo ============================================================
if %ERROR_FOUND% equ 0 (
    echo    ✅ All checks passed!
    echo ============================================================
    echo.
    echo Your app is ready to run. You can:
    echo   - Run in dev mode: npm run dev
    echo   - Run in production: npm run electron:prod
    echo   - Build installer: npm run dist:win
) else (
    echo    ❌ Issues found!
    echo ============================================================
    echo.
    echo To fix these issues, run:
    echo   1. npm install          (install dependencies)
    echo   2. npm run build        (build the app)
    echo.
    echo Or use the automated fix:
    echo   fix-app-launch.bat
)
echo.
pause
