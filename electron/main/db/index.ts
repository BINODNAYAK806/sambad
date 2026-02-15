import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database | null = null;

export type ContactVariables = {
  v1?: string;
  v2?: string;
  v3?: string;
  v4?: string;
  v5?: string;
  v6?: string;
  v7?: string;
  v8?: string;
  v9?: string;
  v10?: string;
};

export type Contact = {
  id?: number;
  phone: string;
  name: string;
  vars_json?: string;
  variables?: ContactVariables;
};

export type Group = {
  id?: number;
  name: string;
};

export type Campaign = {
  id?: number;
  name: string;
  status: string;
  message_template?: string;
  group_id?: number;
  delay_preset?: string;
  delay_min?: number;
  delay_max?: number;
  sent_count?: number;
  failed_count?: number;
  total_count?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  template_image_path?: string;
  template_image_name?: string;
  template_image_size?: number;
  template_image_type?: string;
  sending_strategy?: 'single' | 'rotational';
  server_id?: number;
  is_poll?: boolean;
  poll_question?: string;
  poll_options?: string;
};

export type GroupContact = {
  group_id: number;
  contact_id: number;
};

export type LogEntry = {
  id?: number;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
  message: string;
  data?: string;
};

export type SystemSetting = {
  key: string;
  value: string;
};

export type User = {
  id?: number;
  username: string;
  password_hash: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
};

export type StaffPermission = {
  id?: number;
  user_id: number;
  module_name: string;
  can_create: number;
  can_read: number;
  can_update: number;
  can_delete: number;
  hide_mobile: number;
};

export type CampaignMedia = {
  id: string;
  campaign_id: number;
  file_name: string;
  file_type: 'image' | 'document';
  file_size: number;
  file_data?: Buffer;
  file_path?: string;
  caption?: string;
  created_at?: string;
};

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'sambad.db');

  console.log('[Sambad DB] Initializing database at:', dbPath);

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  migrateSchema();

  console.log('[Sambad DB] Database initialized successfully');
  return db;
}

function migrateSchema() {
  if (!db) return;

  // Add missing columns to campaigns if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(campaigns)").all() as any[];
  const columns = tableInfo.map(c => c.name);

  if (!columns.includes('template_image_path')) {
    console.log('[Sambad DB] Adding template_image_path to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN template_image_path TEXT');
  }
  if (!columns.includes('template_image_name')) {
    db.exec('ALTER TABLE campaigns ADD COLUMN template_image_name TEXT');
  }
  if (!columns.includes('template_image_size')) {
    db.exec('ALTER TABLE campaigns ADD COLUMN template_image_size INTEGER');
  }
  if (!columns.includes('template_image_type')) {
    db.exec('ALTER TABLE campaigns ADD COLUMN template_image_type TEXT');
  }

  // Add count columns if they don't exist (for older databases)
  if (!columns.includes('sent_count')) {
    console.log('[Sambad DB] Adding sent_count to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN sent_count INTEGER DEFAULT 0');
  }
  if (!columns.includes('failed_count')) {
    console.log('[Sambad DB] Adding failed_count to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN failed_count INTEGER DEFAULT 0');
  }
  if (!columns.includes('total_count')) {
    console.log('[Sambad DB] Adding total_count to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN total_count INTEGER DEFAULT 0');
  }
  if (!columns.includes('started_at')) {
    console.log('[Sambad DB] Adding started_at to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN started_at TEXT');
  }
  if (!columns.includes('completed_at')) {
    console.log('[Sambad DB] Adding completed_at to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN completed_at TEXT');
  }

  // Add multi-server and poll columns
  if (!columns.includes('sending_strategy')) {
    console.log('[Sambad DB] Adding sending_strategy to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN sending_strategy TEXT DEFAULT \'single\'');
  }
  if (!columns.includes('server_id')) {
    db.exec('ALTER TABLE campaigns ADD COLUMN server_id INTEGER DEFAULT 1');
  }
  if (!columns.includes('is_poll')) {
    db.exec('ALTER TABLE campaigns ADD COLUMN is_poll INTEGER DEFAULT 0');
  }
  if (!columns.includes('poll_question')) {
    db.exec('ALTER TABLE campaigns ADD COLUMN poll_question TEXT');
  }
  if (!columns.includes('poll_options')) {
    console.log('[Sambad DB] Adding poll_options to campaigns');
    db.exec('ALTER TABLE campaigns ADD COLUMN poll_options TEXT');
  }

  // Add server_id to campaign_messages if it doesn't exist
  const messageColumns = db.prepare('PRAGMA table_info(campaign_messages)').all().map((col: any) => col.name);
  if (!messageColumns.includes('server_id')) {
    console.log('[Sambad DB] Adding server_id to campaign_messages');
    db.exec('ALTER TABLE campaign_messages ADD COLUMN server_id INTEGER');
  }

  // Ensure index exists (safe to run after column is confirmed)
  db.exec('CREATE INDEX IF NOT EXISTS idx_campaign_messages_server_id ON campaign_messages(server_id)');
}

