import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const dbPath = path.join(appData, 'Wapro', 'sambad.db');

console.log('Opening DB at:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    // 1. Get latest campaign
    const campaign = db.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 1').get();
    console.log('\nLatest Campaign:', campaign);

    if (campaign) {
        // 2. Get poll results for this campaign
        const pollResult = db.prepare('SELECT * FROM poll_results WHERE campaign_id = ?').get(campaign.id);
        console.log('\nPoll Result:', pollResult);

        // 3. Get messages for this campaign (limit 5)
        const messages = db.prepare('SELECT * FROM campaign_messages WHERE campaign_id = ? LIMIT 5').all(campaign.id);
        console.log('\nCampaign Messages (first 5):', messages.map(m => ({
            id: m.id,
            phone: m.recipient_number,
            server_id: m.server_id
        })));

        // 4. Get ALL poll votes
        const votes = db.prepare('SELECT * FROM poll_votes ORDER BY updated_at DESC LIMIT 5').all();
        console.log('\nLatest Poll Votes (Global):', votes);

        // 5. Check format mismatch
        if (messages.length > 0 && votes.length > 0) {
            const recipient = messages[0].recipient_number;
            const voter = votes[0].voter_phone;
            console.log(`\nComparison: Recipient '${recipient}' vs Voter '${voter}'`);
            console.log(`Match? ${recipient === voter}`);
        }
    }

} catch (err) {
    console.error('Error:', err);
}
