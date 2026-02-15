import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Loader2, Power, LogOut, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { isElectronAvailable } from '@/renderer/utils/electronAPI';
import { useWhatsApp } from '../contexts/WhatsAppContext';

interface ServerConnectionProps {
  serverId: number;
}

function ServerConnectionCard({ serverId }: ServerConnectionProps) {
  const { servers, clearServerState } = useWhatsApp();
  const server = servers[serverId] || { isConnected: false, isConnecting: false, qrCode: null, error: null, phoneNumber: null };
  const { isConnected, isConnecting, qrCode, error, phoneNumber } = server;

  const handleConnect = async () => {
    if (!isElectronAvailable()) {
      toast.error('This app must be run as an Electron desktop application');
      return;
    }

    try {
      const result = await window.electronAPI.whatsapp.connect(serverId);
      if (!result.success) {
        toast.error(result.error || `Failed to connect to Server ${serverId}`);
      }
    } catch (err: any) {
      toast.error(`Failed to connect to Server ${serverId}`);
    }
  };

  const handleDisconnect = async () => {
    if (!isElectronAvailable()) return;
    try {
      await window.electronAPI.whatsapp.disconnect(serverId);
      toast.info(`Server ${serverId} disconnected (session preserved)`);
    } catch (err: any) {
      toast.error('Failed to disconnect');
    }
  };

  const handleLogout = async () => {
    if (!isElectronAvailable()) return;
    try {
      await window.electronAPI.whatsapp.logout(serverId);
      toast.success(`Server ${serverId} logged out successfully`);
    } catch (err: any) {
      toast.error('Failed to logout');
    }
  };

  const handleClearSession = async () => {
    if (!isElectronAvailable()) return;
    try {
      const result = await window.electronAPI.whatsapp.clearSession(serverId);
      if (result.success) {
        clearServerState(serverId);
        toast.success(`Session for Server ${serverId} cleared!`);
      } else {
        toast.error(result.error || 'Failed to clear session');
      }
    } catch (err: any) {
      toast.error('Failed to clear session');
    }
  };

  const formatPhoneNumber = (num: string | null) => {
    if (!num) return '';
    return num.startsWith('+') ? num : `+${num}`;
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-5 w-5 text-primary" />
          WhatsApp Server {serverId}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? `Connected as ${formatPhoneNumber(phoneNumber)}`
            : `Manage connection for your ${serverId === 1 ? 'Primary' : `Secondary #${serverId - 1}`} WhatsApp account`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50/50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                Server {serverId} is Ready
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDisconnect} className="flex-1">
                <Power className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex-1">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        ) : isConnecting ? (
          <div className="space-y-4">
            {qrCode ? (
              <div className="space-y-4 flex flex-col items-center">
                <Alert className="w-full">
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Scan QR code for Server {serverId}
                  </AlertDescription>
                </Alert>
                <div className="p-4 bg-white rounded-xl border-2 border-primary/20 shadow-sm">
                  <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                </div>
                <p className="text-xs text-muted-foreground text-center animate-pulse">
                  Waiting for scan...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-primary">
                  Initializing Server {serverId}...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleConnect} className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              <Power className="mr-2 h-5 w-5" />
              Connect Server {serverId}
            </Button>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSession}
                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Reset Session & QR
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MultiServerSettings() {
  const { servers } = useWhatsApp();
  const [activeTab, setActiveTab] = useState("1");

  const getStatusBadge = (id: number) => {
    const s = servers[id];
    if (s?.isConnected) return <span className="ml-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />;
    if (s?.isConnecting) return <span className="ml-2 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />;
    return <span className="ml-2 w-2 h-2 rounded-full bg-gray-300" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            WhatsApp Server Farm
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage up to 5 concurrent WhatsApp accounts for rotational sending.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 h-12 p-1 bg-muted/50 border">
          <TabsTrigger value="1" className="data-[state=active]:bg-background transition-all">
            Slot 1 {getStatusBadge(1)}
          </TabsTrigger>
          <TabsTrigger value="2" className="data-[state=active]:bg-background transition-all">
            Slot 2 {getStatusBadge(2)}
          </TabsTrigger>
          <TabsTrigger value="3" className="data-[state=active]:bg-background transition-all">
            Slot 3 {getStatusBadge(3)}
          </TabsTrigger>
          <TabsTrigger value="4" className="data-[state=active]:bg-background transition-all">
            Slot 4 {getStatusBadge(4)}
          </TabsTrigger>
          <TabsTrigger value="5" className="data-[state=active]:bg-background transition-all">
            Slot 5 {getStatusBadge(5)}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card border rounded-xl p-6 shadow-sm">
          <TabsContent value="1" className="m-0 focus-visible:outline-none">
            <ServerConnectionCard serverId={1} />
          </TabsContent>
          <TabsContent value="2" className="m-0 focus-visible:outline-none">
            <ServerConnectionCard serverId={2} />
          </TabsContent>
          <TabsContent value="3" className="m-0 focus-visible:outline-none">
            <ServerConnectionCard serverId={3} />
          </TabsContent>
          <TabsContent value="4" className="m-0 focus-visible:outline-none">
            <ServerConnectionCard serverId={4} />
          </TabsContent>
          <TabsContent value="5" className="m-0 focus-visible:outline-none">
            <ServerConnectionCard serverId={5} />
          </TabsContent>
        </div>
      </Tabs>

      <Alert className="bg-primary/5 border-primary/20">
        <Power className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-primary/80">
          <strong>Pro Tip:</strong> All connected servers automatically become available for "Rotational" campaign sending.
        </AlertDescription>
      </Alert>
    </div>
  );
}
