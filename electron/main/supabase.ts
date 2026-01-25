import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodeFetch from 'node-fetch';
import https from 'https';

const httpsAgent = new https.Agent({ keepAlive: true });

export let supabase: SupabaseClient | null = null;
export let currentSupabaseUrl: string | null = null;
export let currentSupabaseKey: string | null = null;

// --- Types ---

export type ContactVariables = {
  v1?: string; v2?: string; v3?: string; v4?: string; v5?: string;
  v6?: string; v7?: string; v8?: string; v9?: string; v10?: string;
};

export type Contact = {
  id?: number; company_id?: string; phone: string; name: string;
  vars_json?: any; variables?: ContactVariables; created_at?: string; updated_at?: string;
};

export type Group = {
  id?: number; company_id?: string; name: string; created_at?: string;
};

export type Campaign = {
  id?: number; company_id?: string; name: string; status: string;
  message_template?: string; group_id?: number; delay_preset?: string;
  delay_min?: number; delay_max?: number; sent_count?: number;
  failed_count?: number; total_count?: number; started_at?: string;
  completed_at?: string; created_at?: string; template_image_path?: string;
  template_image_name?: string; template_image_size?: number;
  template_image_type?: string; template_image_data?: string;
};

export type CampaignMessage = {
  id: string; company_id?: string; campaign_id: number; contact_id?: number;
  recipient_number: string; recipient_name?: string; template_text: string;
  resolved_text?: string; status: 'pending' | 'sent' | 'failed';
  error_message?: string; sent_at?: string; created_at?: string; updated_at?: string;
};

export type LogEntry = {
  id?: number; company_id?: string; timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'worker' | 'system' | 'browser' | 'ipc' | 'general';
  message: string; data?: string; created_at?: string;
};

// --- Initialization ---

async function customFetch(url: string | URL | Request, init?: RequestInit): Promise<any> {
  const urlString = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
  try {
    const response = await nodeFetch(urlString, { ...init, agent: httpsAgent, signal: init?.signal } as any);
    return response;
  } catch (error: any) {
    console.error('[Sambad] Connection error:', error.message);
    throw error;
  }
}

export function initializeSupabase(customUrl?: string, customKey?: string): SupabaseClient | null {
  console.log('[Sambad] Initializing Supabase client...');

  const supabaseUrl = customUrl ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const supabaseKey = customKey ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  console.log('[Connection Debug] URL:', supabaseUrl ? 'Set' : 'MISSING');
  console.log('[Connection Debug] Key:', supabaseKey ? 'Set' : 'MISSING');

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Sambad] Connection Error: Missing credentials (URL or Key)');
    return null;
  }

  currentSupabaseUrl = supabaseUrl;
  currentSupabaseKey = supabaseKey;

  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'User-Agent': 'Sambad-Electron-App' }, fetch: customFetch },
    });
    console.log('[Sambad] Supabase client initialized successfully');
    return supabase;
  } catch (error: any) {
    console.error('[Sambad] Failed to create Supabase client:', error.message);
    return null;
  }
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const client = initializeSupabase();
    if (!client) {
      throw new Error('Supabase client not initialized. Please configure your Account ID and License Key in Settings.');
    }
    return client;
  }
  return supabase;
}

