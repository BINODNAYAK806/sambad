/**
 * Verify that all required dependencies are unpacked in the built application
 */
const fs = require('fs');
const path = require('path');

console.log('\n=== Verifying Dependency Chain Fix ===\n');

const requiredModules = [
  'whatsapp-web.js',
  'puppeteer',
  'puppeteer-core',
  'extract-zip',
  'debug',
  'ms',
  'get-stream',
  'yauzl',
  'fd-slicer',
  'buffer-crc32',
  'pend'
];

let allFound = true;

console.log('Checking node_modules:');
requiredModules.forEach(moduleName => {
  const modulePath = path.join(__dirname, 'node_modules', moduleName);
  const exists = fs.existsSync(modulePath);
  const status = exists ? '✓' : '✗';
  console.log(`  ${status} ${moduleName}`);
  if (!exists) allFound = false;
});

console.log('\nChecking electron-builder.json5 configuration:');
const configPath = path.join(__dirname, 'electron-builder.json5');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  console.log('  ✓ electron-builder.json5 exists');

  requiredModules.forEach(moduleName => {
    if (config.includes(`node_modules/${moduleName}/**/*`)) {
      console.log(`  ✓ ${moduleName} in asarUnpack`);
    } else {
      console.log(`  ✗ ${moduleName} NOT in asarUnpack`);
      allFound = false;
    }
  });
} else {
  console.log('  ✗ electron-builder.json5 NOT FOUND');
  allFound = false;
}

console.log('\n' + (allFound ? '✓ All dependencies verified!' : '✗ Some dependencies missing!'));
console.log('\n');

process.exit(allFound ? 0 : 1);
