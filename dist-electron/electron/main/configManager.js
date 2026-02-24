import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
const CONFIG_FILE_NAME = 'sambad-supabase.json';
function getConfigPath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, CONFIG_FILE_NAME);
}
function simpleEncrypt(text) {
    return Buffer.from(text).toString('base64');
}
function simpleDecrypt(encoded) {
    return Buffer.from(encoded, 'base64').toString('utf8');
}
export function hasSupabaseConfig() {
    try {
        const configPath = getConfigPath();
        return fs.existsSync(configPath);
    }
    catch (error) {
        console.error('[Sambad] Error checking Supabase config:', error);
        return false;
    }
}
export function loadSupabaseConfig() {
    try {
        const configPath = getConfigPath();
        if (!fs.existsSync(configPath)) {
            console.log('[Sambad] No Supabase configuration found');
            return null;
        }
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        if (config.supabase_url && config.supabase_key) {
            return {
                supabase_url: simpleDecrypt(config.supabase_url),
                supabase_key: simpleDecrypt(config.supabase_key),
                saved_at: config.saved_at,
                app_version: config.app_version,
            };
        }
        return null;
    }
    catch (error) {
        console.error('[Sambad] Error loading Supabase configuration:', error);
        return null;
    }
}
// --- Production Fallback Credentials (SENTINEL) ---
// These allow the app to validate licenses on any machine without a local .env file.
const PROD_SUPABASE_URL = 'https://kvodngfdwbinnojowtdt.supabase.co';
const PROD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b2RuZ2Zkd2Jpbm5vam93dGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjEwNTMsImV4cCI6MjA4NDU5NzA1M30.XO-0MRsiAMIwW1PI03tufJIZiNPFcOBCvB9ZLdiJOQk';
export function getSentinelConfig() {
    // 1. Try loaded config (User specified) - NOT for Sentinel usually, but maybe overrides?
    // Actually, Sentinel should ALWAYS check the master server.
    // So we prioritize Env (Dev) -> Hardcoded (Prod)
    // In Dev, process.env works
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        return {
            url: process.env.VITE_SUPABASE_URL,
            key: process.env.VITE_SUPABASE_ANON_KEY
        };
    }
    // In Prod (missing .env), use Hardcoded
    return {
        url: PROD_SUPABASE_URL,
        key: PROD_SUPABASE_KEY
    };
}
export function saveSupabaseConfig(supabaseUrl, supabaseKey) {
    try {
        const configPath = getConfigPath();
        const userDataPath = app.getPath('userData');
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        const config = {
            supabase_url: simpleEncrypt(supabaseUrl),
            supabase_key: simpleEncrypt(supabaseKey),
            saved_at: new Date().toISOString(),
            app_version: app.getVersion(),
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log('[Sambad] Supabase configuration saved successfully');
        return true;
    }
    catch (error) {
        console.error('[Sambad] Error saving Supabase configuration:', error);
        return false;
    }
}
export function clearSupabaseConfig() {
    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
            console.log('[Sambad] Supabase configuration cleared');
        }
        return true;
    }
    catch (error) {
        console.error('[Sambad] Error clearing Supabase configuration:', error);
        return false;
    }
}
export function validateSupabaseCredentials(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || supabaseUrl.trim().length === 0) {
        return { valid: false, error: 'Supabase URL is required' };
    }
    if (!supabaseKey || supabaseKey.trim().length === 0) {
        return { valid: false, error: 'Supabase API Key is required' };
    }
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
        return { valid: false, error: 'Supabase URL must start with http:// or https://' };
    }
    if (supabaseKey.length < 20) {
        return { valid: false, error: 'Supabase API Key format is invalid (too short)' };
    }
    return { valid: true };
}
export function getSupabaseStatus() {
    const config = loadSupabaseConfig();
    if (!config) {
        return { configured: false };
    }
    return {
        configured: true,
        supabaseUrl: config.supabase_url,
        savedAt: config.saved_at,
    };
}
//# sourceMappingURL=configManager.js.map