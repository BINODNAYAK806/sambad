import {
  DelayPreset,
  DelayRange,
  DelaySettings,
  DELAY_PRESETS,
} from '../types/delay';

export function pickDelay(preset: DelayPreset, customRange?: DelayRange): number {
  let range: DelayRange;

  if (preset === 'manual') {
    if (!customRange) {
      throw new Error('Manual preset requires custom range');
    }
    range = customRange;
  } else {
    range = DELAY_PRESETS[preset].range;
  }

  if (range.min < 0 || range.max < 0) {
    throw new Error('Delay range values must be non-negative');
  }

  if (range.min > range.max) {
    throw new Error('Minimum delay must be less than or equal to maximum delay');
  }

  const randomDelay = Math.random() * (range.max - range.min) + range.min;
  return Math.round(randomDelay * 1000);
}

export function pickDelayFromSettings(settings: DelaySettings): number {
  return pickDelay(settings.preset, settings.customRange);
}

export function formatDelay(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDelaySeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDelayRange(range: DelayRange): string {
  const minFormatted = formatDelaySeconds(range.min);
  const maxFormatted = formatDelaySeconds(range.max);
  return `${minFormatted} - ${maxFormatted}`;
}

export function validateDelayRange(range: DelayRange): { valid: boolean; error?: string } {
  if (range.min < 0) {
    return { valid: false, error: 'Minimum delay cannot be negative' };
  }

  if (range.max < 0) {
    return { valid: false, error: 'Maximum delay cannot be negative' };
  }

  if (range.min > range.max) {
    return { valid: false, error: 'Minimum delay must be less than or equal to maximum delay' };
  }

  if (range.min === 0 && range.max === 0) {
    return { valid: false, error: 'Delay range cannot be zero' };
  }

  if (range.max > 3600) {
    return { valid: false, error: 'Maximum delay cannot exceed 1 hour (3600 seconds)' };
  }

  return { valid: true };
}

export function validateDelaySettings(settings: DelaySettings): { valid: boolean; error?: string } {
  if (settings.preset === 'manual') {
    if (!settings.customRange) {
      return { valid: false, error: 'Manual preset requires custom range' };
    }
    return validateDelayRange(settings.customRange);
  }

  return { valid: true };
}

export function getDelayRangeForPreset(preset: DelayPreset, customRange?: DelayRange): DelayRange {
  if (preset === 'manual') {
    return customRange || { min: 1, max: 300 };
  }
  return DELAY_PRESETS[preset].range;
}

export function getAverageDelay(preset: DelayPreset, customRange?: DelayRange): number {
  const range = getDelayRangeForPreset(preset, customRange);
  return Math.round(((range.min + range.max) / 2) * 1000);
}

export function estimateTotalTime(
  messageCount: number,
  preset: DelayPreset,
  customRange?: DelayRange
): number {
  const avgDelay = getAverageDelay(preset, customRange);
  return messageCount * avgDelay;
}

export function formatEstimatedTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds} seconds`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  if (seconds > 0 && hours === 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function delayWithPreset(preset: DelayPreset, customRange?: DelayRange): Promise<number> {
  const delayMs = pickDelay(preset, customRange);
  await delay(delayMs);
  return delayMs;
}

export function parseDelaySettings(data: any): DelaySettings {
  const settings: DelaySettings = {
    preset: data.preset || 'medium',
  };

  if (data.preset === 'manual' && data.custom_min !== undefined && data.custom_max !== undefined) {
    settings.customRange = {
      min: data.custom_min,
      max: data.custom_max,
    };
  }

  return settings;
}

export function serializeDelaySettings(settings: DelaySettings): any {
  const data: any = {
    preset: settings.preset,
  };

  if (settings.preset === 'manual' && settings.customRange) {
    data.custom_min = settings.customRange.min;
    data.custom_max = settings.customRange.max;
  }

  return data;
}
