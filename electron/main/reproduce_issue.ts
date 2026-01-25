
import { initDatabase, groups, contacts, campaignMessages, getDatabase } from './db/index';
import * as path from 'path';
import { app } from 'electron';

// Mock app.getPath for non-electron environment or ensure it runs in electron context
// Since we are running this likely via ts-node or similar, better to just modify db/index temporarily OR 
// use a hardcoded path for testing.

// Actually, I can just use the existing db/index if I can run it.
// I will assume I can run this script with `npx tsx electron/main/reproduce_issue.ts` 
// But `app.getPath` might fail.

// Let's modify initDatabase to accept a path or mock it.
// For now, I'll rely on a manual test or just adding logs to the actual code.
// But wait, I can write a small standalone script that imports better-sqlite3 directly to test the SQL logic.

import Database from 'better-sqlite3';

const dbPath = 'test.db';
const db = new Database(dbPath);

// Recreate schema
db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      vars_json TEXT
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS groups(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS group_contacts(
      group_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      PRIMARY KEY(group_id, contact_id),
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
`);

// Test Logic
try {
    console.log('--- STARTING TEST ---');

    // 1. Create Group
    const groupStmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const groupInfo = groupStmt.run('Test Group ' + Date.now());
    const groupId = groupInfo.lastInsertRowid as number;
    console.log('Created Group ID:', groupId);

    // 2. Create Contacts (Bulk)
    const contactStmt = db.prepare('INSERT INTO contacts (phone, name) VALUES (?, ?)');
    const contactIds: number[] = [];
    const contactsData = [
        { phone: '1234567890', name: 'User 1' },
        { phone: '0987654321', name: 'User 2' }
    ];

    for (const c of contactsData) {
        try {
            // Check if exists manually to simulate bulkCreate logic if needed
            // But here we just insert
            const info = contactStmt.run(c.phone, c.name);
            contactIds.push(info.lastInsertRowid as number);
        } catch (e) {
            console.log('Skipping duplicate:', c.phone);
            // In real app, bulkCreate fails completely if transaction bounds.
        }
    }
    console.log('Created Contact IDs:', contactIds);

    // 3. Assign
    const assignStmt = db.prepare('INSERT OR IGNORE INTO group_contacts (group_id, contact_id) VALUES (?, ?)');

    for (const cid of contactIds) {
        assignStmt.run(groupId, cid);
        console.log(`Assigned Contact ${cid} to Group ${groupId}`);
    }

    // 4. Verify
    const rows = db.prepare('SELECT * FROM group_contacts WHERE group_id = ?').all(groupId);
    console.log('Group Members:', rows);

    if (rows.length === contactIds.length) {
        console.log('SUCCESS: All contacts assigned.');
    } else {
        console.error('FAILURE: Missing assignments.');
    }

} catch (err) {
    console.error('TEST DASHED:', err);
} finally {
    db.close();
    // fs.unlinkSync(dbPath);
}
