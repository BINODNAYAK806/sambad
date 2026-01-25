const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('   Sambad Build Verification');
console.log('============================================================\n');

let hasErrors = false;

function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✓ ${description}`);
    return true;
  } else {
    console.log(`   ❌ ${description} - NOT FOUND`);
    console.log(`      Expected: ${fullPath}`);
    hasErrors = true;
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath);
    if (files.length > 0) {
      console.log(`   ✓ ${description} (${files.length} files)`);
      return true;
    } else {
      console.log(`   ⚠️  ${description} - EMPTY`);
      hasErrors = true;
      return false;
    }
  } else {
    console.log(`   ❌ ${description} - NOT FOUND`);
    hasErrors = true;
    return false;
  }
}

// Check package.json
console.log('[1] Checking package.json configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.main === 'dist-electron/electron/main/index.js') {
    console.log('   ✓ Main entry point is correctly set');
  } else {
    console.log(`   ❌ Main entry point is incorrect: ${packageJson.main}`);
    console.log('      Expected: dist-electron/electron/main/index.js');
    hasErrors = true;
  }
} catch (error) {
  console.log(`   ❌ Cannot read package.json: ${error.message}`);
  hasErrors = true;
}
console.log();

// Check renderer build
console.log('[2] Checking renderer build (React app)...');
checkFile('dist/index.html', 'Renderer HTML');
checkDirectory('dist/assets', 'Renderer assets');
console.log();

// Check Electron main process
console.log('[3] Checking Electron main process...');
checkFile('dist-electron/electron/main/index.js', 'Main process entry point');
checkFile('dist-electron/electron/main/ipc.js', 'IPC handlers');
checkFile('dist-electron/electron/main/supabase.js', 'Supabase client');
checkFile('dist-electron/electron/main/workerManager.js', 'Worker manager');
checkFile('dist-electron/electron/main/whatsappAdapter.js', 'WhatsApp adapter');
console.log();

// Check Electron preload script
console.log('[4] Checking Electron preload script...');
checkFile('dist-electron/electron/preload/index.cjs', 'Preload script');
console.log();

// Check worker files
console.log('[5] Checking worker files...');
checkFile('dist-electron/electron/worker/whatsappWorker.js', 'WhatsApp worker');
checkFile('dist-electron/electron/worker/delayHelper.js', 'Delay helper');
console.log();

// Check dependencies
console.log('[6] Checking dependencies...');
checkDirectory('node_modules', 'Node modules');
console.log();

// Final summary
console.log('============================================================');
if (hasErrors) {
  console.log('   ❌ Build verification FAILED');
  console.log('============================================================\n');
  console.log('Issues found! To fix:');
  console.log('  1. Run: npm install     (if node_modules is missing)');
  console.log('  2. Run: npm run build   (to build all components)\n');
  console.log('Or use the automated fix:');
  console.log('  - Windows: fix-app-launch.bat');
  console.log('  - Mac/Linux: npm run clean && npm run build\n');
  process.exit(1);
} else {
  console.log('   ✅ All checks passed!');
  console.log('============================================================\n');
  console.log('Your app is ready to run:');
  console.log('  - Development: npm run dev');
  console.log('  - Production:  npm run electron:prod');
  console.log('  - Installer:   npm run dist:win (or dist:mac/dist:linux)\n');
  process.exit(0);
}