export async function testConnection(retries = 3): Promise<boolean> {
  const client = getSupabase();
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await client.from('contacts').select('id').limit(1);
      if (!error) {
        console.log('[Sambad] Connection verified.');
        return true;
      }
      console.error('[Sambad] Test Connection Supabase Error:', error);
    } catch (e) {
      console.error('[Sambad] Test Connection Exception:', e);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

export async function getTenantContext() {
  const { authService } = await import('./auth.js');
  const client = getSupabase();
  const companyId = await authService.getCurrentCompanyId();
  if (!companyId) throw new Error('No company context. Please login.');
  return { client, companyId };
}

// --- Collections ---

export const contacts = {
  list: async (): Promise<Contact[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      phone: row.phone_number,
      variables: row.vars_json || undefined
    }));
  },

  listWithGroups: async (): Promise<Contact[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('contacts').select('*, group_contacts(groups(id, name))').eq('company_id', companyId).order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map((contact: any) => ({
      ...contact,
      phone: contact.phone_number,
      variables: contact.vars_json || undefined,
      groups: (contact.group_contacts || []).map((gc: any) => gc.groups).filter((g: any) => g !== null)
    }));
  },

  create: async (contact: Omit<Contact, 'id'>): Promise<number> => {
    const { client, companyId } = await getTenantContext();

    // Extract country code from phone number (e.g., +91 from +919876543210)
    let countryCode = '';
    if (contact.phone) {
      const phoneStr = contact.phone.toString();
      // Remove + if present
      const cleaned = phoneStr.replace(/^\+/, '');
      // Extract country code (first 1-3 digits)
      if (cleaned.startsWith('1')) {
        countryCode = '1'; // US/Canada
      } else if (cleaned.startsWith('91')) {
        countryCode = '91'; // India
      } else {
        // Try to extract first 2-3 digits as country code
        const match = cleaned.match(/^(\d{1,3})/);
        countryCode = match ? match[1] : '';
      }
    }

    // Database has both 'phone' and 'phone_number' columns
    const dbContact = {
      phone: contact.phone,
      phone_number: contact.phone,
      name: contact.name,
      country_code: countryCode || '91', // Default to India if not found
      company_id: companyId,
      vars_json: contact.variables || contact.vars_json || {}
    };
    const { data, error } = await client.from('contacts').insert(dbContact).select('id').single();
    if (error) throw error;
    return data.id;
  },

  bulkCreate: async (contactsList: Omit<Contact, 'id'>[]): Promise<number[]> => {
    const { client, companyId } = await getTenantContext();
    const records = contactsList.map(c => {
      // Extract country code from phone
      let countryCode = '';
      if (c.phone) {
        const cleaned = c.phone.toString().replace(/^\+/, '');
        if (cleaned.startsWith('1')) countryCode = '1';
        else if (cleaned.startsWith('91')) countryCode = '91';
        else {
          const match = cleaned.match(/^(\d{1,3})/);
          countryCode = match ? match[1] : '';
        }
      }
      return {
        phone: c.phone,
        phone_number: c.phone,
        name: c.name,
        country_code: countryCode || '91',
        company_id: companyId,
        vars_json: c.variables || c.vars_json || {}
      };
    });
    const { data, error } = await client.from('contacts').insert(records).select('id');
    if (error) throw error;
    return (data || []).map(r => r.id);
  },

  update: async (id: number, contact: Partial<Contact>): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    // Map phone to phone_number if phone is being updated
    const dbContact: any = { ...contact };
    if (contact.phone) {
      dbContact.phone_number = contact.phone;
      delete dbContact.phone;
    }
    const { error } = await client.from('contacts').update(dbContact).eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  },

  delete: async (id: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('contacts').delete().eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  },

  findDuplicates: async (): Promise<Contact[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('contacts').select('*').eq('company_id', companyId).order('phone_number');
    if (error) throw error;
    const phoneCount: any = {};
    (data || []).forEach(c => phoneCount[c.phone_number] = (phoneCount[c.phone_number] || 0) + 1);
    return (data || []).filter(c => phoneCount[c.phone_number] > 1).map(r => ({ ...r, phone: r.phone_number, variables: r.vars_json || undefined }));
  },

  removeDuplicates: async (): Promise<number> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('contacts').select('id, phone_number').eq('company_id', companyId).order('phone_number').order('id');
    if (error) throw error;
    const seen = new Set();
    const idsToDelete: number[] = [];
    (data || []).forEach(c => { if (seen.has(c.phone_number)) idsToDelete.push(c.id); else seen.add(c.phone_number); });
    if (idsToDelete.length > 0) {
      const { error: delErr } = await client.from('contacts').delete().in('id', idsToDelete).eq('company_id', companyId);
      if (delErr) throw delErr;
    }
    return idsToDelete.length;
  }
};

