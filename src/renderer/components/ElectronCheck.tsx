import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Download, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { waitForElectronAPI } from '@/renderer/utils/electronAPI';

export function ElectronCheck({ children }: { children: React.ReactNode }) {
  const [isElectron, setIsElectron] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    console.log('[ElectronCheck] Checking for Electron environment...');

    const checkElectron = async () => {
      const apiAvailable = await waitForElectronAPI(5000);

      if (apiAvailable) {
        console.log('[ElectronCheck] ✓ Electron API is available');
        setIsElectron(true);
        setShowWarning(false);
      } else {
        console.error('[ElectronCheck] ✗ Electron API not available');
        setIsElectron(false);
        setShowWarning(true);
      }
    };

    checkElectron();
  }, []);

  if (!isElectron && showWarning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Desktop App Required</CardTitle>
                <CardDescription>This application must run as an Electron desktop app</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Why Desktop Mode?</AlertTitle>
              <AlertDescription>
                Sambad WhatsApp Campaign Manager uses WhatsApp Web.js which requires native desktop features
                to connect to WhatsApp and send messages. These features are not available in a web browser.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                How to Run the Desktop App
              </h3>

              <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">1. Install Dependencies</p>
                  <code className="block bg-slate-900 text-slate-100 p-3 rounded text-sm">
                    npm install
                  </code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">2. Build the Application</p>
                  <code className="block bg-slate-900 text-slate-100 p-3 rounded text-sm">
                    npm run build
                  </code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">3. Start Electron Desktop App</p>
                  <code className="block bg-slate-900 text-slate-100 p-3 rounded text-sm">
                    npm run dev
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will start both the Vite dev server and the Electron desktop app.
                  </p>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Download className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Production Build</AlertTitle>
                <AlertDescription className="text-blue-800">
                  To create a production build, use the electron builder scripts defined in package.json
                  to create installers for Windows, Mac, or Linux.
                </AlertDescription>
              </Alert>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowWarning(false)}
              >
                Continue Anyway (Limited Functionality)
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Some features will not work without Electron
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
