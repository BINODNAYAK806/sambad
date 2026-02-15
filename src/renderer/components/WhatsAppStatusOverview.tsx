import { Server, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function WhatsAppStatusOverview() {
  const { servers } = useWhatsApp();
  const navigate = useNavigate();

  const getStatusIcon = (serverId: number) => {
    const s = servers[serverId];
    if (s?.isConnected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (s?.isConnecting) return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
    return <XCircle className="h-4 w-4 text-muted-foreground/50" />;
  };

  const getStatusText = (serverId: number) => {
    const s = servers[serverId];
    if (s?.isConnected) return "Connected";
    if (s?.isConnecting) return "Connecting...";
    return "Disconnected";
  };

  const activeCount = Object.values(servers).filter(s => s.isConnected).length;

  return (
    <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-background to-accent/20">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Server Farm Status
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {activeCount} of 5 servers currently active
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/settings')}
          className="bg-background/50 hover:bg-background"
        >
          Manage Servers
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((id) => (
            <div 
              key={id} 
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                servers[id]?.isConnected 
                  ? 'bg-green-500/5 border-green-500/20 shadow-sm' 
                  : 'bg-background/50 border-input'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                servers[id]?.isConnected ? 'bg-green-500/10' : 'bg-muted'
              }`}>
                {getStatusIcon(id)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slot {id}</p>
                <p className={`text-sm font-semibold truncate ${
                  servers[id]?.isConnected ? 'text-green-700' : 'text-foreground/70'
                }`}>
                  {getStatusText(id)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
