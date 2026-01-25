const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('   Cleaning Build Directories');
console.log('============================================================\n');

function removeDirectory(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (fs.existsSync(fullPath)) {
    let retries = 5;
    while (retries > 0) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`   ✓ Removed ${dirPath}`);
        return;
      } catch (err) {
        if (err.code === 'EBUSY' || err.code === 'EPERM') {
          console.log(`   ⚠ Lock detected on ${dirPath}, retrying in 1s... (${retries} retries left)`);
          const start = Date.now();
          while (Date.now() - start < 1000) { } // Busy wait for 1s
          retries--;
        } else {
          throw err;
        }
      }
    }
    // Final attempt
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`   ✓ Removed ${dirPath}`);
  } else {
    console.log(`   ⊘ ${dirPath} (does not exist)`);
  }
}

// Clean build directories
console.log('Removing build artifacts...');
removeDirectory('dist');
removeDirectory('dist-electron');
removeDirectory('release');

// Remove TypeScript build info files
console.log('\nRemoving TypeScript build cache...');
function removeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`   ✓ Removed ${filePath}`);
  } else {
    console.log(`   ⊘ ${filePath} (does not exist)`);
  }
}

removeFile('tsconfig.electron.tsbuildinfo');
removeFile('tsconfig.renderer.tsbuildinfo');
removeFile('tsconfig.preload.tsbuildinfo');

console.log('\n============================================================');
console.log('   ✅ Clean completed successfully!');
console.log('============================================================\n');
