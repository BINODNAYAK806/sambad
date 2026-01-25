const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const sessionDir = path.join(appData, 'Wapro', '.baileys_auth');

console.log('Target Session Directory:', sessionDir);

if (fs.existsSync(sessionDir)) {
    console.log('Found session directory. Attempting deletion...');
    try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log('✅ Session directory deleted successfully.');
    } catch (e) {
        console.error('❌ Failed to delete session directory:', e.message);
        console.error('--> Make sure "Wapro" app is CLOSED.');
        console.error('--> If npm run dev is running, stop it with Ctrl+C first.');
    }
} else {
    console.log('ℹ️ Session directory does not exist. (Clean start ready)');
}
