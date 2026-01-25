/**
 * Hybrid Storage Service
 *
 * This service implements a production-ready, hybrid storage architecture:
 *
 * 1. LOCAL STORAGE (SQLite in userData):
 *    - WhatsApp session data (.wwebjs_auth folder)
 *    - Application logs and error logs
 *    - Fallback storage when offline
 *
 * 2. CLOUD STORAGE (Supabase):
 *    - Contacts (phone, name, variables)
 *    - Groups and group memberships
 *    - Campaigns and campaign messages
 *    - Analytics and reports
 *
 * Security: Session data NEVER leaves the local machine.
 * Business data is synced to cloud for multi-device access.
 */
import { createClient } from '@supabase/supabase-js';
import { ErrorLogger } from './errorLogger.js';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as db from './db/index.js';
export class StorageService {
    supabase = null;
    mode = 'local';
    localDb = null;
    constructor(config) {
        if (config) {
            this.initialize(config);
        }
    }
    initialize(config) {
        this.mode = config.mode;
        // Try to initialize local database for fallback
        try {
            this.localDb = db.initDatabase();
            if (this.localDb) {
                ErrorLogger.info('[Storage] Local SQLite database initialized');
            }
            else {
                ErrorLogger.warn('[Storage] Local database not available (better-sqlite3 not installed)');
            }
        }
        catch (error) {
            ErrorLogger.error('[Storage] Failed to initialize local database', error);
            if (this.mode === 'local') {
                throw error;
            }
            // Continue with cloud-only mode
        }
        // Initialize Supabase if credentials are provided (optional now)
        if (config.supabaseUrl && config.supabaseKey) {
            try {
                this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
                ErrorLogger.info('[Storage] Supabase client initialized (optional mode)', { mode: this.mode });
            }
            catch (error) {
                ErrorLogger.error('[Storage] Failed to initialize Supabase', error);
                this.supabase = null;
            }
        }
    }
    getMode() {
        return this.mode;
    }
    isCloudAvailable() {
        return this.supabase !== null;
    }
    /**
     * CONTACTS - Always use cloud when available, fallback to local
     */
    async getContacts() {
        try {
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('contacts')
                    .select('*')
                    .order('name');
                if (error)
                    throw error;
                ErrorLogger.debug('[Storage] Retrieved contacts from cloud', { count: data.length });
                return data || [];
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud fetch failed, using local fallback', error);
        }
        // Local fallback
        if (!this.localDb) {
            ErrorLogger.error('[Storage] No storage available (cloud failed and local DB not initialized)');
            return [];
        }
        const contacts = db.contacts.list();
        ErrorLogger.debug('[Storage] Retrieved contacts from local DB', { count: contacts.length });
        return contacts;
    }
    async createContact(contact) {
        const varsJson = contact.variables ? JSON.stringify(contact.variables) : undefined;
        try {
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('contacts')
                    .insert({
                    phone: contact.phone,
                    name: contact.name,
                    vars_json: varsJson,
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                ErrorLogger.info('[Storage] Contact created in cloud', { phone: contact.phone });
                return data;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud create failed, using local fallback', error);
        }
        // Local fallback
        const id = db.contacts.create({
            phone: contact.phone,
            name: contact.name,
            vars_json: varsJson,
        });
        ErrorLogger.info('[Storage] Contact created locally', { id, phone: contact.phone });
        return { id, ...contact };
    }
    async updateContact(id, updates) {
        try {
            if (this.isCloudAvailable()) {
                const updateData = {};
                if (updates.phone)
                    updateData.phone = updates.phone;
                if (updates.name)
                    updateData.name = updates.name;
                if (updates.variables)
                    updateData.vars_json = JSON.stringify(updates.variables);
                const { error } = await this.supabase
                    .from('contacts')
                    .update(updateData)
                    .eq('id', id);
                if (error)
                    throw error;
                ErrorLogger.info('[Storage] Contact updated in cloud', { id });
                return;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud update failed, using local fallback', error);
        }
        // Local fallback
        db.contacts.update(id, updates);
        ErrorLogger.info('[Storage] Contact updated locally', { id });
    }
    async deleteContact(id) {
        try {
            if (this.isCloudAvailable()) {
                const { error } = await this.supabase
                    .from('contacts')
                    .delete()
                    .eq('id', id);
                if (error)
                    throw error;
                ErrorLogger.info('[Storage] Contact deleted from cloud', { id });
                return;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud delete failed, using local fallback', error);
        }
        // Local fallback
        db.contacts.delete(id);
        ErrorLogger.info('[Storage] Contact deleted locally', { id });
    }
    async addContact(contact) {
        try {
            await this.createContact(contact);
            return true;
        }
        catch (error) {
            console.error('[Storage] addContact failed:', error);
            return false;
        }
    }
    /**
     * GROUPS - Cloud with local fallback
     */
    async getGroups() {
        try {
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('groups')
                    .select('*')
                    .order('name');
                if (error)
                    throw error;
                return data || [];
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud fetch failed for groups', error);
        }
        return db.groups.list();
    }
    async createGroup(group) {
        try {
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('groups')
                    .insert({ name: group.name })
                    .select()
                    .single();
                if (error)
                    throw error;
                return data;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud create failed for group', error);
        }
        const id = db.groups.create(group);
        return { id, ...group };
    }
    /**
     * CAMPAIGNS - Cloud with local fallback
     */
    async getCampaigns() {
        try {
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('campaigns')
                    .select('*')
                    .order('id', { ascending: false });
                if (error)
                    throw error;
                return data || [];
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud fetch failed for campaigns', error);
        }
        return db.campaigns.list();
    }
    async getCampaignWithMessages(id) {
        try {
            // 1. Get Campaign
            let campaign = null;
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('campaigns')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (!error && data)
                    campaign = data;
            }
            if (!campaign) {
                const campaigns = db.campaigns.list();
                campaign = campaigns.find(c => c.id === id);
            }
            if (!campaign)
                return null;
            // 2. Get Messages
            let messages = [];
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('campaign_messages')
                    .select('*')
                    .eq('campaign_id', id);
                if (!error && data)
                    messages = data;
            }
            if (messages.length === 0) {
                messages = db.campaignMessages.getByCampaign(id);
            }
            // Fallback: If no messages found in campaign_messages table, generate them from linked contacts
            // This is crucial for local mode where campaign_messages might not be pre-populated
            if (messages.length === 0) {
                console.log('[Storage] No cached messages found, generating from campaign contacts...');
                const contacts = db.campaigns.getContacts(id);
                if (contacts && contacts.length > 0) {
                    messages = contacts.map((contact) => ({
                        id: `temp_${contact.id}`,
                        recipient_number: contact.phone,
                        recipient_name: contact.name,
                        message_content: campaign.message_template || '',
                        variables: contact.variables ? JSON.stringify(contact.variables) : '{}'
                    }));
                    console.log(`[Storage] Generated ${messages.length} messages from contacts`);
                }
                else {
                    console.log('[Storage] No contacts found for this campaign');
                }
            }
            // 3. Get Media for the campaign
            const mediaFiles = await this.getCampaignMedia(id);
            console.log('[Storage] getCampaignWithMessages - Template Image Debug:', {
                campaignId: id,
                hasTemplatePath: !!campaign.template_image_path,
                templatePath: campaign.template_image_path,
                templateName: campaign.template_image_name
            });
            // 4. Construct CampaignTask object
            return {
                campaignId: String(campaign.id),
                messages: messages.map((m) => ({
                    id: String(m.id),
                    recipientNumber: m.recipient_number,
                    recipientName: m.recipient_name,
                    templateText: m.message_content, // Map DB content to templateText
                    variables: m.variables ? JSON.parse(m.variables) : {},
                    mediaAttachments: mediaFiles || [],
                    templateImage: campaign.template_image_path ? {
                        url: campaign.template_image_path,
                        caption: m.message_content // Template image uses message content as caption
                    } : undefined
                })),
                delaySettings: {
                    preset: campaign.delay_preset || 'random',
                    minDelay: campaign.delay_min,
                    maxDelay: campaign.delay_max
                }
            };
        }
        catch (error) {
            ErrorLogger.error('[Storage] Failed to get campaign with messages', error);
            return null;
        }
    }
    async createCampaign(campaign) {
        console.log('[Storage] createCampaign called', {
            name: campaign.name,
            hasTemplateImage: !!campaign.template_image_data,
            templateImageName: campaign.template_image_name
        });
        try {
            if (this.isCloudAvailable()) {
                const { data, error } = await this.supabase
                    .from('campaigns')
                    .insert({
                    name: campaign.name,
                    status: campaign.status || 'draft',
                    message_template: campaign.message_template,
                    group_id: campaign.group_id,
                    delay_preset: campaign.delay_preset,
                    delay_min: campaign.delay_min,
                    delay_max: campaign.delay_max,
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                return data;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud create failed for campaign', error);
        }
        // Local-first: Save template image if data is provided
        if (campaign.template_image_data) {
            try {
                const userDataPath = app.getPath('userData');
                const mediaDir = path.join(userDataPath, 'campaign_media');
                if (!fs.existsSync(mediaDir))
                    fs.mkdirSync(mediaDir, { recursive: true });
                const fileName = campaign.template_image_name || `template_${Date.now()}.png`;
                const safeName = `${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`;
                const filePath = path.join(mediaDir, safeName);
                const buffer = Buffer.from(campaign.template_image_data, 'base64');
                fs.writeFileSync(filePath, buffer);
                campaign.template_image_path = filePath;
                // Don't store large base64 in SQLite
                delete campaign.template_image_data;
                ErrorLogger.info('[Storage] Template image saved locally:', filePath);
            }
            catch (err) {
                ErrorLogger.error('[Storage] Failed to save template image:', err);
            }
        }
        const id = db.campaigns.create(campaign);
        return { id, ...campaign };
    }
    async updateCampaign(id, updates) {
        try {
            if (this.isCloudAvailable()) {
                const { error } = await this.supabase
                    .from('campaigns')
                    .update(updates)
                    .eq('id', id);
                if (error)
                    throw error;
                return;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud update failed for campaign', error);
        }
        if (updates.template_image_data) {
            try {
                const userDataPath = app.getPath('userData');
                const mediaDir = path.join(userDataPath, 'campaign_media');
                if (!fs.existsSync(mediaDir))
                    fs.mkdirSync(mediaDir, { recursive: true });
                const fileName = updates.template_image_name || `template_${Date.now()}.png`;
                const safeName = `${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`;
                const filePath = path.join(mediaDir, safeName);
                const buffer = Buffer.from(updates.template_image_data, 'base64');
                fs.writeFileSync(filePath, buffer);
                updates.template_image_path = filePath;
                delete updates.template_image_data;
                ErrorLogger.info('[Storage] Template image updated locally:', filePath);
            }
            catch (err) {
                ErrorLogger.error('[Storage] Failed to update template image:', err);
            }
        }
        db.campaigns.update(id, updates);
    }
    async updateCampaignProgress(id, sentCount, failedCount, status) {
        try {
            if (this.isCloudAvailable()) {
                const updates = { sent_count: sentCount, failed_count: failedCount };
                if (status)
                    updates.status = status;
                const { error } = await this.supabase
                    .from('campaigns')
                    .update(updates)
                    .eq('id', id);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud updateProgress failed', error);
        }
        db.campaigns.updateProgress(id, sentCount, failedCount, status);
    }
    async deleteCampaign(id) {
        try {
            if (this.isCloudAvailable()) {
                const { error } = await this.supabase
                    .from('campaigns')
                    .delete()
                    .eq('id', id);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud delete failed for campaign', error);
        }
        db.campaigns.delete(id);
    }
    /**
     * Get Supabase client (for worker thread)
     */
    getSupabaseClient() {
        return this.supabase;
    }
    /**
     * Get Supabase credentials (for worker thread)
     */
    getSupabaseCredentials() {
        if (!this.supabase)
            return null;
        // Note: These should be stored securely
        return {
            url: process.env.VITE_SUPABASE_URL || '',
            key: process.env.VITE_SUPABASE_ANON_KEY || '',
        };
    }
    /**
     * CAMPAIGN MEDIA - Local-first
     */
    async getCampaignMedia(campaignId) {
        try {
            if (this.isCloudAvailable() && this.mode !== 'local') {
                const { data, error } = await this.supabase
                    .from('campaign_media')
                    .select('*')
                    .eq('campaign_id', campaignId);
                if (error)
                    throw error;
                return data || [];
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud fetch failed for campaign media', error);
        }
        return db.campaignMedia.listByCampaign(campaignId);
    }
    async createCampaignMedia(media) {
        try {
            if (this.isCloudAvailable() && this.mode !== 'local') {
                const { error } = await this.supabase
                    .from('campaign_media')
                    .insert(media);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud create failed for campaign media', error);
        }
        // Ensure media has an ID
        if (!media.id) {
            media.id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        // Local-first: Save media file if data is provided
        if (media.fileData || media.file_data) {
            try {
                const userDataPath = app.getPath('userData');
                const mediaDir = path.join(userDataPath, 'campaign_media');
                if (!fs.existsSync(mediaDir))
                    fs.mkdirSync(mediaDir, { recursive: true });
                const fileName = media.fileName || media.file_name || `media_${Date.now()}`;
                const safeName = `${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`;
                const filePath = path.join(mediaDir, safeName);
                const data = media.fileData || media.file_data;
                const buffer = Buffer.from(data, 'base64');
                fs.writeFileSync(filePath, buffer);
                media.file_path = filePath;
                // Map camelCase to snake_case for DB
                media.file_name = fileName;
                media.file_type = media.fileType || media.file_type;
                media.file_size = media.fileSize || media.file_size;
                delete media.fileData;
                delete media.file_data;
                ErrorLogger.info('[Storage] Campaign media saved locally:', filePath);
            }
            catch (err) {
                ErrorLogger.error('[Storage] Failed to save campaign media:', err);
            }
        }
        // Map camelCase to snake_case if necessary
        if (media.campaignId && !media.campaign_id)
            media.campaign_id = media.campaignId;
        console.log('[Storage] createCampaignMedia called', {
            id: media.id,
            campaign_id: media.campaign_id,
            file_name: media.file_name,
            hasData: !!(media.fileData || media.file_data)
        });
        db.campaignMedia.create(media);
    }
    async deleteCampaignMedia(id) {
        try {
            if (this.isCloudAvailable() && this.mode !== 'local') {
                const { error } = await this.supabase
                    .from('campaign_media')
                    .delete()
                    .eq('id', id);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud delete failed for campaign media', error);
        }
        db.campaignMedia.delete(id);
    }
    async updateCampaignMessageStatus(messageId, status, errorMsg) {
        try {
            if (this.isCloudAvailable()) {
                const updates = { status };
                if (errorMsg)
                    updates.error_message = errorMsg;
                if (status === 'sent')
                    updates.sent_at = new Date().toISOString();
                const { error } = await this.supabase
                    .from('campaign_messages')
                    .update(updates)
                    .eq('id', messageId);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            ErrorLogger.warn('[Storage] Cloud updateCampaignMessageStatus failed', error);
        }
        db.campaignMessages.updateStatus(messageId, status, errorMsg);
    }
    close() {
        if (this.localDb) {
            db.closeDatabase();
        }
        this.supabase = null;
    }
}
// Singleton instance
export const storageService = new StorageService();
//# sourceMappingURL=storageService.js.map