export const groups = {
  list: async (): Promise<Group[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('groups').select('*').eq('company_id', companyId).order('name');
    if (error) throw error;
    return data || [];
  },

  create: async (group: Omit<Group, 'id'>): Promise<number> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('groups').insert({ ...group, company_id: companyId }).select('id').single();
    if (error) throw error;
    return data.id;
  },

  update: async (id: number, group: Partial<Group>): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('groups').update(group).eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  },

  delete: async (id: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('groups').delete().eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  },

  addContact: async (groupId: number, contactId: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('group_contacts').upsert({ group_id: groupId, contact_id: contactId, company_id: companyId });
    if (error) throw error;
  },

  removeContact: async (groupId: number, contactId: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('group_contacts').delete().eq('group_id', groupId).eq('contact_id', contactId).eq('company_id', companyId);
    if (error) throw error;
  },

  bulkAddContacts: async (groupId: number, contactIds: number[]): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const records = contactIds.map(cid => ({ group_id: groupId, contact_id: cid, company_id: companyId }));
    const { error } = await client.from('group_contacts').upsert(records);
    if (error) throw error;
  },



  getContacts: async (groupId: number): Promise<Contact[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('group_contacts').select('contacts(*)').eq('group_id', groupId).eq('company_id', companyId);
    if (error) throw error;
    return (data || []).map((r: any) => ({ ...r.contacts, variables: r.contacts?.vars_json || undefined })).filter(c => c.id);
  },

  findOrCreate: async (name: string): Promise<number> => {
    const { client, companyId } = await getTenantContext();
    const cleanName = name.trim();

    // 1. Try to find existing group
    const { data: existing, error: findError } = await client
      .from('groups')
      .select('id')
      .eq('name', cleanName)
      .eq('company_id', companyId)
      .single();

    if (!findError && existing) {
      return existing.id;
    }

    // 2. Create if not exists
    const { data: newGroup, error: createError } = await client
      .from('groups')
      .insert({ name: cleanName, company_id: companyId })
      .select('id')
      .single();
    if (createError) throw createError;
    return newGroup.id;
  },

  bulkAddContactsToMultipleGroups: async (groupIds: number[], contactIds: number[]): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const records: any[] = [];

    // Create cartesian product of groups and contacts
    for (const groupId of groupIds) {
      for (const contactId of contactIds) {
        records.push({
          group_id: groupId,
          contact_id: contactId,
          company_id: companyId
        });
      }
    }

    if (records.length === 0) return;

    // Use upsert to handle potential duplicates gracefully
    const { error } = await client.from('group_contacts').upsert(records, { onConflict: 'group_id,contact_id' });
    if (error) throw error;
  }
};

export const campaigns = {
  list: async (): Promise<Campaign[]> => {
    const { client, companyId } = await getTenantContext();
    // Optimized query: Exclude template_image_data (Base64 is too heavy for lists)
    const { data, error } = await client.from('campaigns')
      .select('id, company_id, name, status, message_content, group_id, delay_preset, delay_min, delay_max, sent_count, failed_count, total_count, started_at, completed_at, created_at, template_image_path, template_image_name, template_image_size, template_image_type')
      .eq('company_id', companyId)
      .order('id', { ascending: false });
    if (error) throw error;
    // Map message_content from database to message_template for frontend
    return (data || []).map(campaign => ({
      ...campaign,
      message_template: campaign.message_content
    }));
  },

  create: async (campaign: Omit<Campaign, 'id'>): Promise<number> => {
    const { client, companyId } = await getTenantContext();
    // Database only has message_content column, not message_template
    // Map message_template from frontend to message_content for database
    const dbCampaign: any = { ...campaign, company_id: companyId };
    if (campaign.message_template) {
      dbCampaign.message_content = campaign.message_template;
      delete dbCampaign.message_template; // Remove to avoid column not found error
    }
    // Ensure message_content is never null
    if (!dbCampaign.message_content) {
      dbCampaign.message_content = '';
    }
    const { data, error } = await client.from('campaigns').insert(dbCampaign).select('id').single();
    if (error) throw error;
    return data.id;
  },

  update: async (id: number, campaign: Partial<Campaign>): Promise<void> => {
    const { client, companyId } = await getTenantContext();

    // Database only has message_content column, not message_template
    const dbCampaign: any = { ...campaign };
    if (campaign.message_template) {
      dbCampaign.message_content = campaign.message_template;
      delete dbCampaign.message_template;
    }

    const { error } = await client.from('campaigns').update(dbCampaign).eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  },

  delete: async (id: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('campaigns').delete().eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  },

  addContact: async (campaignId: number, contactId: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('campaign_contacts').insert({ campaign_id: campaignId, contact_id: contactId, company_id: companyId });
    if (error && error.code !== '23505') throw error;
  },

  addContacts: async (campaignId: number, contactIds: number[]): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const records = contactIds.map(cid => ({ campaign_id: campaignId, contact_id: cid, company_id: companyId }));
    const { error } = await client.from('campaign_contacts').insert(records);
    if (error && error.code !== '23505') throw error;
  },

  removeContact: async (campaignId: number, contactId: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('campaign_contacts').delete().eq('campaign_id', campaignId).eq('contact_id', contactId).eq('company_id', companyId);
    if (error) throw error;
  },

  clearContacts: async (campaignId: number): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('campaign_contacts').delete().eq('campaign_id', campaignId).eq('company_id', companyId);
    if (error) throw error;
  },

  getContacts: async (campaignId: number): Promise<Contact[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('campaign_contacts').select('contacts(*)').eq('campaign_id', campaignId).eq('company_id', companyId);
    if (error) throw error;
    return (data || []).map((r: any) => ({ ...r.contacts, variables: r.contacts?.vars_json || undefined })).filter(c => c.id);
  }
};

