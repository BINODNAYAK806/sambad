import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const crypto = require('crypto');

// Must match the secret in electron/main/supportService.ts
const APP_SECRET = 'SAMBAD_CAMPAIGN_MANAGER_SECURE_UNLOCK_KEY_2025';

function generateUnlockKey(challenge) {
    if (!challenge) {
        console.error('Error: No challenge code provided.');
        return null;
    }

    // Logic must match verifySupportCode in supportService.ts
    const hmac = crypto.createHmac('sha256', APP_SECRET);
    hmac.update(challenge);
    const fullHash = hmac.digest('hex').toUpperCase();
    const unlockKey = 'UNLOCK-' + fullHash.substring(0, 8);

    return unlockKey;
}

// CLI Usage
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Usage: node generate-unlock-key.js <CHALLENGE_CODE>');
    console.log('Example: node generate-unlock-key.js REQ-A1B2');
    process.exit(1);
}

const challenge = args[0];
const key = generateUnlockKey(challenge);

if (key) {
    console.log('\n==========================================');
    console.log(' CHALLENGE:  ', challenge);
    console.log(' UNLOCK KEY: ', key);
    console.log('==========================================\n');
}
