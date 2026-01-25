export type DelayPreset = 'very-short' | 'short' | 'medium' | 'long' | 'very-long' | 'manual';

export interface DelayRange {
  min: number;
  max: number;
}

export interface DelayPresetConfig {
  id: DelayPreset;
  label: string;
  description: string;
  range: DelayRange;
}

export interface DelaySettings {
  preset: DelayPreset;
  customRange?: DelayRange;
}

export interface CampaignDelaySettings {
  id?: string;
  campaign_id: string;
  preset: DelayPreset;
  custom_min?: number;
  custom_max?: number;
  created_at?: string;
  updated_at?: string;
}

export const DELAY_PRESETS: Record<DelayPreset, DelayPresetConfig> = {
  'very-short': {
    id: 'very-short',
    label: 'Very Short',
    description: '1-5 seconds',
    range: { min: 1, max: 5 },
  },
  short: {
    id: 'short',
    label: 'Short',
    description: '5-20 seconds',
    range: { min: 5, max: 20 },
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    description: '20-50 seconds',
    range: { min: 20, max: 50 },
  },
  long: {
    id: 'long',
    label: 'Long',
    description: '50-120 seconds',
    range: { min: 50, max: 120 },
  },
  'very-long': {
    id: 'very-long',
    label: 'Very Long',
    description: '120-300 seconds (2-5 minutes)',
    range: { min: 120, max: 300 },
  },
  manual: {
    id: 'manual',
    label: 'Manual Range',
    description: 'Custom range',
    range: { min: 1, max: 300 },
  },
};

export const DELAY_PRESET_ORDER: DelayPreset[] = [
  'very-short',
  'short',
  'medium',
  'long',
  'very-long',
  'manual',
];
