import * as db from './db/index.js';
import crypto from 'crypto';
export class UserService {
    static instance;
    static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }
    async login(username, password) {
        const sqlite = db.getDatabase();
        const user = sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        const hash = this.hashPassword(password);
        if (user.password_hash !== hash) {
            return { success: false, message: 'Invalid password' };
        }
        const permissions = this.getPermissions(user.id);
        return { success: true, data: { ...user, permissions } };
    }
    async listUsers() {
        const sqlite = db.getDatabase();
        return sqlite.prepare('SELECT id, username, role FROM users').all();
    }
    async createUser(username, password, role) {
        const sqlite = db.getDatabase();
        const hash = this.hashPassword(password);
        const result = sqlite.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
            .run(username, hash, role);
        return result.lastInsertRowid;
    }
    getPermissions(userId) {
        const sqlite = db.getDatabase();
        const rows = sqlite.prepare('SELECT * FROM staff_permissions WHERE user_id = ?').all(userId);
        return rows.map(row => ({
            module_name: row.module_name,
            can_create: row.can_create === 1,
            can_read: row.can_read === 1,
            can_update: row.can_update === 1,
            can_delete: row.can_delete === 1,
            hide_mobile: row.hide_mobile === 1
        }));
    }
    async setPermissions(userId, permissions) {
        const sqlite = db.getDatabase();
        const deleteStmt = sqlite.prepare('DELETE FROM staff_permissions WHERE user_id = ?');
        const insertStmt = sqlite.prepare(`
      INSERT INTO staff_permissions 
      (user_id, module_name, can_create, can_read, can_update, can_delete, hide_mobile)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        sqlite.transaction(() => {
            deleteStmt.run(userId);
            for (const p of permissions) {
                insertStmt.run(userId, p.module_name || p.module, p.can_create ? 1 : 0, p.can_read ? 1 : 0, p.can_update ? 1 : 0, p.can_delete ? 1 : 0, p.hide_mobile ? 1 : 0);
            }
        })();
    }
    // Masking utility for STAFF users
    maskMobile(mobile) {
        if (!mobile)
            return '';
        return '**********';
    }
    async updatePassword(userId, newPassword) {
        const sqlite = db.getDatabase();
        const hash = this.hashPassword(newPassword);
        const result = sqlite.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
        if (result.changes === 0) {
            throw new Error('User not found');
        }
    }
    async updateUsername(userId, newUsername) {
        const sqlite = db.getDatabase();
        // Check availability
        const existing = sqlite.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(newUsername, userId);
        if (existing) {
            throw new Error('Username already taken');
        }
        const result = sqlite.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, userId);
        if (result.changes === 0) {
            throw new Error('User not found');
        }
    }
    async deleteUser(userId) {
        const sqlite = db.getDatabase();
        sqlite.prepare('DELETE FROM users WHERE id = ?').run(userId);
    }
}
export const userService = UserService.getInstance();
//# sourceMappingURL=userService.js.map