#!/usr/bin/env node

/**
 * Verification script for Chromium bundling fix
 *
 * This script checks that Puppeteer is properly configured to skip
 * Chromium download and use Electron's bundled browser instead.
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Chromium Bundling Fix Verification ===\n');

let allChecksPassed = true;

// Check 1: Verify .puppeteerrc.cjs exists
console.log('✓ Check 1: .puppeteerrc.cjs configuration file');
const puppeteerConfigPath = path.join(__dirname, '.puppeteerrc.cjs');
if (fs.existsSync(puppeteerConfigPath)) {
  const config = require(puppeteerConfigPath);
  if (config.skipDownload === true) {
    console.log('  ✅ PASS - Puppeteer configured to skip Chromium download');
  } else {
    console.log('  ❌ FAIL - Puppeteer not configured to skip download');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ FAIL - .puppeteerrc.cjs not found');
  allChecksPassed = false;
}

// Check 2: Verify Puppeteer cache doesn't exist
console.log('\n✓ Check 2: Puppeteer cache directory');
const puppeteerCachePath = path.join(__dirname, 'node_modules', '.cache', 'puppeteer');
if (!fs.existsSync(puppeteerCachePath)) {
  console.log('  ✅ PASS - No Puppeteer cache found (expected)');
} else {
  console.log('  ⚠️  WARNING - Puppeteer cache exists (may be from old installation)');
  console.log('     Run: rm -rf node_modules/.cache/puppeteer');
}

// Check 3: Verify whatsappWorker.ts has executablePath
console.log('\n✓ Check 3: WhatsApp Worker configuration');
const workerPath = path.join(__dirname, 'electron', 'worker', 'whatsappWorker.ts');
if (fs.existsSync(workerPath)) {
  const workerContent = fs.readFileSync(workerPath, 'utf-8');

  if (workerContent.includes('getChromiumExecutablePath') &&
      workerContent.includes('executablePath:')) {
    console.log('  ✅ PASS - Worker configured to use Electron Chromium');
  } else {
    console.log('  ❌ FAIL - Worker missing Electron Chromium configuration');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ FAIL - whatsappWorker.ts not found');
  allChecksPassed = false;
}

// Check 4: Verify whatsapp-web.js is installed
console.log('\n✓ Check 4: Dependencies');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = require(packageJsonPath);

  if (packageJson.dependencies && packageJson.dependencies['whatsapp-web.js']) {
    console.log('  ✅ PASS - whatsapp-web.js dependency found');
  } else {
    console.log('  ❌ FAIL - whatsapp-web.js not in dependencies');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ FAIL - package.json not found');
  allChecksPassed = false;
}

// Check 5: Estimate size savings
console.log('\n✓ Check 5: Estimated size savings');
console.log('  📊 Without fix: ~340MB (Electron Chromium + Puppeteer Chromium)');
console.log('  📊 With fix: ~170MB (Electron Chromium only)');
console.log('  💾 Savings: ~170MB (~50% reduction)');

// Final result
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('\nThe Chromium bundling fix is properly configured.');
  console.log('Puppeteer will use Electron\'s bundled Chromium.');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\nPlease review the failures above and fix them.');
  process.exit(1);
}
console.log('='.repeat(50) + '\n');

// Additional recommendations
console.log('📝 Recommendations:');
console.log('  1. Run: npm install (if not already done)');
console.log('  2. Run: npm run build (verify build succeeds)');
console.log('  3. Check logs for: "[Worker] Using Electron Chromium at:"');
console.log('  4. Test WhatsApp connection in the app');
console.log('');
