import { QrCode, CheckCircle, XCircle, Loader2, Power, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { isElectronAvailable } from '@/renderer/utils/electronAPI';
import { useWhatsApp } from '../contexts/WhatsAppContext';

export function WhatsAppConnection() {
  const { isConnected, isConnecting, qrCode, error, phoneNumber, setIsConnecting, setError, setQrCode, setIsConnected, setPhoneNumber } = useWhatsApp();

  const handleConnect = async () => {
    if (!isElectronAvailable()) {
      setError('This app must be run in Electron desktop mode');
      toast.error('This app must be run as an Electron desktop application');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setQrCode(null);

    try {
      const result = await window.electronAPI.whatsapp.connect();

      if (!result.success) {
        setError(result.error || 'Failed to start WhatsApp connection');
        setIsConnecting(false);
        toast.error(result.error || 'Failed to connect to WhatsApp');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start WhatsApp connection');
      setIsConnecting(false);
      toast.error('Failed to connect to WhatsApp');
    }
  };

  const handleDisconnect = async () => {
    if (!isElectronAvailable()) return;

    try {
      await window.electronAPI.whatsapp.disconnect();
      setIsConnected(false);
      setQrCode(null);
      setError(null);
      setIsConnecting(false);
      setPhoneNumber(null);
      toast.info('WhatsApp disconnected (session preserved)');
    } catch (err: any) {
      toast.error('Failed to disconnect');
    }
  };

  const handleLogout = async () => {
    if (!isElectronAvailable()) return;

    try {
      await window.electronAPI.whatsapp.logout();
      setIsConnected(false);
      setQrCode(null);
      setError(null);
      setIsConnecting(false);
      setPhoneNumber(null);
      toast.success('WhatsApp logged out successfully');
    } catch (err: any) {
      toast.error('Failed to logout');
    }
  };

  const handleClearSession = async () => {
    if (!isElectronAvailable()) return;

    try {
      const result = await window.electronAPI.whatsapp.clearSession();
      if (result.success) {
        setIsConnected(false);
        setQrCode(null);
        setError(null);
        setIsConnecting(false);
        setPhoneNumber(null);
        toast.success('Session cleared! You will need to scan QR code again.');
      } else {
        toast.error(result.error || 'Failed to clear session');
      }
    } catch (err: any) {
      toast.error('Failed to clear session');
    }
  };

  // Format phone number for display (add + and spaces)
  const formatPhoneNumber = (num: string | null) => {
    if (!num) return '';
    // Add + prefix if not present
    const phone = num.startsWith('+') ? num : `+${num}`;
    return phone;
  };

  if (isConnected) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 flex items-center justify-between">
          <span>
            WhatsApp is connected and ready to send messages
            {phoneNumber && (
              <span className="ml-2 font-semibold">({formatPhoneNumber(phoneNumber)})</span>
            )}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4">
                <Power className="mr-2 h-4 w-4" />
                Manage
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDisconnect}>
                <Power className="mr-2 h-4 w-4" />
                Disconnect (Keep Session)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout (Clear Session)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className="h-5 w-5" />
          WhatsApp Connection
        </CardTitle>
        <CardDescription>
          Connect your WhatsApp account to send campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                WhatsApp is connected and ready to send messages
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDisconnect} className="flex-1">
                <Power className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex-1">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Disconnect:</strong> Temporarily close connection, keep session for quick reconnection.<br />
              <strong>Logout:</strong> Clear session completely, requires QR scan on next connection.
            </p>
          </div>
        ) : isConnecting ? (
          <div className="space-y-4">
            {qrCode ? (
              <div className="space-y-4">
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Scan this QR code with your WhatsApp mobile app
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Initializing WhatsApp connection...
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
            <Button onClick={handleConnect} className="w-full">
              <Power className="mr-2 h-4 w-4" />
              Connect WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You'll need to scan a QR code with your WhatsApp mobile app
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSession}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Clear Session (Reset QR)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