function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Licensing and Auth Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT CHECK(role IN ('SUPER_ADMIN', 'ADMIN', 'STAFF'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      module_name TEXT, 
      can_create INTEGER DEFAULT 0,
      can_read INTEGER DEFAULT 0,
      can_update INTEGER DEFAULT 0,
      can_delete INTEGER DEFAULT 0,
      hide_mobile INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS business_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL,
      phone_number TEXT,
      gstin TEXT,
      email_id TEXT,
      business_type TEXT,
      business_category TEXT,
      state TEXT,
      pincode TEXT,
      address TEXT,
      logo_path TEXT,
      signature_path TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Existing Tables
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      message_template TEXT,
      group_id INTEGER,
      delay_preset TEXT,
      delay_min INTEGER,
      delay_max INTEGER,
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      template_image_path TEXT,
      template_image_name TEXT,
      template_image_size INTEGER,
      template_image_type TEXT,
      sending_strategy TEXT DEFAULT 'single',
      server_id INTEGER DEFAULT 1,
      is_poll INTEGER DEFAULT 0,
      poll_question TEXT,
      poll_options TEXT,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE SET NULL
    )
    `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT
    )
    `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_messages(
      id TEXT PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      contact_id INTEGER,
      recipient_number TEXT NOT NULL,
      recipient_name TEXT,
      template_text TEXT NOT NULL,
      resolved_text TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      server_id INTEGER,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE SET NULL
    )
    `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_media(
      id TEXT PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_data BLOB,
      file_path TEXT,
      caption TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    )
    `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_contacts(
      campaign_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      PRIMARY KEY(campaign_id, contact_id),
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
    `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC)
    `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)
    `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign ON campaign_messages(campaign_id)
    `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON campaign_messages(status)
    `);

  // Campaign runs table - tracks each individual run of a campaign
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_runs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      campaign_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'running',
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    )
    `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_campaign_runs_campaign ON campaign_runs(campaign_id)
    `);

  // Campaign run messages - tracks failed messages for each run
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_run_messages(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      recipient_number TEXT NOT NULL,
      recipient_name TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      sent_at TEXT,
      FOREIGN KEY(run_id) REFERENCES campaign_runs(id) ON DELETE CASCADE
    )
    `);

  // Initial Settings
  const check = db.prepare('SELECT COUNT(*) as count FROM system_settings WHERE key = ?').get('app_version');
  if ((check as any).count === 0) {
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('app_version', '1.0.0');
  }

  console.log('[Sambad DB] Tables created successfully');

  // Create indexes for performance optimization
  console.log('[Sambad DB] Creating performance indexes...');

  // Contacts indexes - phone is heavily queried
  db.exec(`CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone)`);

  // Campaigns indexes - status and server_id are frequently filtered
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_server_id ON campaigns(server_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_sending_strategy ON campaigns(sending_strategy)`);

  // Campaign messages indexes - campaign_id is used in JOINs and WHERE clauses
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON campaign_messages(campaign_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON campaign_messages(status)`);



  // Groups indexes - name is used in searches
  db.exec(`CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name)`);

  // Group contacts indexes - both IDs used in JOINs
  db.exec(`CREATE INDEX IF NOT EXISTS idx_group_contacts_group_id ON group_contacts(group_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_group_contacts_contact_id ON group_contacts(contact_id)`);

  // Campaign media indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaign_media_campaign_id ON campaign_media(campaign_id)`);

  // Campaign runs indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaign_runs_campaign_id ON campaign_runs(campaign_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_campaign_runs_started_at ON campaign_runs(started_at)`);

  // Create poll results tracking tables
  console.log('[Sambad DB] Creating poll tracking tables...');

  db.exec(`
      CREATE TABLE IF NOT EXISTS poll_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        message_id TEXT UNIQUE NOT NULL,
        poll_question TEXT NOT NULL,
        poll_options TEXT NOT NULL,
        total_votes INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      )
    `);

  db.exec(`
      CREATE TABLE IF NOT EXISTS poll_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_result_id INTEGER NOT NULL,
        voter_jid TEXT NOT NULL,
        voter_name TEXT,
        voter_phone TEXT NOT NULL,
        selected_option TEXT NOT NULL,
        voted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(poll_result_id, voter_jid),
        FOREIGN KEY (poll_result_id) REFERENCES poll_results(id) ON DELETE CASCADE
      )
    `);

  // Create indexes for poll tables
  db.exec('CREATE INDEX IF NOT EXISTS idx_poll_results_campaign_id ON poll_results(campaign_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_poll_results_message_id ON poll_results(message_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_result_id ON poll_votes(poll_result_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_poll_votes_voter_jid ON poll_votes(voter_jid)');

  console.log('[Sambad DB] Poll tracking tables created successfully');

  console.log('[Sambad DB] Performance indexes created successfully');

}

export function getSystemSetting(key: string): string | null {
  if (!db) return null;
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  return row ? (row as any).value : null;
}

