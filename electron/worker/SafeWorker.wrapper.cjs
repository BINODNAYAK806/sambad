/**
 * CommonJS Wrapper for SafeWorker
 *
 * This wrapper handles the loading of CommonJS dependencies (whatsapp-web.js)
 * in a Node.js environment where the main package is ESM.
 *
 * This file MUST remain as .cjs to ensure it's treated as CommonJS.
 */

const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

// Load whatsapp-web.js as CommonJS
let Client = null;
let LocalAuth = null;
let MessageMedia = null;
let whatsappModuleLoaded = false;

function loadWhatsAppModule() {
  if (whatsappModuleLoaded) return;

  console.log('[SafeWorker] Loading whatsapp-web.js module...');
  try {
    const whatsappModule = require('whatsapp-web.js');
    Client = whatsappModule.Client;
    LocalAuth = whatsappModule.LocalAuth;
    MessageMedia = whatsappModule.MessageMedia;
    whatsappModuleLoaded = true;
    console.log('[SafeWorker] whatsapp-web.js module loaded successfully');
  } catch (error) {
    console.error('[SafeWorker] Failed to load whatsapp-web.js module:', error);
    throw error;
  }
}

// Worker state
let rawClient = null;
let isClientReady = false;
let isPaused = false;
let shouldStop = false;
let currentCampaign = null;
let userDataPath = process.env.USER_DATA_PATH || '';
let supabase = null;
let checkpointInterval = 10;
let lastCheckpointIndex = -1;

// ✅ Track campaign progress for reconnection
let lastProcessedIndex = -1;
let sentCount = 0;
let failedCount = 0;

function sendMessage(response) {
  if (process.send) {
    process.send(response);
  }
}

