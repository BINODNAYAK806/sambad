const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('C:', 'Users', 'Lenovo', 'AppData', 'Roaming', 'Sambad', 'sambad.db');
console.log('Opening DB at:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    // Check logs
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 20').all();
    console.log('--- DB LOGS ---');
    logs.forEach(l => {
        console.log(`[${new Date(l.timestamp).toISOString()}] ${l.level.toUpperCase()} [${l.category}]: ${l.message}`);
        if (l.data) console.log('  Data:', l.data);
    });

    // Check campaigns status
    const campaigns = db.prepare('SELECT id, name, status, sent_count, failed_count, total_count FROM campaigns ORDER BY id DESC LIMIT 5').all();
    console.log('\n--- CAMPAIGNS ---');
    console.table(campaigns);

    db.close();
} catch (err) {
    console.error('Error reading DB:', err);
    if (err.code === 'SQLITE_BUSY') {
        console.log('Database is busy/locked. Try again.');
    }
}