export function setSystemSetting(key: string, value: string): void {
  if (!db) return;
  db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getDatabase(): Database.Database {
  if (!db) {
    console.log('[Sambad DB] Database not initialized. Auto-initializing...');
    return initDatabase();
  }
  return db;
}

export const contacts = {
  list: (): any[] => {
    const db = getDatabase();
    const rows = db.prepare(`
  SELECT
  c.*,
    GROUP_CONCAT(g.id) as group_ids,
    GROUP_CONCAT(g.name) as group_names
      FROM contacts c
      LEFT JOIN group_contacts gc ON c.id = gc.contact_id
      LEFT JOIN groups g ON gc.group_id = g.id
      GROUP BY c.id
      ORDER BY c.name
    `).all() as any[];

    return rows.map(row => {
      const group_ids = row.group_ids ? row.group_ids.split(',').map(Number) : [];
      const group_names = row.group_names ? row.group_names.split(',') : [];

      return {
        ...row,
        variables: row.vars_json ? JSON.parse(row.vars_json) : undefined,
        groups: group_ids.map((id: number, index: number) => ({
          id,
          name: group_names[index]
        }))
      };
    });
  },

  getById: (id: number): any | undefined => {
    const db = getDatabase();
    const row = db.prepare(`
  SELECT
  c.*,
    GROUP_CONCAT(g.id) as group_ids,
    GROUP_CONCAT(g.name) as group_names
      FROM contacts c
      LEFT JOIN group_contacts gc ON c.id = gc.contact_id
      LEFT JOIN groups g ON gc.group_id = g.id
      WHERE c.id = ?
    GROUP BY c.id
    `).get(id) as any | undefined;

    if (!row) return undefined;

    const group_ids = row.group_ids ? row.group_ids.split(',').map(Number) : [];
    const group_names = row.group_names ? row.group_names.split(',') : [];

    return {
      ...row,
      variables: row.vars_json ? JSON.parse(row.vars_json) : undefined,
      groups: group_ids.map((id: number, index: number) => ({
        id,
        name: group_names[index]
      }))
    };
  },

  create: (contact: Omit<Contact, 'id'>): number => {
    const db = getDatabase();
    const varsJson = contact.variables
      ? JSON.stringify(contact.variables)
      : (contact.vars_json || null);
    const stmt = db.prepare(
      'INSERT INTO contacts (phone, name, vars_json) VALUES (?, ?, ?)'
    );
    const result = stmt.run(
      contact.phone,
      contact.name,
      varsJson
    );
    return result.lastInsertRowid as number;
  },

  update: (id: number, contact: Partial<Contact>): void => {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (contact.phone !== undefined) {
      fields.push('phone = ?');
      values.push(contact.phone);
    }
    if (contact.name !== undefined) {
      fields.push('name = ?');
      values.push(contact.name);
    }
    if (contact.variables !== undefined) {
      fields.push('vars_json = ?');
      values.push(JSON.stringify(contact.variables));
    } else if (contact.vars_json !== undefined) {
      fields.push('vars_json = ?');
      values.push(contact.vars_json);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(
      `UPDATE contacts SET ${fields.join(', ')} WHERE id = ? `
    );
    stmt.run(...values);
  },

  delete: (id: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  },

  bulkCreate: (contactsList: Omit<Contact, 'id'>[]): number[] => {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO contacts (phone, name, vars_json) VALUES (?, ?, ?)'
    );
    const ids: number[] = [];

    const insertMany = db.transaction((contacts: Omit<Contact, 'id'>[]) => {
      for (const contact of contacts) {
        const varsJson = contact.variables
          ? JSON.stringify(contact.variables)
          : (contact.vars_json || null);
        const result = stmt.run(contact.phone, contact.name, varsJson);
        ids.push(result.lastInsertRowid as number);
      }
    });

    insertMany(contactsList);
    return ids;
  },

  findDuplicates: (): Contact[] => {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT c.* FROM contacts c
      INNER JOIN(
      SELECT phone, COUNT(*) as count
        FROM contacts
        GROUP BY phone
        HAVING count > 1
    ) dupes ON c.phone = dupes.phone
      ORDER BY c.phone, c.id
    `).all() as Contact[];

    return rows.map(row => ({
      ...row,
      variables: row.vars_json ? JSON.parse(row.vars_json) : undefined
    }));
  },

  removeDuplicates: (): number => {
    const db = getDatabase();
    const result = db.prepare(`
      DELETE FROM contacts
      WHERE id NOT IN(
      SELECT MIN(id)
        FROM contacts
        GROUP BY phone
    )
    `).run();
    return result.changes;
  },

  checkExisting: (phones: string[]): string[] => {
    const db = getDatabase();
    if (phones.length === 0) return [];

    const placeholders = phones.map(() => '?').join(',');
    const rows = db.prepare(`SELECT phone FROM contacts WHERE phone IN (${placeholders})`).all(phones) as { phone: string }[];
    return rows.map(r => r.phone);
  },
  getAll(): Contact[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM contacts').all() as Contact[];
  },
  deleteAll(): void {
    const db = getDatabase();
    db.prepare('DELETE FROM contacts').run();
  },
};

export const groups = {
  list: (): Group[] => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM groups ORDER BY name').all() as Group[];
  },

  getById: (id: number): Group | undefined => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as Group | undefined;
  },

  create: (group: Omit<Group, 'id'>): number => {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const result = stmt.run(group.name);
    return result.lastInsertRowid as number;
  },

  update: (id: number, group: Partial<Group>): void => {
    const db = getDatabase();
    if (group.name !== undefined) {
      db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(group.name, id);
    }
  },

  delete: (id: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  },

  addContact: (groupId: number, contactId: number): void => {
    const db = getDatabase();
    db.prepare(
      'INSERT OR IGNORE INTO group_contacts (group_id, contact_id) VALUES (?, ?)'
    ).run(groupId, contactId);
  },

  removeContact: (groupId: number, contactId: number): void => {
    const db = getDatabase();
    db.prepare(
      'DELETE FROM group_contacts WHERE group_id = ? AND contact_id = ?'
    ).run(groupId, contactId);
  },

  getContacts: (groupId: number): Contact[] => {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT c.* FROM contacts c
      INNER JOIN group_contacts gc ON c.id = gc.contact_id
      WHERE gc.group_id = ?
    ORDER BY c.name
      `).all(groupId) as any[];

    return rows.map(row => ({
      ...row,
      variables: row.vars_json ? JSON.parse(row.vars_json) : undefined
    }));
  },

  bulkAddContactsToMultipleGroups: (groupIds: number[], contactIds: number[]): void => {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO group_contacts (group_id, contact_id) VALUES (?, ?)'
    );

    const transaction = db.transaction(() => {
      for (const groupId of groupIds) {
        for (const contactId of contactIds) {
          stmt.run(groupId, contactId);
        }
      }
    });

    transaction();
  },
  getAll(): Group[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM groups').all() as Group[];
  },
  deleteAll(): void {
    const db = getDatabase();
    db.prepare('DELETE FROM groups').run();
  },
};

