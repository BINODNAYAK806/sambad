const { install, Browser } = require('@puppeteer/browsers');
const path = require('path');
const fs = require('fs');

// Use Chrome for Testing (User specific request)
const CHROMIUM_REVISION = '143.0.7499.169';
const DOWNLOAD_PATH = path.join(__dirname, '..', 'chromium');

async function downloadChromium() {
  console.log('[Download Chromium] Starting Chromium download...');
  console.log(`[Download Chromium] Revision: ${CHROMIUM_REVISION}`);
  console.log(`[Download Chromium] Target path: ${DOWNLOAD_PATH}`);

  if (!fs.existsSync(DOWNLOAD_PATH)) {
    fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
    console.log('[Download Chromium] Created download directory');
  }

  try {
    console.log('[Download Chromium] Downloading...');
    const buildInfo = await install({
      browser: Browser.CHROME,
      buildId: CHROMIUM_REVISION,
      cacheDir: DOWNLOAD_PATH,
      unpack: true
    });

    console.log('\n[Download Chromium] Download complete!');
    console.log('[Download Chromium] Executable path:', buildInfo.executablePath);
    console.log('[Download Chromium] Build ID:', buildInfo.buildId);

    // Normalize path for consistent usage
    const executablePath = path.resolve(buildInfo.executablePath);

    if (fs.existsSync(executablePath)) {
      console.log('[Download Chromium] ✓ Chromium binary verified');
    } else {
      throw new Error('Downloaded Chromium binary not found at expected path');
    }

    const infoFile = path.join(DOWNLOAD_PATH, 'chromium-info.json');
    fs.writeFileSync(infoFile, JSON.stringify({
      revision: CHROMIUM_REVISION,
      executablePath: executablePath,
      folderPath: path.dirname(executablePath),
      downloadedAt: new Date().toISOString(),
    }, null, 2));
    console.log('[Download Chromium] Wrote chromium-info.json');

    return buildInfo;
  } catch (error) {
    console.error('[Download Chromium] Error downloading Chromium:', error);
    throw error;
  }
}

// Check if already downloaded (simple check)
const existingChromiumPath = path.join(DOWNLOAD_PATH, 'chromium-info.json');
if (fs.existsSync(existingChromiumPath)) {
  try {
    const info = JSON.parse(fs.readFileSync(existingChromiumPath, 'utf8'));
    if (info.revision === CHROMIUM_REVISION && fs.existsSync(info.executablePath)) {
      console.log('[Download Chromium] Chromium already downloaded (revision:', CHROMIUM_REVISION, ')');
      console.log('[Download Chromium] Skipping download');
      process.exit(0);
    }
  } catch (error) {
    console.log('[Download Chromium] Could not read existing chromium-info.json, will re-download');
  }
}

downloadChromium()
  .then(() => {
    console.log('[Download Chromium] SUCCESS');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Download Chromium] FAILED:', error);
    process.exit(1);
  });
