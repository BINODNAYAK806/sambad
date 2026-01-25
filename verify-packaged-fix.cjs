#!/usr/bin/env node

/**
 * Verification Script for Packaged App Chromium Fix
 * Run with: node verify-packaged-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Packaged App Chromium Fix...\n');

let allPassed = true;
const checks = [];

// Check 1: electron-builder.json5 has asarUnpack
console.log('✓ Checking electron-builder.json5...');
try {
  const builderConfig = fs.readFileSync('electron-builder.json5', 'utf8');

  if (builderConfig.includes('asarUnpack')) {
    checks.push({ name: 'asarUnpack configuration', status: '✓ PASS', detail: 'Found in electron-builder.json5' });
  } else {
    checks.push({ name: 'asarUnpack configuration', status: '✗ FAIL', detail: 'Missing asarUnpack in electron-builder.json5' });
    allPassed = false;
  }

  if (builderConfig.includes('!node_modules/**/.cache')) {
    checks.push({ name: 'Cache exclusion', status: '✓ PASS', detail: 'Cache files excluded from build' });
  } else {
    checks.push({ name: 'Cache exclusion', status: '⚠ WARN', detail: 'Consider adding cache exclusion' });
  }

  if (builderConfig.includes('whatsapp-web.js')) {
    checks.push({ name: 'WhatsApp unpacking', status: '✓ PASS', detail: 'whatsapp-web.js will be unpacked from asar' });
  } else {
    checks.push({ name: 'WhatsApp unpacking', status: '✗ FAIL', detail: 'whatsapp-web.js not configured for unpacking' });
    allPassed = false;
  }
} catch (error) {
  checks.push({ name: 'electron-builder.json5', status: '✗ FAIL', detail: 'File not found or not readable' });
  allPassed = false;
}

// Check 2: .puppeteerrc.cjs has skipDownload
console.log('✓ Checking .puppeteerrc.cjs...');
try {
  const puppeteerConfig = fs.readFileSync('.puppeteerrc.cjs', 'utf8');

  if (puppeteerConfig.includes('skipDownload') && puppeteerConfig.includes('true')) {
    checks.push({ name: 'Puppeteer skipDownload', status: '✓ PASS', detail: 'Chromium download disabled' });
  } else {
    checks.push({ name: 'Puppeteer skipDownload', status: '✗ FAIL', detail: 'skipDownload not properly configured' });
    allPassed = false;
  }
} catch (error) {
  checks.push({ name: '.puppeteerrc.cjs', status: '✗ FAIL', detail: 'File not found or not readable' });
  allPassed = false;
}

// Check 3: whatsappWorker.ts has packaging detection
console.log('✓ Checking electron/worker/whatsappWorker.ts...');
try {
  const workerSource = fs.readFileSync('electron/worker/whatsappWorker.ts', 'utf8');

  if (workerSource.includes('isPackaged')) {
    checks.push({ name: 'Packaging detection', status: '✓ PASS', detail: 'Worker detects packaged environment' });
  } else {
    checks.push({ name: 'Packaging detection', status: '⚠ WARN', detail: 'No packaging detection found' });
  }

  if (workerSource.includes('getChromiumExecutablePath')) {
    checks.push({ name: 'Chromium path function', status: '✓ PASS', detail: 'Custom Chromium path resolution exists' });
  } else {
    checks.push({ name: 'Chromium path function', status: '✗ FAIL', detail: 'Missing getChromiumExecutablePath function' });
    allPassed = false;
  }

  if (workerSource.includes('executablePath:')) {
    checks.push({ name: 'Puppeteer configuration', status: '✓ PASS', detail: 'executablePath configured in Puppeteer options' });
  } else {
    checks.push({ name: 'Puppeteer configuration', status: '✗ FAIL', detail: 'executablePath not set in Puppeteer options' });
    allPassed = false;
  }
} catch (error) {
  checks.push({ name: 'whatsappWorker.ts', status: '✗ FAIL', detail: 'File not found or not readable' });
  allPassed = false;
}

// Check 4: Compiled worker has the changes
console.log('✓ Checking dist-electron/electron/worker/whatsappWorker.js...');
try {
  const compiledWorker = fs.readFileSync('dist-electron/electron/worker/whatsappWorker.js', 'utf8');

  if (compiledWorker.includes('isPackaged')) {
    checks.push({ name: 'Compiled worker', status: '✓ PASS', detail: 'Changes compiled to JavaScript' });
  } else {
    checks.push({ name: 'Compiled worker', status: '⚠ WARN', detail: 'Compiled version may be outdated - run npm run build:electron' });
  }
} catch (error) {
  checks.push({ name: 'Compiled worker', status: '⚠ WARN', detail: 'Not compiled yet - run npm run build:electron' });
}

// Check 5: No Chromium cache exists
console.log('✓ Checking for Chromium cache...');
const cachePath = path.join('node_modules', '.cache', 'puppeteer');
if (fs.existsSync(cachePath)) {
  checks.push({ name: 'Chromium cache', status: '⚠ WARN', detail: 'Chromium cache found - should be deleted' });
} else {
  checks.push({ name: 'Chromium cache', status: '✓ PASS', detail: 'No Chromium cache present' });
}

// Check 6: Documentation exists
console.log('✓ Checking documentation...');
const docs = [
  'PACKAGED_APP_FIX.md',
  'QUICK_FIX_PACKAGED_APP.md',
  'FIX_SUMMARY.md'
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    checks.push({ name: `Documentation: ${doc}`, status: '✓ PASS', detail: 'Available' });
  }
});

// Print results
console.log('\n' + '='.repeat(70));
console.log('VERIFICATION RESULTS');
console.log('='.repeat(70) + '\n');

checks.forEach(check => {
  const status = check.status.includes('✓') ? '✓' : (check.status.includes('⚠') ? '⚠' : '✗');
  console.log(`${status} ${check.name}`);
  console.log(`  ${check.detail}`);
  console.log();
});

console.log('='.repeat(70));
if (allPassed) {
  console.log('✓ ALL CRITICAL CHECKS PASSED');
  console.log('\nYou can now build your packaged app:');
  console.log('  npm run build');
  console.log('  npm run dist:win');
} else {
  console.log('✗ SOME CHECKS FAILED');
  console.log('\nPlease review the failures above before building.');
}
console.log('='.repeat(70));

process.exit(allPassed ? 0 : 1);
