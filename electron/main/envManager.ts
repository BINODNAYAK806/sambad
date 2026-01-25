import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

class EnvironmentManager {
  private credentialsPath: string;
  private legacyEnvPath: string;
  private credentials: SupabaseCredentials | null = null;
  private encryptionAvailable: boolean = false;

  constructor() {
    this.credentialsPath = path.join(app.getPath('userData'), '.sambad-credentials');
    this.legacyEnvPath = path.join(app.getPath('userData'), '.env');

    app.whenReady().then(() => {
      this.encryptionAvailable = safeStorage.isEncryptionAvailable();
      console.log('[EnvManager] Encryption available:', this.encryptionAvailable);
      this.loadCredentials();
      this.migrateLegacyCredentials();
    });
  }

  private migrateLegacyCredentials(): void {
    try {
      if (fs.existsSync(this.legacyEnvPath) && !fs.existsSync(this.credentialsPath)) {
        console.log('[EnvManager] Migrating legacy plain-text credentials to encrypted storage');
        const envContent = fs.readFileSync(this.legacyEnvPath, 'utf-8');
        const lines = envContent.split('\n');

        let url = '';
        let anonKey = '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('VITE_SUPABASE_URL=')) {
            url = trimmedLine.split('=')[1]?.trim() || '';
          } else if (trimmedLine.startsWith('VITE_SUPABASE_ANON_KEY=')) {
            anonKey = trimmedLine.split('=')[1]?.trim() || '';
          }
        }

        if (url && anonKey) {
          this.saveCredentials(url, anonKey);
          fs.unlinkSync(this.legacyEnvPath);
          console.log('[EnvManager] Migration completed, legacy file removed');
        }
      }
    } catch (error) {
      console.error('[EnvManager] Error migrating legacy credentials:', error);
    }
  }

  private loadCredentials(): void {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        const encryptedData = fs.readFileSync(this.credentialsPath);

        if (!this.encryptionAvailable) {
          console.warn('[EnvManager] Encryption not available, cannot load credentials');
          return;
        }

        const decryptedString = safeStorage.decryptString(encryptedData);
        const parsed = JSON.parse(decryptedString);

        if (parsed.url && parsed.anonKey) {
          this.credentials = { url: parsed.url, anonKey: parsed.anonKey };
          process.env.VITE_SUPABASE_URL = parsed.url;
          process.env.VITE_SUPABASE_ANON_KEY = parsed.anonKey;
          console.log('[EnvManager] Encrypted credentials loaded successfully');
        } else {
          console.log('[EnvManager] Credentials file exists but is incomplete');
        }
      } else {
        console.log('[EnvManager] No credentials file found at:', this.credentialsPath);
      }
    } catch (error) {
      console.error('[EnvManager] Error loading credentials:', error);
    }
  }

  getCredentials(): SupabaseCredentials | null {
    return this.credentials;
  }

  hasCredentials(): boolean {
    return this.credentials !== null &&
           this.credentials.url.length > 0 &&
           this.credentials.anonKey.length > 0;
  }

  validateCredentials(url: string, anonKey: string): { valid: boolean; error?: string } {
    if (!url || url.trim().length === 0) {
      return { valid: false, error: 'Supabase URL is required' };
    }

    if (!anonKey || anonKey.trim().length === 0) {
      return { valid: false, error: 'Supabase API Key is required' };
    }

    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('supabase.co')) {
        return { valid: false, error: 'Invalid Supabase URL format. Must be a supabase.co domain' };
      }
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }

    if (anonKey.length < 50) {
      return { valid: false, error: 'API Key appears to be invalid (too short)' };
    }

    return { valid: true };
  }

  async saveCredentials(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
    const validation = this.validateCredentials(url, anonKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (!this.encryptionAvailable) {
      return {
        success: false,
        error: 'Encryption not available on this system. Cannot store credentials securely.'
      };
    }

    try {
      const credentialsData = JSON.stringify({ url, anonKey });
      const encryptedData = safeStorage.encryptString(credentialsData);

      const userDataDir = app.getPath('userData');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      fs.writeFileSync(this.credentialsPath, encryptedData);

      this.credentials = { url, anonKey };
      process.env.VITE_SUPABASE_URL = url;
      process.env.VITE_SUPABASE_ANON_KEY = anonKey;

      console.log('[EnvManager] Encrypted credentials saved successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EnvManager] Error saving credentials:', errorMessage);
      return { success: false, error: `Failed to save credentials: ${errorMessage}` };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.hasCredentials()) {
      return { success: false, error: 'No credentials configured' };
    }

    try {
      const { url, anonKey } = this.credentials!;

      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      });

      if (response.ok || response.status === 404) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Connection failed with status ${response.status}`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Connection test failed: ${errorMessage}`
      };
    }
  }

  clearCredentials(): void {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        fs.unlinkSync(this.credentialsPath);
      }
      if (fs.existsSync(this.legacyEnvPath)) {
        fs.unlinkSync(this.legacyEnvPath);
      }
      this.credentials = null;
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;
      console.log('[EnvManager] Credentials cleared');
    } catch (error) {
      console.error('[EnvManager] Error clearing credentials:', error);
    }
  }

  isEncryptionAvailable(): boolean {
    return this.encryptionAvailable;
  }
}

export const envManager = new EnvironmentManager();
