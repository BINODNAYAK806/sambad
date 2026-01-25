const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('   Verifying Chromium Installation');
console.log('============================================================\n');

const chromiumPath = path.join(process.cwd(), 'chromium');
const chromiumInfoPath = path.join(chromiumPath, 'chromium-info.json');

if (!fs.existsSync(chromiumPath)) {
  console.log('   ❌ Chromium directory not found');
  console.log('   Run "npm run download:chromium" to download Chromium');
  process.exit(1);
}

console.log('   ✓ Chromium directory exists');

if (!fs.existsSync(chromiumInfoPath)) {
  console.log('   ❌ chromium-info.json not found');
  console.log('   Run "npm run download:chromium" to download Chromium');
  process.exit(1);
}

try {
  const info = JSON.parse(fs.readFileSync(chromiumInfoPath, 'utf8'));
  console.log('   ✓ chromium-info.json found');
  console.log(`   Revision: ${info.revision}`);
  console.log(`   Downloaded: ${info.downloadedAt}`);

  if (!fs.existsSync(info.executablePath)) {
    console.log('   ❌ Chromium executable not found at:', info.executablePath);
    console.log('   Run "npm run download:chromium" to re-download Chromium');
    process.exit(1);
  }

  console.log('   ✓ Chromium executable verified');
  console.log(`   Path: ${info.executablePath}`);
} catch (error) {
  console.log('   ❌ Error reading chromium-info.json:', error.message);
  console.log('   Run "npm run download:chromium" to download Chromium');
  process.exit(1);
}

console.log('\n============================================================');
console.log('   ✅ Chromium verification completed successfully');
console.log('============================================================\n');
