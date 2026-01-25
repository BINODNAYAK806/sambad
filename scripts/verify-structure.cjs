const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Sambad Build Structure Verification');
console.log('='.repeat(60));
console.log();

const checks = [
    // Renderer output
    { path: 'dist/index.html', required: true, type: 'file' },
    { path: 'dist/assets', required: true, type: 'dir' },

    // Electron output
    { path: 'dist-electron/electron/main/index.js', required: true, type: 'file' },
    { path: 'dist-electron/electron/preload/index.cjs', required: true, type: 'file' },
    { path: 'dist-electron/electron/worker', required: false, type: 'dir' },
    { path: 'dist-electron/chromium', required: false, type: 'dir' },

    // Config files
    { path: 'package.json', required: true, type: 'file' },
    { path: 'vite.config.ts', required: true, type: 'file' },
];

let allPassed = true;

// Check files/directories
console.log('1. File Structure Checks:');
console.log('-'.repeat(60));

checks.forEach(check => {
    const fullPath = path.join(__dirname, check.path);
    let exists = false;
    let correctType = false;

    try {
        const stat = fs.statSync(fullPath);
        exists = true;
        correctType = check.type === 'file' ? stat.isFile() : stat.isDirectory();
    } catch (err) {
        exists = false;
    }

    const status = exists && correctType ? '✓' : '✗';
    const required = check.required ? '[REQUIRED]' : '[OPTIONAL]';

    console.log(`${status} ${check.path.padEnd(45)} ${required}`);

    if (check.required && (!exists || !correctType)) {
        allPassed = false;
    }
});

console.log();

// Check HTML for relative paths
console.log('2. HTML Asset Path Check:');
console.log('-'.repeat(60));

const htmlPath = path.join(__dirname, 'dist/index.html');
if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Check for script tags
    const scriptRelative = htmlContent.includes('src="./assets/') || htmlContent.includes("src='./assets/");
    const scriptAbsolute = htmlContent.includes('src="/assets/') || htmlContent.includes("src='/assets/");

    // Check for link tags
    const linkRelative = htmlContent.includes('href="./assets/') || htmlContent.includes("href='./assets/");
    const linkAbsolute = htmlContent.includes('href="/assets/') || htmlContent.includes("href='/assets/");

    if (scriptRelative && !scriptAbsolute) {
        console.log('✓ Script tags use relative paths (./assets/)');
    } else if (scriptAbsolute) {
        console.log('✗ Script tags use absolute paths (/assets/) - WILL FAIL IN PRODUCTION');
        allPassed = false;
    } else {
        console.log('⚠ Could not find script tags, please verify manually');
    }

    if (linkRelative && !linkAbsolute) {
        console.log('✓ Link tags use relative paths (./assets/)');
    } else if (linkAbsolute) {
        console.log('✗ Link tags use absolute paths (/assets/) - WILL FAIL IN PRODUCTION');
        allPassed = false;
    } else {
        console.log('⚠ Could not find link tags, please verify manually');
    }

    // Show first few asset references
    const assetMatches = htmlContent.match(/(src|href)=["'](.*?)["']/g);
    if (assetMatches && assetMatches.length > 0) {
        console.log('\nAsset references found:');
        assetMatches.slice(0, 5).forEach(match => {
            console.log(`  ${match}`);
        });
        if (assetMatches.length > 5) {
            console.log(`  ... and ${assetMatches.length - 5} more`);
        }
    }
} else {
    console.log('✗ dist/index.html not found - cannot verify paths');
    allPassed = false;
}

console.log();

// Check package.json for build config
console.log('3. Package.json Build Configuration:');
console.log('-'.repeat(60));

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.build) {
        console.log('✓ Electron-builder configuration exists');

        if (packageJson.build.files && packageJson.build.files.includes('dist/**/*')) {
            console.log('✓ Build includes dist/**/* (renderer)');
        } else {
            console.log('✗ Build config missing dist/**/*');
            allPassed = false;
        }

        if (packageJson.build.files && packageJson.build.files.includes('dist-electron/**/*')) {
            console.log('✓ Build includes dist-electron/**/* (main/preload)');
        } else {
            console.log('✗ Build config missing dist-electron/**/*');
            allPassed = false;
        }

        if (packageJson.build.asarUnpack) {
            console.log(`✓ ASAR unpack configured (${packageJson.build.asarUnpack.length} patterns)`);
        } else {
            console.log('⚠ No ASAR unpack configuration (may cause issues with native modules)');
        }
    } else {
        console.log('✗ No electron-builder configuration found');
        allPassed = false;
    }
} else {
    console.log('✗ package.json not found');
    allPassed = false;
}

console.log();

// Check vite.config.ts
console.log('4. Vite Configuration:');
console.log('-'.repeat(60));

const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

    if (viteConfig.includes("base: './'") || viteConfig.includes('base: "./"')) {
        console.log('✓ Vite base is set to "./" (relative paths)');
    } else if (viteConfig.includes("base: '/'") || viteConfig.includes('base: "/"')) {
        console.log('✗ Vite base is "/" (absolute paths) - WILL FAIL IN PRODUCTION');
        allPassed = false;
    } else {
        console.log('⚠ Could not determine Vite base path, please verify manually');
    }

    if (viteConfig.includes('outDir:') && viteConfig.includes("'dist'")) {
        console.log('✓ Vite output directory is "dist"');
    } else {
        console.log('⚠ Vite output directory may not be "dist"');
    }
} else {
    console.log('✗ vite.config.ts not found');
    allPassed = false;
}

console.log();
console.log('='.repeat(60));

if (allPassed) {
    console.log('✓ ALL CHECKS PASSED - Ready for packaging!');
    console.log();
    console.log('Next steps:');
    console.log('  1. Test production mode: npm run electron:prod');
    console.log('  2. If test passes, package: npm run dist:win');
} else {
    console.log('✗ SOME CHECKS FAILED - Please fix issues before packaging');
    console.log();
    console.log('Review the errors above and:');
    console.log('  1. Ensure npm run build completed successfully');
    console.log('  2. Check vite.config.ts has base: "./"');
    console.log('  3. Verify package.json has build configuration');
}

console.log('='.repeat(60));
console.log();
