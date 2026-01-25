const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('   Production-Grade Build Script with Auto-Retry');
console.log('============================================================\n');

const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function killProcesses() {
    console.log('🔧 Killing any locked Electron processes...');
    try {
        execSync('taskkill /F /IM electron.exe 2>nul', { stdio: 'ignore' });
        execSync('taskkill /F /IM Sambad.exe 2>nul', { stdio: 'ignore' });
        execSync('taskkill /F /IM chrome.exe 2>nul', { stdio: 'ignore' });
    } catch (e) {
        // Ignore errors if processes don't exist
    }
}

function cleanBuildDirs() {
    console.log('🧹 Cleaning build directories...');
    const dirs = ['dist', 'dist-electron'];

    for (const dir of dirs) {
        const dirPath = path.join(process.cwd(), dir);
        if (fs.existsSync(dirPath)) {
            try {
                fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
                console.log(`   ✓ Removed ${dir}`);
            } catch (e) {
                console.warn(`   ⚠ Warning: Could not remove ${dir}: ${e.message}`);
            }
        }
    }
}

async function attemptBuild(attempt) {
    console.log(`\n📦 Build attempt ${attempt}/${MAX_RETRIES}...`);

    try {
        // Kill processes
        killProcesses();
        await sleep(2000);

        // Clean directories
        cleanBuildDirs();
        await sleep(2000);

        // Run build
        console.log('🚀 Starting build...\n');
        execSync('npm run prebuild:dist && cross-env NODE_ENV=production npm run build && electron-builder --win', {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        console.log('\n✅ Build completed successfully!');
        return true;

    } catch (error) {
        console.error(`\n❌ Build attempt ${attempt} failed`);

        // Check if it's a file locking error
        if (error.message && (error.message.includes('EBUSY') || error.message.includes('ENOENT'))) {
            console.log('   Reason: File locking issue (EBUSY/ENOENT)');
            return false;
        } else {
            // If it's not a locking error, don't retry
            console.error('   Reason: Build error (not file locking)');
            throw error;
        }
    }
}

async function main() {
    let success = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        success = await attemptBuild(attempt);

        if (success) {
            console.log('\n============================================================');
            console.log('   ✅ BUILD SUCCESSFUL!');
            console.log('============================================================');
            console.log(`\n📦 Installer created: dist\\Sambad Setup 1.0.1.exe\n`);
            process.exit(0);
        }

        if (attempt < MAX_RETRIES) {
            console.log(`\n⏳ Waiting ${RETRY_DELAY / 1000} seconds before retry...`);
            await sleep(RETRY_DELAY);
        }
    }

    if (!success) {
        console.log('\n============================================================');
        console.log('   ❌ BUILD FAILED AFTER ALL RETRIES');
        console.log('============================================================');
        console.log('\nPossible solutions:');
        console.log('1. Temporarily disable Windows Defender Real-time Protection');
        console.log('2. Add D:\\sam-12 to antivirus exclusions');
        console.log('3. Restart your computer and try again');
        console.log('4. Close all running applications and try again\n');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