// Utility function for delays - defined early for use throughout
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getChromiumPath() {
  const platform = process.platform;
  const isDev = process.env.NODE_ENV === 'development';
  const attemptedPaths = [];

  console.log('[SafeWorker] ==================== Chromium Path Resolution ====================');
  console.log('[SafeWorker] Platform:', platform);
  console.log('[SafeWorker] Environment:', isDev ? 'development' : 'production');
  console.log('[SafeWorker] process.cwd():', process.cwd());
  console.log('[SafeWorker] process.resourcesPath:', process.resourcesPath || 'undefined');
  console.log('[SafeWorker] __dirname:', __dirname);

  // ✅ FIRST PRIORITY: Check custom configured path from Settings
  console.log('[SafeWorker] ==================== Checking Custom Configured Path ====================');
  try {
    const userDataPath = process.env.USER_DATA_PATH || '';
    if (userDataPath) {
      const configPath = path.join(userDataPath, 'chromium-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.customPath) {
          console.log('[SafeWorker] 📌 CUSTOM PATH CONFIGURED:', config.customPath);

          if (fs.existsSync(config.customPath)) {
            console.log('[SafeWorker] ✅ Custom Chromium path VALID and EXISTS');
            console.log('[SafeWorker] ==================== Using Custom Configured Chromium ====================');
            return config.customPath;
          } else {
            // ❌ STRICT MODE: If custom path is set but doesn't exist, FAIL LOUDLY
            const errorMsg = `CUSTOM CHROMIUM PATH CONFIGURED BUT NOT FOUND!\nConfigured path: ${config.customPath}\n\n` +
              `Please either:\n` +
              `1. Install Chromium to the configured path, OR\n` +
              `2. Go to Settings → Chromium and update the path\n\n` +
              `The app will NOT use system Chrome as a fallback when a custom path is configured.`;

            console.error('[SafeWorker] ❌❌❌ CRITICAL ERROR ❌❌❌');
            console.error(errorMsg);
            throw new Error(errorMsg);
          }
        }
      }
    }
  } catch (error) {
    if (error.message.includes('CUSTOM CHROMIUM PATH')) {
      throw error; // Re-throw our custom error
    }
    console.warn('[SafeWorker] Failed to read custom Chromium config:', error.message);
  }

  // ✅ SECOND: Check dedicated Chromium installation folder
  console.log('[SafeWorker] ==================== Checking Dedicated Chromium Folder ====================');
  const dedicatedPath = 'C:\\Sambad\\chromium';

  if (platform === 'win32') {
    const dedicatedChrome = path.join(dedicatedPath, 'chrome-win', 'chrome.exe');
    console.log('[SafeWorker] Checking dedicated folder:', dedicatedChrome);
    attemptedPaths.push(dedicatedChrome);

    if (fs.existsSync(dedicatedChrome)) {
      console.log('[SafeWorker] ✅ Found Chromium in dedicated folder:', dedicatedChrome);
      console.log('[SafeWorker] ==================== Using Dedicated Chromium ====================');
      return dedicatedChrome;
    } else {
      console.log('[SafeWorker] ⚠️ Dedicated Chromium folder not found at:', dedicatedChrome);
      console.log('[SafeWorker] ℹ️ To install: Run "npm run install:chromium"');
    }
  }

  // Try development path second
  if (isDev) {
    console.log('[SafeWorker] Checking development paths...');
    const devPath = path.join(process.cwd(), 'chromium');

    // Check for our custom downloaded chromium via info file
    try {
      const infoPath = path.join(devPath, 'chromium-info.json');
      console.log('[SafeWorker] Checking chromium-info.json:', infoPath);
      attemptedPaths.push(infoPath);

      if (fs.existsSync(infoPath)) {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        console.log('[SafeWorker] chromium-info.json found, executablePath:', info.executablePath);
        attemptedPaths.push(info.executablePath);

        if (info.executablePath && fs.existsSync(info.executablePath)) {
          console.log('[SafeWorker] ✓ Found Chromium via chromium-info.json:', info.executablePath);
          return info.executablePath;
        }
      }
    } catch (e) {
      console.warn('[SafeWorker] Failed to read chromium-info.json:', e.message);
    }

    if (platform === 'darwin') {
      const macPath = path.join(devPath, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
      attemptedPaths.push(macPath);
      console.log('[SafeWorker] Checking macOS dev path:', macPath, '- exists:', fs.existsSync(macPath));
      if (fs.existsSync(macPath)) {
        console.log('[SafeWorker] ✓ Found Chromium at:', macPath);
        return macPath;
      }
    } else if (platform === 'linux') {
      const linuxPath = path.join(devPath, 'chrome-linux', 'chrome');
      attemptedPaths.push(linuxPath);
      console.log('[SafeWorker] Checking Linux dev path:', linuxPath, '- exists:', fs.existsSync(linuxPath));
      if (fs.existsSync(linuxPath)) {
        console.log('[SafeWorker] ✓ Found Chromium at:', linuxPath);
        return linuxPath;
      }
    } else if (platform === 'win32') {
      const winPath = path.join(devPath, 'chrome-win', 'chrome.exe');
      attemptedPaths.push(winPath);
      console.log('[SafeWorker] Checking Windows dev path:', winPath, '- exists:', fs.existsSync(winPath));
      if (fs.existsSync(winPath)) {
        console.log('[SafeWorker] ✓ Found Chromium at:', winPath);
        return winPath;
      }
    }

    // Fallback to puppeteer's local chromium in dev
    const puppeteerPath = path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium');
    attemptedPaths.push(puppeteerPath);
    console.log('[SafeWorker] Checking puppeteer path:', puppeteerPath, '- exists:', fs.existsSync(puppeteerPath));

    if (fs.existsSync(puppeteerPath)) {
      const chromiumExec = findChromiumInDirectory(puppeteerPath);
      if (chromiumExec) {
        console.log('[SafeWorker] ✓ Found Chromium in puppeteer directory:', chromiumExec);
        return chromiumExec;
      }
    }
  }

  // Try production paths - check multiple possible locations
  console.log('[SafeWorker] Checking production paths...');

  const productionPaths = [
    process.resourcesPath,
    path.join(process.resourcesPath || '', 'app.asar.unpacked'),
    path.join(process.cwd(), '..', 'resources'),
    path.dirname(process.execPath), // Where the .exe is located
    process.cwd()
  ].filter(Boolean); // Remove undefined values

  for (const basePath of productionPaths) {
    const chromiumDir = path.join(basePath, 'chromium');
    console.log('[SafeWorker] Checking production base path:', basePath);
    console.log('[SafeWorker]   Chromium directory:', chromiumDir, '- exists:', fs.existsSync(chromiumDir));
    attemptedPaths.push(chromiumDir);

    if (fs.existsSync(chromiumDir)) {
      let chromiumExec = null;

      if (platform === 'darwin') {
        chromiumExec = path.join(chromiumDir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
        attemptedPaths.push(chromiumExec);
        console.log('[SafeWorker]   Checking macOS prod path:', chromiumExec, '- exists:', fs.existsSync(chromiumExec));
        if (fs.existsSync(chromiumExec)) {
          console.log('[SafeWorker] ✓ Found Chromium at:', chromiumExec);
          return chromiumExec;
        }
      } else if (platform === 'linux') {
        chromiumExec = path.join(chromiumDir, 'chrome-linux', 'chrome');
        attemptedPaths.push(chromiumExec);
        console.log('[SafeWorker]   Checking Linux prod path:', chromiumExec, '- exists:', fs.existsSync(chromiumExec));
        if (fs.existsSync(chromiumExec)) {
          console.log('[SafeWorker] ✓ Found Chromium at:', chromiumExec);
          return chromiumExec;
        }
      } else if (platform === 'win32') {
        chromiumExec = path.join(chromiumDir, 'chrome-win', 'chrome.exe');
        attemptedPaths.push(chromiumExec);
        console.log('[SafeWorker]   Checking Windows prod path:', chromiumExec, '- exists:', fs.existsSync(chromiumExec));
        if (fs.existsSync(chromiumExec)) {
          console.log('[SafeWorker] ✓ Found Chromium at:', chromiumExec);
          return chromiumExec;
        }
      }
    }
  }

  // Fallback to system Chrome (not recommended)
  console.log('[SafeWorker] Bundled Chromium not found in any paths');
  console.log('[SafeWorker] ⚠️ WARNING: Falling back to system Chrome (will close user browser!)');
  console.log('[SafeWorker] ℹ️ Configure custom Chromium path in Settings → Chromium to avoid this');

  try {
    const systemChrome = findSystemChrome();
    console.log('[SafeWorker] ✓ Found system Chrome:', systemChrome);
    return systemChrome;
  } catch (error) {
    console.error('[SafeWorker] ❌ Failed to find system Chrome:', error.message);

    // Throw detailed error with all attempted paths
    const errorMessage = `
Chromium browser not found. The WhatsApp functionality requires Chromium to be installed.

Platform: ${platform}
Environment: ${isDev ? 'development' : 'production'}

Attempted paths:
${attemptedPaths.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

Troubleshooting:
1. If you built this app yourself, run: npm run download:chromium
2. If you installed from a release, try reinstalling the application
3. Ensure Chromium was bundled in the build (check electron-builder config)
4. Install Google Chrome or Chromium browser as a fallback

Technical details:
- process.cwd(): ${process.cwd()}
- process.resourcesPath: ${process.resourcesPath || 'undefined'}
- __dirname: ${__dirname}
`;

    throw new Error(errorMessage);
  }
}

function findChromiumInDirectory(basePath) {
  const platform = process.platform;
  const searchPaths = [
    basePath,
    path.join(basePath, 'chrome-win'),
    path.join(basePath, 'chrome-linux'),
    path.join(basePath, 'chrome-mac'),
  ];

  const executableNames = platform === 'win32' ? ['chrome.exe'] : ['chrome', 'chromium', 'Chromium'];

  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;

    for (const execName of executableNames) {
      const fullPath = path.join(searchPath, execName);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

function findSystemChrome() {
  const platform = process.platform;

  if (platform === 'win32') {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log('[SafeWorker] Found system Chrome:', chromePath);
        return chromePath;
      }
    }
  } else if (platform === 'darwin') {
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      path.join(process.env.HOME || '', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log('[SafeWorker] Found system Chrome:', chromePath);
        return chromePath;
      }
    }
  } else {
    const possiblePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/local/bin/chrome',
      '/usr/local/bin/chromium',
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log('[SafeWorker] Found system Chrome:', chromePath);
        return chromePath;
      }
    }
  }

  throw new Error(
    'Chrome/Chromium not found. Please install Google Chrome or Chromium browser.'
  );
}

