import { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FirstLaunchSetupProps {
  onComplete: () => void;
}

export function FirstLaunchSetup({ onComplete }: FirstLaunchSetupProps) {
  const [open, setOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    checkCredentials();
  }, []);

  const checkCredentials = async () => {
    try {
      const result = await window.electronAPI.credentials.has();
      if (!result.data) {
        setOpen(true);
      }
    } catch (error) {
      console.error('Failed to check credentials:', error);
      setOpen(true);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError('Please enter both URL and API Key');
      return;
    }

    setIsTesting(true);
    setError('');
    setTestSuccess(false);

    try {
      await window.electronAPI.credentials.save(supabaseUrl, supabaseKey);
      const result = await window.electronAPI.credentials.test();

      if (result.success) {
        setTestSuccess(true);
        setError('');
      } else {
        setError(result.error || 'Connection test failed. Please check your credentials.');
        setTestSuccess(false);
      }
    } catch (error) {
      setError('Failed to test connection. Please try again.');
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = async () => {
    if (!testSuccess) {
      setError('Please test the connection first');
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.electronAPI.credentials.save(supabaseUrl, supabaseKey);

      if (result.success) {
        setOpen(false);
        onComplete();
      } else {
        setError(result.error || 'Failed to save credentials');
      }
    } catch (error) {
      setError('Failed to save credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Welcome to Sambad</DialogTitle>
              <DialogDescription className="mt-1">
                Configure your Supabase database to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sambad requires a Supabase database to store contacts, campaigns, and logs.
              You'll need to create a free Supabase account if you don't have one.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setup-url">Supabase Project URL</Label>
              <Input
                id="setup-url"
                type="url"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => {
                  setSupabaseUrl(e.target.value);
                  setTestSuccess(false);
                  setError('');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup-key">Supabase API Key (Anon Key)</Label>
              <Input
                id="setup-key"
                type="password"
                placeholder="Your anon/public key"
                value={supabaseKey}
                onChange={(e) => {
                  setSupabaseKey(e.target.value);
                  setTestSuccess(false);
                  setError('');
                }}
              />
            </div>

            {testSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Connection successful! You can now complete the setup.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              How to get your Supabase credentials
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Go to{' '}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  app.supabase.com
                </a>
              </li>
              <li>Create a new project or open an existing one</li>
              <li>Navigate to Project Settings (gear icon in the sidebar)</li>
              <li>Click on "API" in the settings menu</li>
              <li>Copy your "Project URL" and "anon public" key</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading || isTesting}
          >
            Skip for Now
          </Button>

          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isLoading || isTesting || !supabaseUrl || !supabaseKey}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>

          <Button
            onClick={handleComplete}
            disabled={isLoading || isTesting || !testSuccess}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Setup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
