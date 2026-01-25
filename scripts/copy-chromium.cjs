const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('   Copying Chromium for Distribution');
console.log('============================================================\n');

const chromiumSourcePath = path.join(process.cwd(), 'chromium');
const distPath = path.join(process.cwd(), 'dist-electron', 'chromium');

if (!fs.existsSync(chromiumSourcePath)) {
  console.log('   ❌ Chromium source directory not found');
  console.log('   Run "npm run download:chromium" first');
  process.exit(1);
}

console.log('   Source:', chromiumSourcePath);
console.log('   Destination:', distPath);

if (fs.existsSync(distPath)) {
  console.log('   ℹ Cleaning existing chromium in dist...');
  fs.rmSync(distPath, { recursive: true, force: true });
}

console.log('   Copying chromium directory...');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  copyRecursiveSync(chromiumSourcePath, distPath);
  console.log('   ✓ Chromium copied successfully');

  const infoPath = path.join(distPath, 'chromium-info.json');
  if (fs.existsSync(infoPath)) {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    console.log(`   ✓ Revision: ${info.revision}`);
  }
} catch (error) {
  console.error('   ❌ Error copying chromium:', error.message);
  process.exit(1);
}

console.log('\n============================================================');
console.log('   ✅ Chromium copy completed successfully');
console.log('============================================================\n');