export const campaigns = {
  list: (): Campaign[] => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM campaigns ORDER BY id DESC').all() as Campaign[];
  },

  getById: (id: number): Campaign | undefined => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign | undefined;
  },

  create: (campaign: Omit<Campaign, 'id'>): number => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO campaigns(
        name, status, message_template, group_id, delay_preset, delay_min, delay_max,
        template_image_path, template_image_name, template_image_size, template_image_type,
        sending_strategy, server_id, is_poll, poll_question, poll_options
      )
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      campaign.name,
      campaign.status || 'draft',
      campaign.message_template || null,
      campaign.group_id || null,
      campaign.delay_preset || null,
      campaign.delay_min || null,
      campaign.delay_max || null,
      campaign.template_image_path || null,
      campaign.template_image_name || null,
      campaign.template_image_size || null,
      campaign.template_image_type || null,
      campaign.sending_strategy || 'single',
      campaign.server_id || 1,
      campaign.is_poll ? 1 : 0,
      campaign.poll_question || null,
      campaign.poll_options || null
    );
    return result.lastInsertRowid as number;
  },

  update: (id: number, campaign: Partial<Campaign>): void => {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (campaign.name !== undefined) {
      fields.push('name = ?');
      values.push(campaign.name);
    }
    if (campaign.status !== undefined) {
      fields.push('status = ?');
      values.push(campaign.status);
    }
    if (campaign.message_template !== undefined) {
      fields.push('message_template = ?');
      values.push(campaign.message_template);
    }
    if (campaign.group_id !== undefined) {
      fields.push('group_id = ?');
      values.push(campaign.group_id);
    }
    if (campaign.delay_preset !== undefined) {
      fields.push('delay_preset = ?');
      values.push(campaign.delay_preset);
    }
    if (campaign.delay_min !== undefined) {
      fields.push('delay_min = ?');
      values.push(campaign.delay_min);
    }
    if (campaign.delay_max !== undefined) {
      fields.push('delay_max = ?');
      values.push(campaign.delay_max);
    }
    if (campaign.template_image_path !== undefined) {
      fields.push('template_image_path = ?');
      values.push(campaign.template_image_path);
    }
    if (campaign.template_image_name !== undefined) {
      fields.push('template_image_name = ?');
      values.push(campaign.template_image_name);
    }
    if (campaign.template_image_size !== undefined) {
      fields.push('template_image_size = ?');
      values.push(campaign.template_image_size);
    }
    if (campaign.template_image_type !== undefined) {
      fields.push('template_image_type = ?');
      values.push(campaign.template_image_type);
    }
    if (campaign.sent_count !== undefined) {
      fields.push('sent_count = ?');
      values.push(campaign.sent_count);
    }
    if (campaign.failed_count !== undefined) {
      fields.push('failed_count = ?');
      values.push(campaign.failed_count);
    }
    if (campaign.total_count !== undefined) {
      fields.push('total_count = ?');
      values.push(campaign.total_count);
    }
    if (campaign.started_at !== undefined) {
      fields.push('started_at = ?');
      values.push(campaign.started_at);
    }
    if (campaign.completed_at !== undefined) {
      fields.push('completed_at = ?');
      values.push(campaign.completed_at);
    }
    if (campaign.sending_strategy !== undefined) {
      fields.push('sending_strategy = ?');
      values.push(campaign.sending_strategy);
    }
    if (campaign.server_id !== undefined) {
      fields.push('server_id = ?');
      values.push(campaign.server_id);
    }
    if (campaign.is_poll !== undefined) {
      fields.push('is_poll = ?');
      values.push(campaign.is_poll ? 1 : 0);
    }
    if (campaign.poll_question !== undefined) {
      fields.push('poll_question = ?');
      values.push(campaign.poll_question);
    }
    if (campaign.poll_options !== undefined) {
      fields.push('poll_options = ?');
      values.push(campaign.poll_options);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(
      `UPDATE campaigns SET ${fields.join(', ')} WHERE id = ? `
    );
    stmt.run(...values);
  },


  updateProgress: (id: number, sentCount: number, failedCount: number, status?: string): void => {
    const db = getDatabase();
    if (status === 'completed') {
      // Set completed_at timestamp when campaign is completed
      const now = new Date().toISOString();
      db.prepare('UPDATE campaigns SET sent_count = ?, failed_count = ?, status = ?, completed_at = ? WHERE id = ?')
        .run(sentCount, failedCount, status, now, id);

      // Also update the active run
      db.prepare('UPDATE campaign_runs SET sent_count = ?, failed_count = ?, status = ?, completed_at = ? WHERE campaign_id = ? AND status = \'running\'')
        .run(sentCount, failedCount, status, now, id);

    } else if (status) {
      db.prepare('UPDATE campaigns SET sent_count = ?, failed_count = ?, status = ? WHERE id = ?')
        .run(sentCount, failedCount, status, id);

      // Also update the active run
      db.prepare('UPDATE campaign_runs SET sent_count = ?, failed_count = ?, status = ? WHERE campaign_id = ? AND status = \'running\'')
        .run(sentCount, failedCount, status, id);

    } else {
      db.prepare('UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?')
        .run(sentCount, failedCount, id);

      // Also update the active run
      db.prepare('UPDATE campaign_runs SET sent_count = ?, failed_count = ? WHERE campaign_id = ? AND status = \'running\'')
        .run(sentCount, failedCount, id);
    }
  },

  delete: (id: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  },

  addContact: (campaignId: number, contactId: number): void => {
    const db = getDatabase();
    db.prepare(
      'INSERT OR IGNORE INTO campaign_contacts (campaign_id, contact_id) VALUES (?, ?)'
    ).run(campaignId, contactId);
  },

  addContacts: (campaignId: number, contactIds: number[]): void => {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO campaign_contacts (campaign_id, contact_id) VALUES (?, ?)'
    );
    const transaction = db.transaction((ids: number[]) => {
      for (const contactId of ids) {
        stmt.run(campaignId, contactId);
      }
    });
    transaction(contactIds);
  },

  removeContact: (campaignId: number, contactId: number): void => {
    const db = getDatabase();
    db.prepare(
      'DELETE FROM campaign_contacts WHERE campaign_id = ? AND contact_id = ?'
    ).run(campaignId, contactId);
  },

  clearContacts: (campaignId: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM campaign_contacts WHERE campaign_id = ?').run(campaignId);
  },

  getContacts: (campaignId: number): Contact[] => {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT c.* FROM contacts c
      INNER JOIN campaign_contacts cc ON c.id = cc.contact_id
      WHERE cc.campaign_id = ?
    ORDER BY c.name
      `).all(campaignId) as Contact[];
    return rows.map(row => ({
      ...row,
      variables: row.vars_json ? JSON.parse(row.vars_json) : undefined
    }));
  },
};

export const campaignMedia = {
  listByCampaign: (campaignId: number): CampaignMedia[] => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM campaign_media WHERE campaign_id = ? ORDER BY created_at')
      .all(campaignId) as CampaignMedia[];
  },

  create: (media: Omit<CampaignMedia, 'created_at'>): void => {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO campaign_media(
        id, campaign_id, file_name, file_type, file_size, file_data, file_path, caption
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
      media.id,
      media.campaign_id,
      media.file_name,
      media.file_type,
      media.file_size,
      media.file_data || null,
      media.file_path || null,
      media.caption || null
    );
  },

  delete: (id: string): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM campaign_media WHERE id = ?').run(id);
  },

  deleteAll: (campaignId: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM campaign_media WHERE campaign_id = ?').run(campaignId);
  },
};

export const logs = {
  list: (limit?: number): LogEntry[] => {
    const db = getDatabase();
    const sql = limit
      ? 'SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM logs ORDER BY timestamp DESC';
    const rows = limit
      ? db.prepare(sql).all(limit) as LogEntry[]
      : db.prepare(sql).all() as LogEntry[];
    return rows;
  },

  create: (log: Omit<LogEntry, 'id'>): number => {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO logs (timestamp, level, category, message, data) VALUES (?, ?, ?, ?, ?)'
    );
    const dataStr = log.data ? (typeof log.data === 'string' ? log.data : JSON.stringify(log.data)) : null;
    const result = stmt.run(
      log.timestamp,
      log.level,
      log.category,
      log.message,
      dataStr
    );
    return result.lastInsertRowid as number;
  },

  clear: (): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM logs').run();
  },

  deleteOld: (daysToKeep: number): number => {
    const db = getDatabase();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const result = db.prepare('DELETE FROM logs WHERE timestamp < ?').run(cutoffTime);
    return result.changes;
  },
};

export type CampaignMessage = {
  id: string;
  campaign_id: number;
  contact_id?: number;
  recipient_number: string;
  recipient_name?: string;
  template_text: string;
  resolved_text?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at?: string;
  updated_at?: string;
};

export const campaignMessages = {
  create: (message: Omit<CampaignMessage, 'created_at' | 'updated_at'>): void => {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO campaign_messages(
          id, campaign_id, contact_id, recipient_number, recipient_name,
          template_text, resolved_text, status
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
      message.id,
      message.campaign_id,
      message.contact_id || null,
      message.recipient_number,
      message.recipient_name || null,
      message.template_text,
      message.resolved_text || null,
      message.status
    );
  },

  updateStatus: (messageId: string, status: 'sent' | 'failed', error?: string): void => {
    const db = getDatabase();
    console.log(`[DB] Updating status for msg ${messageId} to ${status}. Error: ${error}`);
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (error) {
      updateData.error_message = error;
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    values.push(messageId);

    const result = db.prepare(`
      UPDATE campaign_messages
      SET ${fields.map(f => `${f} = ?`).join(', ')}
      WHERE id = ?
    `).run(...values);
    console.log(`[DB] Update result: ${result.changes} changes`);
  },

  getByCampaign: (campaignId: number): CampaignMessage[] => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM campaign_messages WHERE campaign_id = ? ORDER BY created_at')
      .all(campaignId) as CampaignMessage[];
  },

  getStats: (campaignId: number): { sent: number; failed: number; pending: number } => {
    const db = getDatabase();
    const messages = db.prepare('SELECT status FROM campaign_messages WHERE campaign_id = ?')
      .all(campaignId) as { status: string }[];

    return {
      sent: messages.filter(m => m.status === 'sent').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length,
    };
  },

  getFailedMessages: (campaignId: number): any[] => {
    const db = getDatabase();
    return db.prepare(`
      SELECT recipient_number, recipient_name, error_message, updated_at
      FROM campaign_messages 
      WHERE campaign_id = ? AND status = 'failed'
      ORDER BY updated_at DESC
    `).all(campaignId) as any[];
  },

  deleteAll: (campaignId: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM campaign_messages WHERE campaign_id = ?').run(campaignId);
  },
};

// Campaign Runs - tracks each individual execution of a campaign
export const campaignRuns = {
  create: (campaignId: number, campaignName: string, totalCount: number): number => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO campaign_runs(campaign_id, campaign_name, started_at, status, total_count)
  VALUES(?, ?, ?, 'running', ?)
    `);
    const result = stmt.run(campaignId, campaignName, new Date().toISOString(), totalCount);
    console.log('[Sambad DB] Campaign run created:', result.lastInsertRowid);
    return result.lastInsertRowid as number;
  },

  update: (runId: number, sentCount: number, failedCount: number, status?: string): void => {
    const db = getDatabase();
    if (status === 'completed') {
      db.prepare('UPDATE campaign_runs SET sent_count = ?, failed_count = ?, status = ?, completed_at = ? WHERE id = ?')
        .run(sentCount, failedCount, status, new Date().toISOString(), runId);
    } else if (status) {
      db.prepare('UPDATE campaign_runs SET sent_count = ?, failed_count = ?, status = ? WHERE id = ?')
        .run(sentCount, failedCount, status, runId);
    } else {
      db.prepare('UPDATE campaign_runs SET sent_count = ?, failed_count = ? WHERE id = ?')
        .run(sentCount, failedCount, runId);
    }
  },

  list: (): any[] => {
    const db = getDatabase();
    return db.prepare(`
  SELECT * FROM campaign_runs ORDER BY started_at DESC
    `).all() as any[];
  },

  listByCampaign: (campaignId: number): any[] => {
    const db = getDatabase();
    return db.prepare(`
  SELECT * FROM campaign_runs WHERE campaign_id = ? ORDER BY started_at DESC
    `).all(campaignId) as any[];
  },

  getById: (runId: number): any => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM campaign_runs WHERE id = ?').get(runId);
  },

  addMessage: (runId: number, recipientNumber: string, recipientName: string, status: string, errorMessage?: string): void => {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO campaign_run_messages(run_id, recipient_number, recipient_name, status, error_message, sent_at)
  VALUES(?, ?, ?, ?, ?, ?)
    `).run(runId, recipientNumber, recipientName || 'Unknown', status, errorMessage || null, new Date().toISOString());
  },

  getFailedMessages: (runId: number): any[] => {
    const db = getDatabase();
    return db.prepare(`
      SELECT recipient_number, recipient_name, error_message, sent_at
      FROM campaign_run_messages
      WHERE run_id = ? AND status = 'failed'
      ORDER BY sent_at DESC
    `).all(runId) as any[];
  },

  delete: (runId: number): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM campaign_runs WHERE id = ?').run(runId);
  },
};

export const reports = {
  generate: (): any => {
    const db = getDatabase();
    const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number };
    const totalCampaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number };
    const messageStats = db.prepare(`
  SELECT
  COUNT(*) as total,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM campaign_messages
    `).get() as { total: number, sent: number, failed: number };

    const successRate = messageStats.total ? (messageStats.sent / messageStats.total) * 100 : 0;

    return {
      totalContacts: totalContacts.count,
      totalCampaigns: totalCampaigns.count,
      messagesSent: messageStats.sent,
      messagesFailed: messageStats.failed,
      successRate
    };
  },

  getFailedMessages: (campaignId: number): any[] => {
    const db = getDatabase();
    console.log(`[DB] getFailedMessages called for campaignId: ${campaignId}`);
    const results = db.prepare(`
      SELECT recipient_number, recipient_name, error_message, updated_at
      FROM campaign_messages
      WHERE campaign_id = ? AND status = 'failed'
      ORDER BY updated_at DESC
    `).all(campaignId) as any[];
    console.log(`[DB] getFailedMessages found ${results.length} rows`);
    return results;
  },
};

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[Sambad DB] Database closed');
  }
}

// ==================== Poll Results Functions ====================

export function createPollResult(campaignId: number, messageId: string, question: string, options: string[]): { success: boolean; error?: string } {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    const stmt = db.prepare(`
      INSERT INTO poll_results (campaign_id, message_id, poll_question, poll_options)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(campaignId, messageId, question, JSON.stringify(options));
    return { success: true };
  } catch (error: any) {
    console.error('[Sambad DB] Failed to create poll result:', error);
    return { success: false, error: error.message };
  }
}

