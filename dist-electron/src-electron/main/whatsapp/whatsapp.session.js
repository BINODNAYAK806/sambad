"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppSession = void 0;
const { app } = require('electron');
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class WhatsAppSession {
    static SESSION_DIR_NAME = 'whatsapp-session';
    static SESSION_FOLDER_PREFIX = 'session-';
    static getSessionPath() {
        // This is tricky. LocalAuth takes dataPath (userData) and clientId (whatsapp-session).
        // It creates: userData/session-whatsapp-session
        // But Puppeteer userDataDir will be set to: userData/session-whatsapp-session
        // So we should return THAT full path for external checks.
        return path.join(app.getPath('userData'), this.SESSION_FOLDER_PREFIX + this.SESSION_DIR_NAME);
    }
    static hasSession() {
        const sessionPath = this.getSessionPath();
        try {
            return fs.existsSync(sessionPath) && fs.readdirSync(sessionPath).length > 0;
        }
        catch (e) {
            return false;
        }
    }
    static clearSession() {
        const sessionPath = this.getSessionPath();
        if (fs.existsSync(sessionPath)) {
            console.log('[WA] Clearing session directory...');
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('[WA] Session cleared');
            }
            catch (error) {
                console.error('[WA] Failed to clear session:', error);
            }
        }
    }
}
exports.WhatsAppSession = WhatsAppSession;
//# sourceMappingURL=whatsapp.session.js.map