async function initializeWhatsAppClient() {
  try {
    loadWhatsAppModule();

    const authPath = path.join(userDataPath, '.wwebjs_auth');
    console.log('[SafeWorker] Using auth path:', authPath);

    try {
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
        console.log('[SafeWorker] Created auth directory:', authPath);
      }
    } catch (error) {
      console.error('[SafeWorker] Failed to create auth directory:', error);
      throw new Error(`Failed to create WhatsApp auth directory: ${error.message}`);
    }

    console.log('[SafeWorker] Resolving Chromium path...');
    const chromiumPath = getChromiumPath();
    console.log('[SafeWorker] ✓ Using Chromium binary:', chromiumPath);

    rawClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: authPath,
      }),
      puppeteer: {
        executablePath: chromiumPath,
        headless: 'shell',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-hang-monitor',
          '--disable-client-side-phishing-detection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--disable-translate',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-default-apps',
          '--disable-background-networking',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-features=TranslateUI',
          '--disable-print-preview',
          '--mute-audio',
          '--disable-notifications',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        ],
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
      authTimeoutMs: 0,
    });

    rawClient.on('qr', async (qr) => {
      console.log('[SafeWorker] QR Code received');
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 2,
        });
        console.log('[SafeWorker] QR Code converted to data URL');
        sendMessage({
          type: 'QR_CODE',
          data: { qrCode: qrDataUrl },
        });
      } catch (error) {
        console.error('[SafeWorker] Failed to generate QR code:', error);
        sendMessage({
          type: 'ERROR',
          data: { error: 'Failed to generate QR code' },
        });
      }
    });

    rawClient.on('ready', () => {
      console.log('[SafeWorker] WhatsApp client is ready');
      isClientReady = true;
      sendMessage({
        type: 'READY',
        data: {},
      });
    });

    rawClient.on('authenticated', () => {
      console.log('[SafeWorker] ✅ Client authenticated successfully');
      sendMessage({
        type: 'AUTHENTICATED',
        data: {},
      });
    });

    rawClient.on('auth_failure', (msg) => {
      console.error('[SafeWorker] Authentication failure:', msg);
      sendMessage({
        type: 'ERROR',
        data: { error: `Authentication failed: ${msg}` },
      });
    });

    rawClient.on('disconnected', async (reason) => {
      console.log('[SafeWorker] ⚠️ Client disconnected:', reason);
      isClientReady = false;

      // ✅ Auto-pause campaign if running
      const wasCampaignRunning = currentCampaign && !isPaused && !shouldStop;
      if (wasCampaignRunning) {
        console.log('[SafeWorker] Auto-pausing campaign due to disconnect');
        isPaused = true;

        // Save checkpoint immediately
        if (currentCampaign) {
          await saveCheckpoint(
            currentCampaign.campaignId,
            lastProcessedIndex,
            sentCount,
            failedCount
          );
          console.log('[SafeWorker] Checkpoint saved before reconnection');
        }

        sendMessage({
          type: 'PAUSED',
          data: { campaignId: currentCampaign.campaignId, reason: 'disconnected' },
        });
      }

      sendMessage({
        type: 'RECONNECTING',
        data: { reason },
      });

      // ✅ Attempt reconnection with retries
      const maxRetries = 5;
      let reconnected = false;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const delay = Math.min(3000 * attempt, 15000); // 3s, 6s, 9s, 12s, 15s
          console.log(`[SafeWorker] Waiting ${delay / 1000}s before reconnection attempt ${attempt}/${maxRetries}...`);
          await sleep(delay);

          console.log(`[SafeWorker] Reconnection attempt ${attempt}/${maxRetries}...`);
          await initializeWhatsAppClient();

          console.log('[SafeWorker] ✅ Reconnection successful!');
          reconnected = true;
          break;

        } catch (error) {
          console.error(`[SafeWorker] Reconnection attempt ${attempt}/${maxRetries} failed:`, error);

          if (attempt === maxRetries) {
            console.error('[SafeWorker] ❌ All reconnection attempts failed');
            sendMessage({
              type: 'ERROR',
              data: {
                error: `Failed to reconnect after ${maxRetries} attempts. Please check your internet connection and restart the app.`,
                isFatal: true
              },
            });
          }
        }
      }

      // ✅ Auto-resume campaign if reconnection successful
      if (reconnected && wasCampaignRunning && currentCampaign) {
        console.log('[SafeWorker] Waiting 2 seconds for WhatsApp to stabilize...');
        await sleep(2000);

        console.log('[SafeWorker] ✅ Auto-resuming campaign after successful reconnect');
        isPaused = false;

        sendMessage({
          type: 'RESUMED',
          data: {
            campaignId: currentCampaign.campaignId,
            message: 'Campaign resumed after reconnection'
          },
        });
      }
    });

    console.log('[SafeWorker] Initializing WhatsApp client...');

    // ✅ Fixed: Add 2-minute timeout to prevent infinite hanging
    const MAX_INIT_TIME = 120000; // 2 minutes
    await Promise.race([
      rawClient.initialize(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('WhatsApp initialization timeout (2 minutes)')), MAX_INIT_TIME)
      )
    ]);

    console.log('[SafeWorker] ✓ WhatsApp client initialized successfully');

  } catch (error) {
    console.error('[SafeWorker] ❌ Failed to initialize WhatsApp client:', error);

    // Check if this is a Chromium-related error
    const errorMessage = error.message || String(error);
    const isChromiumError = errorMessage.toLowerCase().includes('chromium') ||
      errorMessage.toLowerCase().includes('chrome') ||
      errorMessage.includes('Chromium browser not found');

    // Send specific error type for Chromium issues
    sendMessage({
      type: isChromiumError ? 'CHROMIUM_ERROR' : 'ERROR',
      data: {
        error: errorMessage,
        isChromiumError: isChromiumError,
        details: {
          platform: process.platform,
          nodeEnv: process.env.NODE_ENV,
          cwd: process.cwd(),
          resourcesPath: process.resourcesPath
        }
      },
    });

    // Exit the worker process with error code
    console.error('[SafeWorker] Exiting worker process due to initialization failure');
    process.exit(1);
  }
}

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return cleaned;
}

