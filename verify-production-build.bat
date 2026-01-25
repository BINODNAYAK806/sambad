@echo off
REM ========================================
REM Sambad - Clean Build & Verification
REM ========================================

echo.
echo ============================================
echo  Sambad Production Build Verification
echo ============================================
echo.

REM Step 1: Clean previous builds
echo [1/7] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
echo       ✓ Cleaned dist and dist-electron folders
if exist *.tsbuildinfo del *.tsbuildinfo
echo       ✓ Cleaned tsbuildinfo cache files
echo.

REM Step 2: Build renderer (Vite)
echo [2/7] Building renderer (Vite)...
call npm run build:renderer
if errorlevel 1 (
    echo       ✗ Renderer build failed!
    pause
    exit /b 1
)
echo       ✓ Renderer build complete
echo.

REM Step 3: Build electron (TypeScript compilation)
echo [3/7] Building electron main and preload...
call npm run build:electron
if errorlevel 1 (
    echo       ✗ Electron build failed!
    pause
    exit /b 1
)
echo       ✓ Electron build complete
echo.

REM Step 4: Verify build outputs
echo [4/7] Verifying build outputs...

if not exist "dist\index.html" (
    echo       ✗ ERROR: dist\index.html not found!
    pause
    exit /b 1
)
echo       ✓ dist\index.html exists

if not exist "dist\assets" (
    echo       ✗ ERROR: dist\assets folder not found!
    pause
    exit /b 1
)
echo       ✓ dist\assets folder exists

if not exist "dist-electron\electron\main\index.js" (
    echo       ✗ ERROR: dist-electron\electron\main\index.js not found!
    pause
    exit /b 1
)
echo       ✓ dist-electron\electron\main\index.js exists

if not exist "dist-electron\electron\preload\index.cjs" (
    echo       ✗ ERROR: dist-electron\electron\preload\index.cjs not found!
    pause
    exit /b 1
)
echo       ✓ dist-electron\electron\preload\index.cjs exists

echo.

REM Step 5: Verify HTML uses relative paths
echo [5/7] Verifying HTML uses relative paths...
findstr /C:"\"./assets/" dist\index.html >nul
if errorlevel 1 (
    echo       ⚠ WARNING: index.html may not be using relative paths!
    echo       Check that script src and link href use ./assets/
) else (
    echo       ✓ HTML uses relative asset paths
)
echo.

REM Step 6: Test production mode (optional)
echo [6/7] Would you like to test production mode before packaging?
echo       (This will run the app without packaging it into .exe)
echo.
set /p TESTPROD="      Test now? (y/n): "
if /i "%TESTPROD%"=="y" (
    echo.
    echo       Starting production mode test...
    echo       Press Ctrl+C in this window to stop the app when done testing
    echo.
    pause
    call npm run electron:prod
)
echo.

REM Step 7: Summary
echo [7/7] Build verification complete!
echo.
echo ============================================
echo  Build Status: SUCCESS
echo ============================================
echo.
echo Next steps:
echo   1. If production test worked, proceed with packaging:
echo      npm run dist:win
echo.
echo   2. The installer will be created in: dist\Sambad Setup 1.0.0.exe
echo.
echo   3. Install and test the packaged application
echo.
echo ============================================
echo.
pause
