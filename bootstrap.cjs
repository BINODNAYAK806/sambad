const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

console.log('--- CJS BOOTSTRAPPER STARTING ---');

app.whenReady().then(async () => {
    console.log('app is ready! Initializing ESM...');
    try {
        // Use an absolute path for the dynamic import to be safe
       const esmPath = path.join(__dirname, 'test_imports.js').replace(/\\/g, '/');
       console.log('Importing ESM from:', esmPath);
       await import('file://' + esmPath);
       console.log('ESM loaded successfully!');
    } catch (e) {
        console.error('ESM Load failed:', e.message);
        if (e.stack) console.error(e.stack);
    }
});