function resolveTemplateVariables(template, taskOrVars) {
  if (!template) return '';
  let resolved = template;
  let variables = {};
  let recipientName;

  if (taskOrVars) {
    if (taskOrVars.recipientNumber !== undefined) {
      // It's a MessageTask
      const task = taskOrVars;
      if (task.variables) {
        variables = { ...task.variables };
      }
      recipientName = task.recipientName;
    } else {
      // It's raw variables map
      variables = { ...taskOrVars };
    }
  }

  // Inject recipient name if available in variables for consistent handling
  if (recipientName && !variables['name']) {
    variables['name'] = recipientName;
  }

  // Resolve {{name}} (case-insensitive)
  const nameRegex = /{{\s*name\s*}}/gi;
  if (recipientName) {
    resolved = resolved.replace(nameRegex, recipientName);
  } else {
    // Only replace with Customer if placeholder exists and no name provided
    if (nameRegex.test(resolved)) {
      resolved = resolved.replace(nameRegex, 'Customer');
    }
  }

  // Resolve other dynamic variables
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      resolved = resolved.replace(regex, String(value));
    }
  }

  console.log('[SafeWorker] Resolved message:', {
    template: template.substring(0, 50) + '...',
    recipientName,
    resolved: resolved.substring(0, 50) + '...'
  });

  return resolved;
}

