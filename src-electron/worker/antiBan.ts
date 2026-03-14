export type DelayPreset = 'very_short' | 'short' | 'medium' | 'long' | 'very_long' | 'custom';

export interface DelaySettings {
  preset: DelayPreset;
  minDelay?: number;
  maxDelay?: number;
}

export interface AntiBanConfig {
  dailyLimit: number;
  burstLimit: number;
  longPauseInterval: { min: number; max: number };
  longPauseDuration: { min: number; max: number };
}

const DELAY_PRESETS: Record<DelayPreset, { min: number; max: number }> = {
  very_short: { min: 1000, max: 5000 },
  short: { min: 5000, max: 20000 },
  medium: { min: 20000, max: 50000 },
  long: { min: 50000, max: 120000 },
  very_long: { min: 120000, max: 300000 },
  custom: { min: 1000, max: 5000 },
};

const DEFAULT_ANTI_BAN_CONFIG: AntiBanConfig = {
  dailyLimit: 1000,
  burstLimit: 50,
  longPauseInterval: { min: 20, max: 60 },
  longPauseDuration: { min: 300000, max: 600000 },
};

export class AntiBanManager {
  private config: AntiBanConfig;
  private messagesSentToday: number = 0;
  private messagesSentInBurst: number = 0;
  private lastResetDate: Date;
  private lastLongPause: number = 0;

  constructor(config: Partial<AntiBanConfig> = {}) {
    this.config = { ...DEFAULT_ANTI_BAN_CONFIG, ...config };
    this.lastResetDate = new Date();
  }

  computeDelay(settings: DelaySettings, attemptCount: number = 0): number {
    this.resetDailyCountIfNeeded();

    if (this.messagesSentToday >= this.config.dailyLimit) {
      throw new Error('Daily message limit reached. Please try again tomorrow.');
    }

    let baseMin: number;
    let baseMax: number;

    if (settings.preset === 'custom' && settings.minDelay && settings.maxDelay) {
      // Inputs are in seconds (from DB/Schema), convert to ms
      baseMin = settings.minDelay * 1000;
      baseMax = settings.maxDelay * 1000;
    } else {
      // Presets are already in ms in DELAY_PRESETS definition
      const preset = DELAY_PRESETS[settings.preset];
      baseMin = preset.min;
      baseMax = preset.max;
    }

    if (attemptCount > 0) {
      const backoffMultiplier = Math.pow(2, attemptCount);
      baseMin *= backoffMultiplier;
      baseMax *= backoffMultiplier;
      baseMax = Math.min(baseMax, 600000);
    }

    const delay = this.gaussianDelay(baseMin, baseMax);

    const shouldTakeLongPause = this.shouldTakeLongPause();
    if (shouldTakeLongPause) {
      const longPauseDuration = this.randomBetween(
        this.config.longPauseDuration.min,
        this.config.longPauseDuration.max
      );
      console.log(
        `[AntiBan] Long pause triggered after ${this.messagesSentInBurst} messages. Pausing for ${(longPauseDuration / 1000).toFixed(0)}s`
      );
      this.lastLongPause = this.messagesSentInBurst;
      this.messagesSentInBurst = 0;
      return delay + longPauseDuration;
    }

    return delay;
  }

  recordMessageSent(): void {
    this.messagesSentToday++;
    this.messagesSentInBurst++;
  }

  canSendMore(): boolean {
    this.resetDailyCountIfNeeded();
    return this.messagesSentToday < this.config.dailyLimit;
  }

  getRemainingQuota(): number {
    this.resetDailyCountIfNeeded();
    return Math.max(0, this.config.dailyLimit - this.messagesSentToday);
  }

  getStats() {
    return {
      messagesSentToday: this.messagesSentToday,
      messagesSentInBurst: this.messagesSentInBurst,
      remainingQuota: this.getRemainingQuota(),
      dailyLimit: this.config.dailyLimit,
    };
  }

  reset(): void {
    this.messagesSentToday = 0;
    this.messagesSentInBurst = 0;
    this.lastLongPause = 0;
    this.lastResetDate = new Date();
  }

  private shouldTakeLongPause(): boolean {
    const messagesSincePause = this.messagesSentInBurst - this.lastLongPause;
    const threshold = this.randomBetween(
      this.config.longPauseInterval.min,
      this.config.longPauseInterval.max
    );
    return messagesSincePause >= threshold;
  }

  private gaussianDelay(min: number, max: number): number {
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6;

    let u1 = Math.random();
    let u2 = Math.random();

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let delay = mean + z0 * stdDev;

    delay = Math.max(min, Math.min(max, delay));

    const jitter = this.randomBetween(-0.1, 0.1) * delay;
    delay += jitter;

    return Math.round(delay);
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private resetDailyCountIfNeeded(): void {
    const now = new Date();
    if (now.getDate() !== this.lastResetDate.getDate()) {
      console.log('[AntiBan] New day detected, resetting daily counter');
      this.messagesSentToday = 0;
      this.lastResetDate = now;
    }
  }
}

export function formatDelay(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
