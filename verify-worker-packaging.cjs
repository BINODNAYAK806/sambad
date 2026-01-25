#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Worker Packaging Verification Script');
console.log('='.repeat(60));

const releasePath = path.join(__dirname, 'release', 'win-unpacked');

if (!fs.existsSync(releasePath)) {
  console.error('❌ Release folder not found at:', releasePath);
  console.error('   Please build the app first with: npm run dist:win');
  process.exit(1);
}

console.log('✅ Release folder found');

const checks = [
  {
    name: 'Main executable',
    path: path.join(releasePath, 'Sambad.exe'),
    critical: true,
  },
  {
    name: 'Resources folder',
    path: path.join(releasePath, 'resources'),
    critical: true,
  },
  {
    name: 'app.asar',
    path: path.join(releasePath, 'resources', 'app.asar'),
    critical: true,
  },
  {
    name: 'app.asar.unpacked',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked'),
    critical: true,
  },
  {
    name: 'Worker file',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked', 'dist-electron', 'electron', 'worker', 'whatsappWorker.js'),
    critical: true,
  },
  {
    name: 'Worker types',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked', 'dist-electron', 'electron', 'worker', 'types.js'),
    critical: true,
  },
  {
    name: 'Worker delayHelper',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked', 'dist-electron', 'electron', 'worker', 'delayHelper.js'),
    critical: true,
  },
  {
    name: 'Worker localStorageManager',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked', 'dist-electron', 'electron', 'worker', 'localStorageManager.js'),
    critical: true,
  },
  {
    name: 'whatsapp-web.js (unpacked)',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked', 'node_modules', 'whatsapp-web.js'),
    critical: true,
  },
  {
    name: 'puppeteer (unpacked)',
    path: path.join(releasePath, 'resources', 'app.asar.unpacked', 'node_modules', 'puppeteer'),
    critical: true,
  },
  {
    name: 'Chromium bundle',
    path: path.join(releasePath, 'resources', 'chrome'),
    critical: false,
  },
];

let allPassed = true;
let criticalFailed = false;

console.log('\nChecking files and folders:\n');

checks.forEach((check) => {
  const exists = fs.existsSync(check.path);
  const icon = exists ? '✅' : (check.critical ? '❌' : '⚠️');
  const status = exists ? 'Found' : 'Missing';

  console.log(`${icon} ${check.name}: ${status}`);

  if (exists) {
    try {
      const stats = fs.statSync(check.path);
      if (stats.isFile()) {
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   Size: ${sizeKB} KB`);

        if (stats.size === 0) {
          console.log('   ⚠️  WARNING: File is empty!');
          allPassed = false;
        }
      } else if (stats.isDirectory()) {
        const files = fs.readdirSync(check.path);
        console.log(`   Contains ${files.length} items`);
      }
    } catch (err) {
      console.log(`   ⚠️  Error reading: ${err.message}`);
    }
  } else {
    if (check.critical) {
      criticalFailed = true;
    }
    allPassed = false;
  }

  console.log(`   Path: ${check.path}\n`);
});

console.log('='.repeat(60));

if (criticalFailed) {
  console.error('\n❌ CRITICAL FILES MISSING!');
  console.error('   The app will NOT work without these files.\n');
  console.error('   Steps to fix:');
  console.error('   1. Delete the release folder');
  console.error('   2. Run: npm run build');
  console.error('   3. Run: npm run dist:win');
  console.error('   4. Run this script again\n');
  process.exit(1);
} else if (!allPassed) {
  console.warn('\n⚠️  Some files are missing, but app may still work.');
  console.warn('   Check warnings above.\n');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED!');
  console.log('   Worker files are correctly packaged.');
  console.log('   The app should work correctly.\n');
  console.log('   Next steps:');
  console.log('   1. Run: cd release/win-unpacked');
  console.log('   2. Run: Sambad.exe');
  console.log('   3. Press F12 to open DevTools');
  console.log('   4. Look for [Worker] logs in console\n');
  process.exit(0);
}
