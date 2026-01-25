const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const userDataPath = process.env.APPDATA ? path.join(process.env.APPDATA, 'sambad') : path.join(require('os').homedir(), '.config', 'sambad');
const dbPath = path.join(userDataPath, 'sambad.db');

console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

const CAMPAIGN_ID = 32;

console.log(`\n--- INPSECTION FOR CAMPAIGN ${CAMPAIGN_ID} ---`);

const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(CAMPAIGN_ID);
if (!campaign) {
    console.log('Campaign 32 NOT FOUND. Listing recent:');
    const recents = db.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 5').all();
    console.table(recents);
} else {
    console.log('Campaign Found:', campaign.id, campaign.name, campaign.status);

    const msgCount = db.prepare('SELECT count(*) as c FROM campaign_messages WHERE campaign_id = ?').get(CAMPAIGN_ID);
    console.log('Total Messages in DB:', msgCount.c);

    const statusDist = db.prepare('SELECT status, count(*) as c, error_message FROM campaign_messages WHERE campaign_id = ? GROUP BY status').all(CAMPAIGN_ID);
    console.log('Status Distribution:', statusDist);

    if (msgCount.c === 0) {
        console.error('CRITICAL: 0 messages found. Campaign Start Transaction Failed.');
    }
}