async function sendWhatsAppMessage(task, campaignId, isRetry = false) {
  if (!rawClient || !isClientReady) {
    throw new Error('WhatsApp client is not ready');
  }

  const { id: messageId, recipientNumber, recipientName, templateText, variables, mediaAttachments, templateImage } = task;

  try {
    const normalizedNumber = formatPhoneNumber(recipientNumber);

    if (!normalizedNumber || normalizedNumber.length < 10) {
      throw new Error(`Invalid phone number format: ${recipientNumber}`);
    }

    console.log(`[SafeWorker] Original: ${recipientNumber} → Normalized: ${normalizedNumber}`);
    console.log(`[SafeWorker] Sending message to ${recipientNumber} (${recipientName || 'No Name'})`);

    const numberDetails = await rawClient.getNumberId(normalizedNumber);

    if (!numberDetails) {
      throw new Error(`Phone number ${recipientNumber} is not registered on WhatsApp`);
    }

    const chatId = numberDetails._serialized;
    const messageText = resolveTemplateVariables(templateText, task);

    // Handle template image with caption
    if (templateImage) {
      console.log(`[SafeWorker] Sending template image with caption`);

      try {
        let media;

        if (templateImage.url.startsWith('http://') || templateImage.url.startsWith('https://')) {
          console.log(`[SafeWorker] Downloading template image from URL: ${templateImage.url}`);
          media = await MessageMedia.fromUrl(templateImage.url);
        } else {
          console.log(`[SafeWorker] Loading template image from file: "${templateImage.url}"`);

          if (!fs.existsSync(templateImage.url)) {
            console.error(`[SafeWorker] ❌ FILE NOT FOUND: "${templateImage.url}"`);
            throw new Error(`Template image file not found: ${templateImage.url}`);
          }

          const base64Data = fs.readFileSync(templateImage.url, { encoding: 'base64' });
          console.log(`[SafeWorker] Read template image: ${base64Data.length} bytes`);

          const ext = path.extname(templateImage.url).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
          };
          const mimetype = mimeTypes[ext] || 'image/jpeg';

          media = new MessageMedia(mimetype, base64Data, path.basename(templateImage.url));
        }

        await safeSendMessageWithRetry(chatId, media, {
          caption: messageText,
        });

        console.log(`[SafeWorker] Template image sent successfully`);
      } catch (templateImageError) {
        console.error(`[SafeWorker] Failed to send template image:`, templateImageError);
        throw templateImageError;
      }

      // Send additional media attachments
      if (mediaAttachments && mediaAttachments.length > 0) {
        console.log(`[SafeWorker] Sending ${mediaAttachments.length} additional media attachments`);
        await sleep(2000);

        for (let i = 0; i < mediaAttachments.length; i++) {
          const attachment = mediaAttachments[i];
          try {
            let media;
            if (attachment.url.startsWith('http://') || attachment.url.startsWith('https://')) {
              media = await MessageMedia.fromUrl(attachment.url);
            } else {
              if (!fs.existsSync(attachment.url)) {
                throw new Error(`Media file not found: ${attachment.url}`);
              }

              const base64Data = fs.readFileSync(attachment.url, { encoding: 'base64' });
              const ext = path.extname(attachment.url).toLowerCase();
              const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf',
                '.mp4': 'video/mp4',
                '.3gp': 'video/3gpp',
                '.webm': 'video/webm',
                '.mp3': 'audio/mpeg',
              };
              const mimetype = mimeTypes[ext] || 'application/octet-stream';
              media = new MessageMedia(mimetype, base64Data, path.basename(attachment.url));
            }

            const caption = attachment.caption ? resolveTemplateVariables(attachment.caption, task) : undefined;
            await safeSendMessageWithRetry(chatId, media, { caption });
            console.log(`[SafeWorker] Additional media ${i + 1} sent`);

            if (i < mediaAttachments.length - 1) {
              // Use longer delay for video attachments (16 seconds)
              const ext = path.extname(attachment.url).toLowerCase();
              const isVideo = attachment.type === 'video' || ['.mp4', '.3gp', '.webm', '.avi', '.mov'].includes(ext);
              const delayMs = isVideo ? 16000 : 2000;
              console.log(`[SafeWorker] Waiting ${delayMs}ms before next media (isVideo: ${isVideo})...`);
              await sleep(delayMs);
            }
          } catch (mediaError) {
            console.error(`[SafeWorker] Failed to send additional media ${i + 1}:`, mediaError);
          }
        }
      }
    } else if (mediaAttachments && mediaAttachments.length > 0) {
      // Handle media attachments without template image
      const attachmentsToSend = mediaAttachments.slice(0, 10);

      for (let i = 0; i < attachmentsToSend.length; i++) {
        const attachment = attachmentsToSend[i];

        try {
          console.log(`[SafeWorker] Processing media ${i + 1}/${attachmentsToSend.length}`);

          let media;

          if (attachment.url.startsWith('http://') || attachment.url.startsWith('https://')) {
            console.log(`[SafeWorker] Downloading media from URL: ${attachment.url}`);
            media = await MessageMedia.fromUrl(attachment.url);
          } else {
            console.log(`[SafeWorker] Loading media from file: ${attachment.url}`);

            if (!fs.existsSync(attachment.url)) {
              throw new Error(`Media file not found: ${attachment.url}`);
            }

            const base64Data = fs.readFileSync(attachment.url, { encoding: 'base64' });
            const ext = path.extname(attachment.url).toLowerCase();
            const mimeTypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
              '.pdf': 'application/pdf',
              '.mp4': 'video/mp4',
              '.3gp': 'video/3gpp',
              '.webm': 'video/webm',
              '.mp3': 'audio/mpeg',
            };
            const mimetype = mimeTypes[ext] || 'application/octet-stream';

            media = new MessageMedia(mimetype, base64Data, path.basename(attachment.url));
          }

          const caption = attachment.caption
            ? resolveTemplateVariables(attachment.caption, task)
            : (i === 0 ? messageText : undefined);

          await safeSendMessageWithRetry(chatId, media, {
            caption: caption,
          });

          console.log(`[SafeWorker] Media ${i + 1} sent successfully`);

          if (i < attachmentsToSend.length - 1) {
            // Use longer delay for video attachments (16 seconds)
            const ext = path.extname(attachment.url).toLowerCase();
            const isVideo = attachment.type === 'video' || ['.mp4', '.3gp', '.webm', '.avi', '.mov'].includes(ext);
            const delayMs = isVideo ? 16000 : 2000;
            console.log(`[SafeWorker] Waiting ${delayMs}ms before next media (isVideo: ${isVideo})...`);
            await sleep(delayMs);
          }
        } catch (mediaError) {
          console.error(`[SafeWorker] Failed to send media ${i + 1}:`, mediaError);
          throw mediaError;
        }
      }

      if (!attachmentsToSend[0]?.caption && messageText) {
        console.log(`[SafeWorker] Sending text message separately`);
        await safeSendMessageWithRetry(chatId, messageText);
      }
    } else {
      console.log(`[SafeWorker] Sending text-only message`);
      await safeSendMessageWithRetry(chatId, messageText);
    }

    const result = {
      messageId,
      recipientNumber,
      status: 'sent',
      sentAt: new Date(),
    };

    await updateMessageStatus(messageId, campaignId, 'sent', null, isRetry);

    sendMessage({ type: 'MESSAGE_SENT', data: { messageId } });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SafeWorker] Failed to send message ${messageId}:`, errorMessage);

    await updateMessageStatus(messageId, campaignId, 'failed', errorMessage, isRetry);

    return {
      messageId,
      recipientNumber,
      status: 'failed',
      error: errorMessage,
    };
  }
}

async function updateMessageStatus(messageId, campaignId, status, error, isRetry = false) {
  // ✅ Fixed: Check if Supabase is initialized
  if (!supabase) {
    console.warn('[SafeWorker] Supabase not initialized, skipping message status update');
    return;
  }

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (error) {
      updateData.error_message = error;
    }

    if (isRetry) {
      const { data: currentMessage } = await supabase
        .from('campaign_messages')
        .select('retry_count')
        .eq('id', messageId)
        .single();

      if (currentMessage) {
        updateData.retry_count = (currentMessage.retry_count || 0) + 1;
        updateData.last_retry_at = new Date().toISOString();
      }
    }

    await supabase
      .from('campaign_messages')
      .update(updateData)
      .eq('id', messageId);

    if (isRetry) {
      await supabase
        .from('message_retry_log')
        .insert({
          message_id: messageId,
          campaign_id: parseInt(campaignId),
          retry_attempt: updateData.retry_count || 1,
          error_message: error,
          retry_at: new Date().toISOString(),
          status: status,
        });
    }

    const { data: stats } = await supabase
      .from('campaign_messages')
      .select('status')
      .eq('campaign_id', campaignId);

    if (stats) {
      const sentCount = stats.filter((m) => m.status === 'sent').length;
      const failedCount = stats.filter((m) => m.status === 'failed').length;

      await supabase
        .from('campaigns')
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }
  } catch (error) {
    console.error('[SafeWorker] Failed to update message status:', error);
  }
}

async function saveCheckpoint(campaignId, lastProcessedIndex, sentCount, failedCount) {
  if (!supabase) return;

  try {
    await supabase
      .from('campaign_checkpoints')
      .insert({
        campaign_id: parseInt(campaignId),
        last_processed_index: lastProcessedIndex,
        sent_count: sentCount,
        failed_count: failedCount,
        state_data: {
          timestamp: new Date().toISOString(),
          paused: isPaused,
        },
      });

    await supabase
      .from('campaigns')
      .update({
        last_checkpoint_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    console.log(`[SafeWorker] Checkpoint saved: processed ${lastProcessedIndex + 1} messages`);
  } catch (error) {
    console.error('[SafeWorker] Failed to save checkpoint:', error);
  }
}

async function loadLastCheckpoint(campaignId) {
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('campaign_checkpoints')
      .select('*')
      .eq('campaign_id', parseInt(campaignId))
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      console.log(`[SafeWorker] Checkpoint loaded: resuming from index ${data.last_processed_index}`);
      return {
        lastProcessedIndex: data.last_processed_index,
        sentCount: data.sent_count,
        failedCount: data.failed_count,
      };
    }
  } catch (error) {
    console.log('[SafeWorker] No checkpoint found, starting from beginning');
  }

  return null;
}

function pickDelay(preset, customRange) {
  const ranges = {
    'instant': { min: 0, max: 0 },
    'quick': { min: 1000, max: 3000 },
    'moderate': { min: 3000, max: 7000 },
    'safe': { min: 7000, max: 15000 },
    'very-safe': { min: 15000, max: 30000 },
    'ultra-safe': { min: 30000, max: 60000 },
    'custom': customRange || { min: 5000, max: 10000 },
  };

  const range = ranges[preset] || ranges['moderate'];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

async function shouldRetryMessage(messageId, campaignId) {
  if (!supabase) return false;

  try {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('max_retries')
      .eq('id', campaignId)
      .single();

    if (!campaign) return false;

    const maxRetries = campaign.max_retries || 3;

    const { data: message } = await supabase
      .from('campaign_messages')
      .select('retry_count')
      .eq('id', messageId)
      .single();

    if (!message) return false;

    const currentRetries = message.retry_count || 0;
    return currentRetries < maxRetries;
  } catch (error) {
    console.error('[SafeWorker] Failed to check retry eligibility:', error);
    return false;
  }
}

async function retryFailedMessage(message, campaignId, attempt) {
  const backoffDelay = Math.min(Math.pow(2, attempt) * 1000, 30000);
  console.log(`[SafeWorker] Retrying message ${message.id} (attempt ${attempt}) after ${backoffDelay}ms delay`);

  await sleep(backoffDelay);

  return await sendWhatsAppMessage(message, campaignId, true);
}

// Wrapper function to retry sendMessage on transient failures (Evaluation failed, Protocol error)
async function safeSendMessageWithRetry(chatId, content, options = {}, maxRetries = 5) {
  if (!rawClient) {
    throw new Error('WhatsApp client is not initialized');
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await rawClient.sendMessage(chatId, content, options);
      return result;
    } catch (error) {
      lastError = error;
      const errorMessage = error?.message || String(error);

      // Check if this is an Evaluation failed error (Puppeteer issue)
      if (errorMessage.includes('Evaluation failed') || errorMessage.includes('Protocol error') || errorMessage.includes('Execution context')) {
        console.warn(`[SafeWorker] Send attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);

        if (attempt < maxRetries) {
          // Exponential backoff starting at 3s: 3s, 6s, 12s, 24s, 48s
          const backoffMs = Math.pow(2, attempt) * 1500;
          console.log(`[SafeWorker] Browser context unstable, retrying in ${backoffMs}ms...`);
          await sleep(backoffMs);
          continue;
        }
      } else {
        // Non-retryable error, throw immediately
        throw error;
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('Failed to send message after retries');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processCampaign(payload) {
  const { campaignId, messages, delaySettings } = payload;

  // ✅ Fixed: Validate campaign data
  if (!campaignId) {
    sendMessage({ type: 'ERROR', data: { error: 'Invalid campaign: missing campaign ID' } });
    return;
  }

  if (!delaySettings || !delaySettings.preset) {
    sendMessage({ type: 'ERROR', data: { error: 'Invalid campaign: missing delay settings' } });
    return;
  }

  currentCampaign = payload;

  console.log(`[SafeWorker] Starting campaign ${campaignId} with ${messages.length} messages`);

  if (!messages || messages.length === 0) {
    sendMessage({ type: 'ERROR', data: { error: 'Invalid campaign: no messages to process' } });
    return;
  }

  // ✅ Initialize progress tracking
  sentCount = 0;
  failedCount = 0;
  let startIndex = 0;

  try {
    const checkpoint = await loadLastCheckpoint(campaignId);
    if (checkpoint && checkpoint.lastProcessedIndex >= 0) {
      startIndex = checkpoint.lastProcessedIndex + 1;
      sentCount = checkpoint.sentCount;
      failedCount = checkpoint.failedCount;
      console.log(`[SafeWorker] Resuming campaign from message ${startIndex + 1}`);
    } else {
      await supabase
        .from('campaigns')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }

    for (let i = startIndex; i < messages.length; i++) {
      if (shouldStop) {
        console.log('[SafeWorker] Campaign stopped by user');
        break;
      }

      while (isPaused) {
        await sleep(1000);
        if (shouldStop) break;
      }

      if (shouldStop) break;

      const message = messages[i];

      console.log(`[SafeWorker] Processing message ${i + 1}/${messages.length} to ${message.recipientNumber}`);

      // ✅ Update current index for checkpoint
      lastProcessedIndex = i;

      let result = await sendWhatsAppMessage(message, campaignId, false);

      if (result.status === 'sent') {
        sentCount++;
      } else {
        failedCount++;
      }

      if (result.status === 'failed') {
        const canRetry = await shouldRetryMessage(message.id, campaignId);

        if (canRetry) {
          console.log(`[SafeWorker] Message failed, checking if retry is allowed...`);

          const { data: messageData } = await supabase
            .from('campaign_messages')
            .select('retry_count')
            .eq('id', message.id)
            .single();

          const retryAttempt = (messageData?.retry_count || 0) + 1;
          console.log(`[SafeWorker] Retrying message (attempt ${retryAttempt})...`);

          result = await retryFailedMessage(message, campaignId, retryAttempt);

          if (result.status === 'sent') {
            console.log(`[SafeWorker] Retry successful for message ${message.id}`);
          } else {
            console.log(`[SafeWorker] Retry failed for message ${message.id}: ${result.error}`);
          }
        }
      }

      if (result.status === 'sent') {
        sentCount++;
      } else {
        failedCount++;
      }

      const progress = Math.round(((i + 1) / messages.length) * 100);

      sendMessage({
        type: 'PROGRESS',
        data: {
          campaignId,
          messageId: result.messageId,
          recipientNumber: result.recipientNumber,
          recipientName: message.recipientName,
          status: result.status,
          error: result.error,
          totalMessages: messages.length,
          sentCount,
          failedCount,
          progress,
        },
      });

      if ((i + 1) % checkpointInterval === 0 || i === messages.length - 1) {
        await saveCheckpoint(campaignId, i, sentCount, failedCount);
        lastCheckpointIndex = i;
      }

      if (i < messages.length - 1) {
        const customRange = (delaySettings.minDelay !== undefined && delaySettings.maxDelay !== undefined)
          ? { min: delaySettings.minDelay, max: delaySettings.maxDelay }
          : undefined;
        const delayMs = pickDelay(delaySettings.preset, customRange);
        console.log(`[SafeWorker] Waiting ${delayMs}ms before next message...`);
        await sleep(delayMs);
      }
    }

    const finalStatus = shouldStop ? 'stopped' : 'completed';

    await supabase
      .from('campaigns')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    sendMessage({
      type: 'COMPLETE',
      data: {
        campaignId,
        status: finalStatus,
        totalMessages: messages.length,
        sentCount,
        failedCount,
      },
    });

    console.log(`[SafeWorker] Campaign ${finalStatus}: ${sentCount} sent, ${failedCount} failed`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SafeWorker] Campaign error:', errorMessage);

    if (lastCheckpointIndex >= 0) {
      await saveCheckpoint(campaignId, lastCheckpointIndex, sentCount, failedCount);
    }

    await supabase
      .from('campaigns')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', campaignId);

    sendMessage({
      type: 'ERROR',
      data: {
        campaignId,
        error: errorMessage,
        sentCount,
        failedCount,
      },
    });
  } finally {
    currentCampaign = null;
    shouldStop = false;
    isPaused = false;
    lastCheckpointIndex = -1;
  }
}

// Message handler
process.on('message', async (message) => {
  const { type, payload } = message;

  switch (type) {
    case 'INITIALIZE':
      if (payload && 'userDataPath' in payload) {
        userDataPath = payload.userDataPath || process.env.USER_DATA_PATH || '';
        console.log('[SafeWorker] User data path set to:', userDataPath);

        const url = payload.accountId || process.env.ACCOUNT_ID || '';
        const key = payload.licenseKey || process.env.LICENSE_KEY || '';

        if (url && key) {
          try {
            supabase = createClient(url, key);
            console.log('[SafeWorker] Supabase client initialized successfully');
          } catch (error) {
            console.error('[SafeWorker] Failed to initialize Supabase client:', error);
          }
        }

        await initializeWhatsAppClient();
      }
      break;

    case 'START_CAMPAIGN':
      if (payload && 'campaignId' in payload) {
        if (!rawClient) {
          await initializeWhatsAppClient();
          await new Promise((resolve) => {
            const checkReady = setInterval(() => {
              if (isClientReady) {
                clearInterval(checkReady);
                resolve();
              }
            }, 500);
          });
        }

        if (!isClientReady) {
          sendMessage({
            type: 'ERROR',
            data: { error: 'WhatsApp client is not ready' },
          });
          break; // ✅ Fixed: Stop campaign execution
        }

        shouldStop = false;
        isPaused = false;
        await processCampaign(payload);
      }
      break;

    case 'PAUSE_CAMPAIGN':
      isPaused = true;
      sendMessage({
        type: 'PAUSED',
        data: { campaignId: currentCampaign?.campaignId },
      });
      if (currentCampaign) {
        await supabase
          .from('campaigns')
          .update({ status: 'paused' })
          .eq('id', currentCampaign.campaignId);
      }
      console.log('[SafeWorker] Campaign paused');
      break;

    case 'RESUME_CAMPAIGN':
      isPaused = false;
      sendMessage({
        type: 'RESUMED',
        data: { campaignId: currentCampaign?.campaignId },
      });
      if (currentCampaign) {
        await supabase
          .from('campaigns')
          .update({ status: 'running' })
          .eq('id', currentCampaign.campaignId);
      }
      console.log('[SafeWorker] Campaign resumed');
      break;

    case 'STOP_CAMPAIGN':
      shouldStop = true;
      isPaused = false;
      console.log('[SafeWorker] Stop requested');
      break;

    case 'DISCONNECT':
      console.log('[SafeWorker] Disconnecting WhatsApp');
      try {
        if (rawClient) {
          await rawClient.destroy();
          console.log('[SafeWorker] WhatsApp client destroyed');
        }
        rawClient = null;
        isClientReady = false;
        console.log('[SafeWorker] WhatsApp disconnected successfully');
      } catch (error) {
        console.error('[SafeWorker] Error during disconnect:', error);
      }
      break;

    case 'LOGOUT':
      console.log('[SafeWorker] Logging out of WhatsApp');
      try {
        if (rawClient && isClientReady) {
          await rawClient.logout();
          console.log('[SafeWorker] WhatsApp client logged out');
        }
        if (rawClient) {
          await rawClient.destroy();
          console.log('[SafeWorker] WhatsApp client destroyed');
        }

        const authPath = path.join(userDataPath, '.wwebjs_auth');
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true });
          console.log('[SafeWorker] Session files cleared');
        }

        rawClient = null;
        isClientReady = false;
        console.log('[SafeWorker] WhatsApp logged out successfully');
      } catch (error) {
        console.error('[SafeWorker] Error during logout:', error);
      }
      break;

    case 'HEALTH_CHECK':
      sendMessage({
        type: 'HEALTH_RESPONSE',
        data: { status: isClientReady ? 'ready' : 'initializing' },
      });
      break;

    case 'SOFT_RESTART':
      console.log('[SafeWorker] Soft restart requested - performing cleanup');
      try {
        if (rawClient) {
          await rawClient.destroy();
        }
        rawClient = null;
        isClientReady = false;

        if (global.gc) {
          global.gc();
          console.log('[SafeWorker] Garbage collection triggered');
        }
      } catch (error) {
        console.error('[SafeWorker] Error during soft restart:', error);
      }
      break;

    case 'SHUTDOWN':
      console.log('[SafeWorker] Shutdown requested');
      try {
        if (rawClient) {
          await rawClient.destroy();
        }
        process.exit(0);
      } catch (error) {
        console.error('[SafeWorker] Error during shutdown:', error);
        process.exit(1);
      }
      break;

    default:
      console.warn('[SafeWorker] Unknown message type:', type);
  }
});

console.log('[SafeWorker] WhatsApp worker process started (CommonJS wrapper)');
