export type DelayPreset = 'very-short' | 'short' | 'medium' | 'long' | 'very-long' | 'manual';

export interface DelayRange {
  min: number;
  max: number;
}

const DELAY_PRESETS: Record<DelayPreset, DelayRange> = {
  'very-short': { min: 1, max: 5 },
  short: { min: 5, max: 20 },
  medium: { min: 20, max: 50 },
  long: { min: 50, max: 120 },
  'very-long': { min: 120, max: 300 },
  manual: { min: 1, max: 300 },
};

export function pickDelay(preset: DelayPreset, customRange?: DelayRange): number {
  let range: DelayRange;

  if (preset === 'manual') {
    if (!customRange) {
      throw new Error('Manual preset requires custom range');
    }
    range = customRange;
  } else {
    range = DELAY_PRESETS[preset];
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

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