export function storePollVote(messageId: string, voterJid: string, voterName: string, voterPhone: string, selectedOption: string): { success: boolean; error?: string } {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    console.log(`[Sambad DB] Attempting to store vote for msg=${messageId} from=${voterJid} phone=${voterPhone}`);

    // Verify message exists (case-insensitive) and get campaign_id
    let msg = db.prepare('SELECT id, campaign_id FROM campaign_messages WHERE LOWER(id) = LOWER(?)').get(messageId) as any;

    if (!msg) {
      console.warn(`[Sambad DB] Msg ${messageId} not found by ID. Trying phone search for ${voterPhone}...`);
      // Fallback: Find latest message to this phone number (last 10 digits)
      const phoneSuffix = voterPhone.slice(-10);
      try {
        msg = db.prepare(`
                SELECT id, campaign_id 
                FROM campaign_messages 
                WHERE SUBSTR(REPLACE(REPLACE(REPLACE(recipient_number, '+', ''), ' ', ''), '-', ''), -10) = ?
                ORDER BY created_at DESC 
                LIMIT 1
            `).get(phoneSuffix) as any;
      } catch (e) {
        console.error('[Sambad DB] Fallback search failed:', e);
      }
    }

    if (!msg) {
      console.error(`[Sambad DB] Poll vote error: Message ${messageId} not found in campaign_messages (checked case-insensitive)`);
      return { success: false, error: 'Message not found' };
    }

    // Find poll_result via campaign
    const stmt = db.prepare(`
      INSERT INTO poll_votes (poll_result_id, voter_jid, voter_name, voter_phone, selected_option, voted_at, updated_at)
      SELECT pr.id, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
      FROM poll_results pr
      WHERE pr.campaign_id = ?
      ON CONFLICT(poll_result_id, voter_jid) 
      DO UPDATE SET 
        selected_option = excluded.selected_option,
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(voterJid, voterName, voterPhone, selectedOption, msg.campaign_id);

    if (result.changes === 0) {
      console.error(`[Sambad DB] Poll vote insertion failed. No poll_result found for campaign ${msg.campaign_id}`);
    } else {
      console.log(`[Sambad DB] Poll vote stored/updated. Changes: ${result.changes}`);
    }

    // Update total votes count
    db.prepare(`
      UPDATE poll_results 
      SET total_votes = (
        SELECT COUNT(DISTINCT voter_jid) 
        FROM poll_votes 
        WHERE poll_result_id = poll_results.id
      )
      WHERE campaign_id = ?
    `).run(msg.campaign_id);

    return { success: true };
  } catch (error: any) {
    console.error('[Sambad DB] Failed to store poll vote:', error);
    return { success: false, error: error.message };
  }
}

export function getPollVotes(campaignId: number): { success: boolean; data?: any[]; error?: string } {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    const votes = db.prepare(`
      SELECT DISTINCT
        cm.recipient_name as name,
        cm.recipient_number as phone,
        COALESCE(pv.selected_option, '') as selected_option,
        pv.voted_at
      FROM campaign_messages cm
      LEFT JOIN poll_results pr ON pr.campaign_id = cm.campaign_id
      LEFT JOIN poll_votes pv ON pv.poll_result_id = pr.id
        AND SUBSTR(REPLACE(REPLACE(REPLACE(cm.recipient_number, '+', ''), ' ', ''), '-', ''), -10) = SUBSTR(REPLACE(REPLACE(REPLACE(pv.voter_phone, '+', ''), ' ', ''), '-', ''), -10)
      WHERE cm.campaign_id = ?
      GROUP BY cm.recipient_number -- Ensure one row per recipient
      ORDER BY cm.recipient_name
    `).all(campaignId);

    return { success: true, data: votes as any[] };
  } catch (error: any) {
    console.error('[Sambad DB] Failed to get poll votes:', error);
    return { success: false, error: error.message };
  }
}

export function getPollSummary(campaignId: number): { success: boolean; data?: any; error?: string } {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    const summary = db.prepare(`
      SELECT
        pr.poll_question,
        pr.poll_options,
        pr.total_votes,
        COUNT(DISTINCT cm.id) as total_sent
      FROM poll_results pr
      LEFT JOIN campaign_messages cm ON cm.campaign_id = pr.campaign_id
      WHERE pr.campaign_id = ?
      ORDER BY pr.created_at DESC -- Use the most recent poll result definition if duplicates exist
      LIMIT 1
    `).get(campaignId);

    if (!summary) {
      return { success: false, error: 'Poll not found' };
    }

    const voteBreakdown = db.prepare(`
      SELECT
        pv.selected_option,
        COUNT(*) as count
      FROM poll_votes pv
      JOIN poll_results pr ON pr.id = pv.poll_result_id
      WHERE pr.campaign_id = ?
      GROUP BY pv.selected_option
    `).all(campaignId);

    return {
      success: true,
      data: {
        ...summary,
        voteBreakdown
      }
    };
  } catch (error: any) {
    console.error('[Sambad DB] Failed to get poll summary:', error);
    return { success: false, error: error.message };
  }
}

export function getPollServerStats(campaignId: number): { success: boolean; data?: any[]; error?: string } {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    const stats = db.prepare(`
      SELECT
        cm.server_id,
        COUNT(DISTINCT cm.id) as total_sent,
        COUNT(DISTINCT CASE WHEN pv.id IS NOT NULL THEN cm.id END) as total_voted
      FROM campaign_messages cm
      LEFT JOIN poll_results pr ON pr.campaign_id = cm.campaign_id
      LEFT JOIN poll_votes pv ON pv.poll_result_id = pr.id
        AND SUBSTR(REPLACE(REPLACE(REPLACE(cm.recipient_number, '+', ''), ' ', ''), '-', ''), -10) = SUBSTR(REPLACE(REPLACE(REPLACE(pv.voter_phone, '+', ''), ' ', ''), '-', ''), -10)
      WHERE cm.campaign_id = ?
      GROUP BY cm.server_id
      ORDER BY cm.server_id
    `).all(campaignId);

    return { success: true, data: stats as any[] };
  } catch (error: any) {
    console.error('[Sambad DB] Failed to get poll server stats:', error);
    return { success: false, error: error.message };
  }
}

// ==================== Campaign Message Functions ====================

export function createCampaignMessage(
  campaignId: number,
  messageId: string,
  recipientNumber: string,
  recipientName: string | undefined,
  templateText: string,
  status: 'pending' | 'sent' | 'failed',
  serverId: number,
  errorMessage?: string
): void {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
        INSERT INTO campaign_messages (
          id, campaign_id, recipient_number, recipient_name, template_text, status, server_id, error_message, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

    stmt.run(
      messageId,
      campaignId,
      recipientNumber,
      recipientName || null,
      templateText,
      status,
      serverId,
      errorMessage || null,
      status === 'sent' ? new Date().toISOString() : null
    );
  } catch (error) {
    console.error(`[Sambad DB] Failed to create campaign message: ${error}`);
  }
}

export function updateCampaignMessageStatus(
  messageId: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): void {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
        UPDATE campaign_messages 
        SET status = ?, error_message = ?, sent_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

    // sent_at is only updated if status is 'sent'
    stmt.run(
      status,
      errorMessage || null,
      status === 'sent' ? new Date().toISOString() : null,
      messageId
    );
  } catch (error) {
    console.error(`[Sambad DB] Failed to update campaign message status: ${error}`);
  }
}
