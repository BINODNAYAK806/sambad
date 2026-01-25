
// Simulate Backend Logic
const crypto = require('crypto');
const APP_SECRET = 'SAMBAD_CAMPAIGN_MANAGER_SECURE_UNLOCK_KEY_2025';

function generateChallenge() {
    return 'REQ-TEST1234';
}

function verify(challenge, response) {
    const hmac = crypto.createHmac('sha256', APP_SECRET);
    hmac.update(challenge);
    const expected = 'UNLOCK-' + hmac.digest('hex').toUpperCase().substring(0, 8);

    console.log('Server Expected:', expected);
    console.log('Client Provided:', response);
    return expected === response;
}

// 1. Get Challenge
const challenge = generateChallenge();
console.log('1. Generated Challenge:', challenge);

// 2. Run Child Process to get Key (simulating Admin Tool)
const { execSync } = require('child_process');
try {
    const output = execSync(`node scripts/generate-unlock-key.js ${challenge}`).toString();
    console.log('2. Admin Tool Output:\n', output);

    // Extract key from output
    const match = output.match(/UNLOCK KEY:\s+(UNLOCK-[A-F0-9]+)/);
    if (match) {
        const key = match[1];

        // 3. Verify
        const result = verify(challenge, key);
        console.log('3. Verification Result:', result ? 'SUCCESS' : 'FAILURE');
    } else {
        console.error('Failed to extract key from tool output');
    }
} catch (e) {
    console.error('Error running script:', e);
}
