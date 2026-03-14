console.log('--- STARTING LOW-LEVEL DIAGNOSTIC ---');

try {
  console.log('Testing process._linkedBinding("electron")...');
  const electron = process._linkedBinding('electron');
  console.log('✅ Success! Keys:', Object.keys(electron).slice(0, 10));
  console.log('app exists:', !!electron.app);
  if (electron.app) {
    console.log('app.version:', electron.app.getVersion());
  }
} catch (e) {
  console.error('❌ FAILED process._linkedBinding:', e.message);
}

try {
  console.log('\nTesting require("electron") via global require...');
  const electron = require('electron');
  console.log('require("electron") result:', typeof electron === 'string' ? `"${electron}"` : `object with keys [${Object.keys(electron).slice(0, 5)}]`);
} catch (e) {
  console.error('❌ FAILED global require:', e.message);
}

process.exit(0);
