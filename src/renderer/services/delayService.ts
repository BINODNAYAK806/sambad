import { createClient } from '@supabase/supabase-js';
import { CampaignDelaySettings, DelaySettings } from '../types/delay';
import { parseDelaySettings, serializeDelaySettings } from '../utils/delayUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCampaignDelaySettings(campaignId: string): Promise<DelaySettings | null> {
  const { data, error } = await supabase
    .from('campaign_delay_settings')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching delay settings:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return parseDelaySettings(data);
}

export async function saveCampaignDelaySettings(
  campaignId: string,
  settings: DelaySettings
): Promise<CampaignDelaySettings> {
  const serialized = serializeDelaySettings(settings);

  const { data: existing } = await supabase
    .from('campaign_delay_settings')
    .select('id')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('campaign_delay_settings')
      .update({
        preset: serialized.preset,
        custom_min: serialized.custom_min || null,
        custom_max: serialized.custom_max || null,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('Error updating delay settings:', error);
      throw error;
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from('campaign_delay_settings')
      .insert({
        campaign_id: campaignId,
        preset: serialized.preset,
        custom_min: serialized.custom_min || null,
        custom_max: serialized.custom_max || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting delay settings:', error);
      throw error;
    }

    return data;
  }
}

export async function deleteCampaignDelaySettings(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('campaign_delay_settings')
    .delete()
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error deleting delay settings:', error);
    throw error;
  }
}

export async function getDefaultDelaySettings(): Promise<DelaySettings> {
  return {
    preset: 'medium',
  };
}

export async function bulkGetCampaignDelaySettings(
  campaignIds: string[]
): Promise<Map<string, DelaySettings>> {
  const { data, error } = await supabase
    .from('campaign_delay_settings')
    .select('*')
    .in('campaign_id', campaignIds);

  if (error) {
    console.error('Error fetching bulk delay settings:', error);
    throw error;
  }

  const settingsMap = new Map<string, DelaySettings>();

  if (data) {
    for (const row of data) {
      settingsMap.set(row.campaign_id, parseDelaySettings(row));
    }
  }

  return settingsMap;
}
