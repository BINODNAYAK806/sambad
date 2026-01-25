import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class WhatsAppSession {
    private static SESSION_DIR_NAME = 'whatsapp-session';
    private static SESSION_FOLDER_PREFIX = 'session-';

    public static getSessionPath(): string {
        // This is tricky. LocalAuth takes dataPath (userData) and clientId (whatsapp-session).
        // It creates: userData/session-whatsapp-session
        // But Puppeteer userDataDir will be set to: userData/session-whatsapp-session
        // So we should return THAT full path for external checks.
        return path.join(app.getPath('userData'), this.SESSION_FOLDER_PREFIX + this.SESSION_DIR_NAME);
    }

    public static hasSession(): boolean {
        const sessionPath = this.getSessionPath();
        try {
            return fs.existsSync(sessionPath) && fs.readdirSync(sessionPath).length > 0;
        } catch (e) {
            return false;
        }
    }

    public static clearSession() {
        const sessionPath = this.getSessionPath();
        if (fs.existsSync(sessionPath)) {
            console.log('[WA] Clearing session directory...');
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('[WA] Session cleared');
            } catch (error) {
                console.error('[WA] Failed to clear session:', error);
            }
        }
    }
}