export const campaignMessages = {
  create: async (message: Omit<CampaignMessage, 'created_at' | 'updated_at'>): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('campaign_messages').insert({ ...message, company_id: companyId });
    if (error) throw error;
  },

  getFailed: async (campaignId?: number): Promise<any[]> => {
    const { client, companyId } = await getTenantContext();
    let query = client.from('campaign_messages').select('*, contacts(name, phone)').eq('status', 'failed').eq('company_id', companyId);
    if (campaignId) query = query.eq('campaign_id', campaignId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((m: any) => ({ campaign_id: m.campaign_id, recipient: m.recipient_number, name: m.recipient_name || m.contacts?.name || 'Unknown', error: m.error_message || 'Unknown', failed_at: m.updated_at }));
  },

  updateStatus: async (messageId: string, status: 'sent' | 'failed', errorStr?: string): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === 'sent') updateData.sent_at = new Date().toISOString();
    if (errorStr) updateData.error_message = errorStr;
    const { error } = await client.from('campaign_messages').update(updateData).eq('id', messageId).eq('company_id', companyId);
    if (error) throw error;
  },

  getByCampaign: async (campaignId: number): Promise<CampaignMessage[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('campaign_messages').select('*').eq('campaign_id', campaignId).eq('company_id', companyId);
    if (error) throw error;
    return data || [];
  }
};

export const campaignMedia = {
  add: async (campaignId: number, media: any): Promise<string> => {
    const { client, companyId } = await getTenantContext();

    // Map camelCase from frontend to snake_case for DB
    const dbMedia = {
      campaign_id: campaignId,
      company_id: companyId,
      file_name: media.fileName || media.file_name,
      file_type: media.fileType || media.file_type,
      file_size: media.fileSize || media.file_size,
      file_data: media.fileData || media.file_data,
      file_path: media.filePath || media.file_path, // Store local path
      caption: media.caption
    };

    const { data, error } = await client.from('campaign_media').insert(dbMedia).select('id').single();
    if (error) throw error;
    return data.id;
  },
  list: async (campaignId: number): Promise<any[]> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('campaign_media').select('*').eq('campaign_id', campaignId).eq('company_id', companyId);
    if (error) throw error;
    return data || [];
  },
  delete: async (id: string): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('campaign_media').delete().eq('id', id).eq('company_id', companyId);
    if (error) throw error;
  }
};

export const logs = {
  list: async (limit?: number): Promise<LogEntry[]> => {
    const { client, companyId } = await getTenantContext();
    let query = client.from('logs').select('*').eq('company_id', companyId).order('timestamp', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  create: async (log: Omit<LogEntry, 'id'>): Promise<number> => {
    const { client, companyId } = await getTenantContext();
    const { data, error } = await client.from('logs').insert({ ...log, company_id: companyId }).select('id').single();
    if (error) throw error;
    return data.id;
  },

  clear: async (): Promise<void> => {
    const { client, companyId } = await getTenantContext();
    const { error } = await client.from('logs').delete().eq('company_id', companyId);
    if (error) throw error;
  }
};

export const reports = {
  generate: async (): Promise<any> => {
    const { client, companyId } = await getTenantContext();

    // Get aggregated stats
    const { count: totalCampaigns } = await client.from('campaigns').select('*', { count: 'exact', head: true }).eq('company_id', companyId);

    // For contacts, we recount roughly
    const { count: totalContacts } = await client.from('contacts').select('*', { count: 'exact', head: true }).eq('company_id', companyId);

    // Message stats
    const { count: messagesSent } = await client.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('status', 'sent').eq('company_id', companyId);
    const { count: messagesFailed } = await client.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('status', 'failed').eq('company_id', companyId);
    const { count: totalMessages } = await client.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('company_id', companyId);

    const successRate = totalMessages ? (messagesSent! / totalMessages) * 100 : 0;

    return {
      totalContacts: totalContacts || 0,
      totalCampaigns: totalCampaigns || 0,
      messagesSent: messagesSent || 0,
      messagesFailed: messagesFailed || 0,
      successRate
    };
  }
};

