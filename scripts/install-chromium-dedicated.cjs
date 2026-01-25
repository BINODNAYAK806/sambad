const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const extract = require('extract-zip');

const CHROMIUM_REVISION = '1108766';
const DOWNLOAD_HOST = 'https://storage.googleapis.com';
const DEDICATED_FOLDER = 'C:\\Sambad\\chromium';

console.log('============================================================');
console.log('   Installing Chromium to Dedicated Folder');
console.log('============================================================\n');

async function downloadChromium() {
    const platform = process.platform;
    let downloadURL, zipFileName, extractFolderName;

    if (platform === 'win32') {
        downloadURL = `${DOWNLOAD_HOST}/chromium-browser-snapshots/Win_x64/${CHROMIUM_REVISION}/chrome-win.zip`;
        zipFileName = 'chrome-win.zip';
        extractFolderName = 'chrome-win';
    } else if (platform === 'darwin') {
        downloadURL = `${DOWNLOAD_HOST}/chromium-browser-snapshots/Mac/${CHROMIUM_REVISION}/chrome-mac.zip`;
        zipFileName = 'chrome-mac.zip';
        extractFolderName = 'chrome-mac';
    } else if (platform === 'linux') {
        downloadURL = `${DOWNLOAD_HOST}/chromium-browser-snapshots/Linux_x64/${CHROMIUM_REVISION}/chrome-linux.zip`;
        zipFileName = 'chrome-linux.zip';
        extractFolderName = 'chrome-linux';
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Create dedicated folder
    console.log(`📁 Creating dedicated folder: ${DEDICATED_FOLDER}`);
    if (!fs.existsSync(DEDICATED_FOLDER)) {
        fs.mkdirSync(DEDICATED_FOLDER, { recursive: true });
    }

    const zipPath = path.join(DEDICATED_FOLDER, zipFileName);
    const extractPath = DEDICATED_FOLDER;

    // Check if already installed
    const chromiumExecPath = platform === 'win32'
        ? path.join(DEDICATED_FOLDER, extractFolderName, 'chrome.exe')
        : platform === 'darwin'
            ? path.join(DEDICATED_FOLDER, extractFolderName, 'Chromium.app', 'Contents', 'MacOS', 'Chromium')
            : path.join(DEDICATED_FOLDER, extractFolderName, 'chrome');

    if (fs.existsSync(chromiumExecPath)) {
        console.log(`✅ Chromium already installed at: ${chromiumExecPath}`);
        console.log(`   Revision: ${CHROMIUM_REVISION}`);
        return;
    }

    console.log(`📥 Downloading Chromium revision ${CHROMIUM_REVISION}...`);
    console.log(`   URL: ${downloadURL}`);
    console.log(`   Destination: ${zipPath}\n`);

    // Download
    await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        let downloadedBytes = 0;
        let totalBytes = 0;

        https.get(downloadURL, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Download failed with status ${response.statusCode}`));
                return;
            }

            totalBytes = parseInt(response.headers['content-length'], 10);

            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
                process.stdout.write(`\r   Progress: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log('\n   ✓ Download complete\n');
                resolve();
            });
        }).on('error', (err) => {
            fs.unlinkSync(zipPath);
            reject(err);
        });
    });

    console.log(`📦 Extracting to: ${extractPath}...`);
    await extract(zipPath, { dir: extractPath });
    console.log('   ✓ Extraction complete');

    // Clean up zip
    fs.unlinkSync(zipPath);
    console.log('   ✓ Cleaned up zip file');

    // Verify installation
    if (!fs.existsSync(chromiumExecPath)) {
        throw new Error(`Chromium executable not found at: ${chromiumExecPath}`);
    }

    console.log('\n============================================================');
    console.log('   ✅ Chromium Installation Complete!');
    console.log('============================================================');
    console.log(`\nChromium installed to: ${chromiumExecPath}`);
    console.log(`Revision: ${CHROMIUM_REVISION}`);
    console.log(`\nYou can now run your app. It will automatically use this Chromium.`);
    console.log('\n');
}

downloadChromium().catch((error) => {
    console.error('\n❌ Installation failed:', error);
    process.exit(1);
});
