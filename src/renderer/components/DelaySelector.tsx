import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DelayPreset,
  DelaySettings,
  DELAY_PRESETS,
  DELAY_PRESET_ORDER,
} from '../types/delay';
import {
  validateDelaySettings,
  formatDelayRange,
  estimateTotalTime,
  formatEstimatedTime,
  getDelayRangeForPreset,
} from '../utils/delayUtils';

interface DelaySelectorProps {
  value: DelaySettings;
  onChange: (settings: DelaySettings) => void;
  messageCount?: number;
  showEstimate?: boolean;
  disabled?: boolean;
}

export default function DelaySelector({
  value,
  onChange,
  messageCount = 0,
  showEstimate = true,
  disabled = false,
}: DelaySelectorProps) {
  const [localSettings, setLocalSettings] = useState<DelaySettings>(value);
  const [customMin, setCustomMin] = useState<number>(value.customRange?.min || 1);
  const [customMax, setCustomMax] = useState<number>(value.customRange?.max || 300);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(value);
    if (value.customRange) {
      setCustomMin(value.customRange.min);
      setCustomMax(value.customRange.max);
    }
  }, [value]);

  const handlePresetChange = (preset: DelayPreset) => {
    const newSettings: DelaySettings = {
      preset,
      customRange: preset === 'manual' ? { min: customMin, max: customMax } : undefined,
    };

    const validation = validateDelaySettings(newSettings);
    if (!validation.valid) {
      setError(validation.error || 'Invalid delay settings');
      return;
    }

    setError(null);
    setLocalSettings(newSettings);
    onChange(newSettings);
  };

  const handleCustomRangeChange = (min: number, max: number) => {
    setCustomMin(min);
    setCustomMax(max);

    if (localSettings.preset === 'manual') {
      const newSettings: DelaySettings = {
        preset: 'manual',
        customRange: { min, max },
      };

      const validation = validateDelaySettings(newSettings);
      if (!validation.valid) {
        setError(validation.error || 'Invalid delay range');
        return;
      }

      setError(null);
      setLocalSettings(newSettings);
      onChange(newSettings);
    }
  };

  const handleSliderChange = (value: number[]) => {
    handleCustomRangeChange(value[0], value[1]);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value) || 0;
    handleCustomRangeChange(min, customMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value) || 0;
    handleCustomRangeChange(customMin, max);
  };

  const currentRange = getDelayRangeForPreset(localSettings.preset, localSettings.customRange);
  const estimatedTime = messageCount > 0 ? estimateTotalTime(messageCount, localSettings.preset, localSettings.customRange) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Delay</CardTitle>
        <CardDescription>
          Set the delay between sending each message to simulate natural messaging patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Delay Preset</Label>
          <RadioGroup
            value={localSettings.preset}
            onValueChange={(value) => handlePresetChange(value as DelayPreset)}
            disabled={disabled}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DELAY_PRESET_ORDER.map((presetId) => {
                const preset = DELAY_PRESETS[presetId];
                const isManual = preset.id === 'manual';
                const isSelected = localSettings.preset === preset.id;

                return (
                  <Card
                    key={preset.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-accent'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !disabled && handlePresetChange(preset.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={preset.id} id={preset.id} />
                        <Label
                          htmlFor={preset.id}
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {preset.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 ml-6">
                        {isManual ? 'Custom range' : formatDelayRange(preset.range)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        {localSettings.preset === 'manual' && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-4">
              <Label>Custom Delay Range</Label>

              <div className="px-2 py-4">
                <Slider
                  value={[customMin, customMax]}
                  onValueChange={handleSliderChange}
                  min={1}
                  max={300}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1s</span>
                  <span>1m</span>
                  <span>2m</span>
                  <span>3m</span>
                  <span>4m</span>
                  <span>5m</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Minimum (seconds)</Label>
                  <Input
                    id="min"
                    type="number"
                    value={customMin}
                    onChange={handleMinChange}
                    disabled={disabled}
                    min={1}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Maximum (seconds)</Label>
                  <Input
                    id="max"
                    type="number"
                    value={customMax}
                    onChange={handleMaxChange}
                    disabled={disabled}
                    min={1}
                    max={300}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Current Range:</span>
          <Badge variant="outline">{formatDelayRange(currentRange)}</Badge>
        </div>

        {showEstimate && messageCount > 0 && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  Estimated time for {messageCount} message{messageCount !== 1 ? 's' : ''}:{' '}
                  {formatEstimatedTime(estimatedTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Actual time may vary based on random delays within the selected range.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
