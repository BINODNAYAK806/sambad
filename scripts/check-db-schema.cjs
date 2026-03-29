
const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database based on the logs I've seen
const dbPath = "C:\\Users\\Lenovo\\AppData\\Roaming\\Wapro\\sambad.db";

if (!fs.existsSync(dbPath)) {
    console.log(`Database not found at ${dbPath}`);
    process.exit(1);
}

const db = new BetterSqlite3(dbPath);
const tableInfo = db.prepare("PRAGMA table_info(campaigns)").all();
console.log("Campaigns Tabl Schema:");
console.log(JSON.stringify(tableInfo, null, 2));

const columns = tableInfo.map(c => c.name);
if (columns.includes('sending_strategy')) {
    console.log("Column 'sending_strategy' EXISTS.");
} else {
    console.log("Column 'sending_strategy' is MISSING!");
}

db.close();
