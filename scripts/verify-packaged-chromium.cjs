#!/usr/bin/env node

/**
 * Post-build verification script
 * Verifies that Chromium is properly bundled in the packaged application
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Verifying Packaged Application');
console.log('='.repeat(60));

const CHROMIUM_REVISION = '1345237';

const PLATFORM_CONFIGS = {
  win64: {
    releaseDir: path.join(__dirname, '..', 'release', 'win-unpacked'),
    chromeFolder: 'chrome-win64',
    executable: 'chrome.exe',
    appExe: 'Sambad.exe'
  },
  mac: {
    releaseDir: path.join(__dirname, '..', 'release', 'mac', 'Sambad.app'),
    chromeFolder: 'chrome-mac-x64',
    executable: 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    appExe: 'Contents/MacOS/Sambad'
  },
  linux: {
    releaseDir: path.join(__dirname, '..', 'release', 'linux-unpacked'),
    chromeFolder: 'chrome-linux64',
    executable: 'chrome',
    appExe: 'sambad'
  }
};

// Detect target platform
let targetPlatform = process.argv[2] || null;

if (!targetPlatform) {
  const platformMap = {
    'win32': 'win64',
    'darwin': 'mac',
    'linux': 'linux'
  };
  targetPlatform = platformMap[process.platform];
}

const config = PLATFORM_CONFIGS[targetPlatform];

if (!config) {
  console.error(`❌ ERROR: Unsupported platform: ${targetPlatform}`);
  process.exit(1);
}

console.log(`🎯 Verifying platform: ${targetPlatform}`);

const releaseDir = config.releaseDir;
const resourcesDir = path.join(releaseDir, 'resources');
const chromeDir = path.join(resourcesDir, 'chrome');

console.log('📁 Checking release directory:', releaseDir);

if (!fs.existsSync(releaseDir)) {
  console.error('❌ ERROR: Release directory not found');
  console.error('   Expected:', releaseDir);
  console.error('\n💡 Please run: npm run dist:win');
  process.exit(1);
}

console.log('✅ Release directory found');

console.log('\n📁 Checking resources directory:', resourcesDir);

if (!fs.existsSync(resourcesDir)) {
  console.error('❌ ERROR: Resources directory not found');
  process.exit(1);
}

console.log('✅ Resources directory found');

console.log('\n📁 Checking chrome directory:', chromeDir);

if (!fs.existsSync(chromeDir)) {
  console.error('❌ ERROR: Chrome directory not found in packaged app');
  console.error('   Expected:', chromeDir);
  console.error('\n💡 This means Chromium was not bundled.');
  console.error('   Check that you ran: node scripts/copy-chromium.cjs');
  process.exit(1);
}

console.log('✅ Chrome directory found');

// Check for platform-specific chrome executables
const chromeDirs = fs.readdirSync(chromeDir);
console.log('\n📦 Found directories:', chromeDirs);

let chromeExeFound = false;
const expectedVersionDir = `${targetPlatform}-${CHROMIUM_REVISION}`;

if (chromeDirs.includes(expectedVersionDir)) {
  const versionDir = path.join(chromeDir, expectedVersionDir);
  const chromeFolderPath = path.join(versionDir, config.chromeFolder);
  const chromeExePath = path.join(chromeFolderPath, config.executable);

  console.log('\n🔍 Checking for executable at:', chromeExePath);

  if (fs.existsSync(chromeExePath)) {
    const stats = fs.statSync(chromeExePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log('✅ Chrome executable found!');
    console.log(`📊 Executable size: ${sizeMB} MB`);
    chromeExeFound = true;

    const totalSize = getDirSize(chromeFolderPath);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    console.log(`📊 Total browser size: ${totalSizeMB} MB`);
  }
} else {
  console.warn(`⚠️  Expected directory not found: ${expectedVersionDir}`);
  console.log('Available directories:');
  chromeDirs.forEach(dir => console.log('  -', dir));
}

if (!chromeExeFound) {
  console.error('\n❌ ERROR: Chrome executable not found in packaged app');
  console.error('\n📋 Expected structure:');
  console.error('  resources/');
  console.error('    chrome/');
  console.error(`      ${expectedVersionDir}/`);
  console.error(`        ${config.chromeFolder}/`);
  console.error(`          ${config.executable}  <-- Missing`);
  console.error('\n💡 Solution:');
  console.error(`   1. Run: node scripts/copy-chromium.cjs ${targetPlatform}`);
  console.error(`   2. Rebuild: npm run dist:win`);
  process.exit(1);
}

// Check app executable
const appExePath = path.join(releaseDir, config.appExe);
if (fs.existsSync(appExePath)) {
  const stats = fs.statSync(appExePath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Application executable found: ${sizeMB} MB`);
} else {
  console.warn(`⚠️  Warning: ${config.appExe} not found at expected location`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ Verification successful! Application is ready.');
console.log('='.repeat(60));
console.log('\n📦 You can now:');
if (targetPlatform === 'win64') {
  console.log('  1. Test: cd release\\win-unpacked && Sambad.exe');
  console.log('  2. Distribute the entire win-unpacked folder');
  console.log('  3. Or use the installer in release\\ folder');
} else {
  console.log(`  1. Test the application in: ${releaseDir}`);
  console.log('  2. Distribute the packaged application');
}
console.log('='.repeat(60));

process.exit(0);

function getDirSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return size;
}
