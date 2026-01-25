import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import DelaySelector from './DelaySelector';
import { DelaySettings } from '../types/delay';
import { pickDelayFromSettings, formatDelay } from '../utils/delayUtils';

export default function DelaySelectorDemo() {
  const [delaySettings, setDelaySettings] = useState<DelaySettings>({
    preset: 'medium',
  });
  const [messageCount, setMessageCount] = useState<number>(10);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const delayMs = pickDelayFromSettings(delaySettings);
      setTestResult(`Generated delay: ${formatDelay(delayMs)}`);

      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 3000)));

      setTestResult(`Picked a random delay of ${formatDelay(delayMs)}`);
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    console.log('Delay Settings:', delaySettings);

    alert(
      `Settings saved!\n\nPreset: ${delaySettings.preset}\n${
        delaySettings.customRange
          ? `Custom Range: ${delaySettings.customRange.min}s - ${delaySettings.customRange.max}s`
          : ''
      }\n\nCheck console for details.`
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delay Selector Demo</CardTitle>
          <CardDescription>
            Configure message delays with preset options or custom ranges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 w-48">
              <Label htmlFor="messageCount">Number of Messages</Label>
              <Input
                id="messageCount"
                type="number"
                value={messageCount}
                onChange={(e) => setMessageCount(parseInt(e.target.value) || 0)}
                min={1}
                max={1000}
              />
            </div>
            <Button onClick={handleSave}>Save Settings</Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Test Delay'}
            </Button>
          </div>

          {testResult && (
            <Alert>
              <AlertDescription>{testResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <DelaySelector
        value={delaySettings}
        onChange={setDelaySettings}
        messageCount={messageCount}
        showEstimate={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Preset:</span>
              <span className="text-sm text-muted-foreground">{delaySettings.preset}</span>
            </div>

            {delaySettings.customRange && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Custom Min:</span>
                  <span className="text-sm text-muted-foreground">
                    {delaySettings.customRange.min} seconds
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Custom Max:</span>
                  <span className="text-sm text-muted-foreground">
                    {delaySettings.customRange.max} seconds
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between">
              <span className="text-sm font-medium">Message Count:</span>
              <span className="text-sm text-muted-foreground">{messageCount}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Configuration object:</p>
            <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
              {JSON.stringify(delaySettings, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Pick a random delay:</p>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-auto text-xs">
              {`import { pickDelay } from './utils/delayUtils';

// Use a preset
const delayMs = pickDelay('medium');
await new Promise(resolve => setTimeout(resolve, delayMs));

// Use custom range
const customDelay = pickDelay('manual', { min: 10, max: 30 });
await new Promise(resolve => setTimeout(resolve, customDelay));`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Use with settings object:</p>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-auto text-xs">
              {`import { pickDelayFromSettings, delayWithPreset } from './utils/delayUtils';

// Pick delay from settings
const settings = { preset: 'short' };
const delay = pickDelayFromSettings(settings);

// Or use the async helper
await delayWithPreset('long');

// With custom range
await delayWithPreset('manual', { min: 15, max: 45 });`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
