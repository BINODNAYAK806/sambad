import { useState, useEffect } from 'react';
import { Database, CheckCircle, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export function ConnectionStatus() {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();

    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const result = await window.electronAPI.credentials.has();
      setHasCredentials(result.data || false);
    } catch (error) {
      console.error('Failed to check connection:', error);
      setHasCredentials(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClick = () => {
    navigate('/settings');
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <Database className="h-4 w-4 text-gray-400 animate-pulse" />;
    }

    if (hasCredentials) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    return <HardDrive className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = () => {
    if (isChecking) {
      return null;
    }

    if (hasCredentials) {
      return <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300">Cloud</Badge>;
    }

    return <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300">Local</Badge>;
  };

  const getStatusText = () => {
    if (isChecking) {
      return 'Checking...';
    }

    if (hasCredentials) {
      return 'Connected';
    }

    return 'Local Mode';
  };

  const getTooltipText = () => {
    if (isChecking) {
      return 'Checking database connection...';
    }

    if (hasCredentials) {
      return 'Connected to cloud database. Campaign data syncs to Supabase. Click to manage settings.';
    }

    return 'Running in local mode. WhatsApp works fully, campaign data stored locally. Click to configure cloud database for sync.';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className="gap-2 h-8 px-3"
          >
            {getStatusIcon()}
            <span className="text-xs">{getStatusText()}</span>
            {getStatusBadge()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
