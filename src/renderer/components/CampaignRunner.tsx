import { useState, useEffect } from 'react';
import { Play, Pause, Square, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '../types/electron';
import { toast } from 'sonner';

type CampaignRunnerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
  onComplete: () => void;
};

type CampaignStatus = 'idle' | 'loading' | 'running' | 'paused' | 'completed' | 'stopped' | 'error';

export function CampaignRunner({ open, onOpenChange, campaign, onComplete }: CampaignRunnerProps) {
  const [status, setStatus] = useState<CampaignStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentRecipient, setCurrentRecipient] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectTimeout, setReconnectTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && campaign) {
      if (campaign.status === 'running') {
        setStatus('running');
        setSentCount(campaign.sent_count || 0);
        setFailedCount(campaign.failed_count || 0);
        setTotalMessages(campaign.total_count || 0);
        const total = campaign.total_count || 0;
        const sent = campaign.sent_count || 0;
        const failed = campaign.failed_count || 0;
        const progressVal = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
        setProgress(progressVal);
      } else {
        resetState();
      }
    }
  }, [open, campaign]);

  useEffect(() => {
    // Check if we're in Electron environment
    if (!window.electronAPI || !window.electronAPI.on) {
      console.warn('[Campaign Runner] Not running in Electron environment');
      return;
    }

    const handleProgress = (_event: any, data: any) => {
      console.log('[Campaign Runner] Progress:', data);

      // Ignore progress updates if campaign is in a terminal state
      setStatus((currentStatus) => {
        if (currentStatus === 'completed' || currentStatus === 'stopped' || currentStatus === 'error') {
          console.log('[Campaign Runner] Ignoring progress update - campaign in terminal state:', currentStatus);
          return currentStatus;
        }
        return 'running';
      });

      setProgress(data.progress || 0);
      setSentCount(data.sentCount || 0);
      setFailedCount(data.failedCount || 0);
      setTotalMessages(data.totalMessages || 0);
      setCurrentRecipient(data.recipientName ? `${data.recipientName} (${data.recipientNumber})` : (data.recipientNumber || ''));
    };

    const handleComplete = (_event: any, data: any) => {
      console.log('[Campaign Runner] Complete:', data);
      setStatus('completed');
      setProgress(100);
      setSentCount(data.sentCount || 0);
      setFailedCount(data.failedCount || 0);
      setCurrentRecipient(''); // Clear the current recipient display
      toast.success(`Campaign completed! ${data.sentCount} sent, ${data.failedCount} failed`);
      onComplete();
    };

    const handleError = (_event: any, data: any) => {
      console.error('[Campaign Runner] Error:', data);
      setStatus('error');
      setError(data.error || 'Campaign failed');
      setCurrentRecipient(''); // Clear the current recipient display
      toast.error('Campaign failed: ' + (data.error || 'Unknown error'));
    };

    const handlePaused = () => {
      console.log('[Campaign Runner] Paused');
      setStatus((currentStatus) => {
        // Only allow pause if currently running
        if (currentStatus === 'running') {
          return 'paused';
        }
        console.log('[Campaign Runner] Ignoring pause - not in running state:', currentStatus);
        return currentStatus;
      });
      toast.info('Campaign paused');
    };

    const handleResumed = () => {
      console.log('[Campaign Runner] Resumed');
      setStatus((currentStatus) => {
        // Only allow resume if currently paused
        if (currentStatus === 'paused') {
          return 'running';
        }
        console.log('[Campaign Runner] Ignoring resume - not in paused state:', currentStatus);
        return currentStatus;
      });
      toast.info('Campaign resumed');
    };

    const handleReconnecting = (_event: any, data: any) => {
      console.log('[Campaign Runner] Reconnecting:', data);
      setIsReconnecting(true);
      setStatus('paused'); // Campaign is paused during reconnection
      toast.info(data.message || 'WhatsApp disconnected. Reconnecting...', { duration: 3000 });

      // ✅ Extended timeout to 5 minutes (was 30 seconds)
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      const timeout = setTimeout(() => {
        console.warn('[Campaign Runner] Reconnect timeout after 5 minutes');
        setIsReconnecting(false);
        setStatus('error');
        setError('Reconnection is taking longer than expected. Please check your internet connection and restart the app if needed.');
        toast.error('Connection timeout - please restart app');
      }, 300000); // 5 minutes
      setReconnectTimeout(timeout);
    };

    const handleReady = () => {
      console.log('[Campaign Runner] ✅ WhatsApp ready after reconnect');
      setIsReconnecting(false);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        setReconnectTimeout(null);
      }
      toast.success('WhatsApp reconnected! Campaign will resume automatically.', { duration: 3000 });
    };

    const handleDisconnected = (_event: any, data: any) => {
      console.error('[Campaign Runner] WhatsApp disconnected:', data);
      setIsReconnecting(false);
      setStatus('error');
      setError(data.message || 'WhatsApp disconnected unexpectedly. Campaign stopped.');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        setReconnectTimeout(null);
      }
      toast.error('WhatsApp disconnected - Campaign stopped');
    };

    const handleChromiumError = (_event: any, data: any) => {
      console.error('[Campaign Runner] Chromium error:', data);
      setIsReconnecting(false);
      setStatus('error');
      setError(data.message || data.error || 'WhatsApp initialization failed: Chromium browser not found. Please reinstall the application.');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        setReconnectTimeout(null);
      }
      toast.error('WhatsApp initialization failed');
    };

    window.electronAPI.on('campaign:progress', handleProgress);
    window.electronAPI.on('campaign:complete', handleComplete);
    window.electronAPI.on('campaign:error', handleError);
    window.electronAPI.on('campaign:paused', handlePaused);
    window.electronAPI.on('campaign:resumed', handleResumed);
    window.electronAPI.on('whatsapp:reconnecting', handleReconnecting);
    window.electronAPI.on('whatsapp:ready', handleReady);
    window.electronAPI.on('whatsapp:chromium-error', handleChromiumError);
    window.electronAPI.on('whatsapp:disconnected', handleDisconnected);
    window.electronAPI.on('whatsapp:error', handleError);

    return () => {
      if (window.electronAPI && window.electronAPI.removeListener) {
        window.electronAPI.removeListener('campaign:progress', handleProgress);
        window.electronAPI.removeListener('campaign:complete', handleComplete);
        window.electronAPI.removeListener('campaign:error', handleError);
        window.electronAPI.removeListener('campaign:paused', handlePaused);
        window.electronAPI.removeListener('campaign:resumed', handleResumed);
        window.electronAPI.removeListener('whatsapp:reconnecting', handleReconnecting);
        window.electronAPI.removeListener('whatsapp:ready', handleReady);
        window.electronAPI.removeListener('whatsapp:chromium-error', handleChromiumError);
        window.electronAPI.removeListener('whatsapp:disconnected', handleDisconnected);
        window.electronAPI.removeListener('whatsapp:error', handleError);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [onComplete]);

  const resetState = () => {
    setStatus('idle');
    setProgress(0);
    setTotalMessages(0);
    setSentCount(0);
    setFailedCount(0);
    setCurrentRecipient('');
    setError(null);
  };

  const handleStart = async () => {
    if (!campaign) return;

    // Check if we're in Electron environment
    if (!window.electronAPI) {
      setError('This app must be run in Electron desktop mode');
      setStatus('error');
      toast.error('This app must be run as an Electron desktop application');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      let contacts: any[] = [];

      if (campaign.group_id) {
        // Pass skipMasking=true to get actual phone numbers for campaign execution
        const groupContacts = await window.electronAPI.groups.getContacts(campaign.group_id, true);
        if (!groupContacts.success || !groupContacts.data || groupContacts.data.length === 0) {
          setError('No contacts found in selected group');
          setStatus('error');
          toast.error('No contacts found in selected group');
          return;
        }
        contacts = groupContacts.data;
      } else {
        // Pass skipMasking=true to get actual phone numbers for campaign execution
        const campaignContacts = await window.electronAPI.campaigns.getContacts(campaign.id, true);
        if (!campaignContacts.success) {
          setError(`Failed to load contacts: ${campaignContacts.error || 'Unknown error'}`);
          setStatus('error');
          toast.error(`Failed to load contacts: ${campaignContacts.error}`);
          return;
        }

        if (!campaignContacts.data || campaignContacts.data.length === 0) {
          setError('No contacts found for this campaign');
          setStatus('error');
          toast.error('No contacts found for this campaign');
          return;
        }
        contacts = campaignContacts.data;
      }

      console.log('[Campaign Runner] Loaded contacts:', contacts.length);
      if (contacts.length > 0) {
        console.log('[Campaign Runner] Sample contact:', JSON.stringify(contacts[0], null, 2));
      }

      setTotalMessages(contacts.length);

      // Fetch media attachments for the campaign
      let mediaAttachments: any[] = [];
      try {
        const mediaResult = await window.electronAPI.campaigns.getMedia(campaign.id);
        if (mediaResult.success && mediaResult.data) {
          mediaAttachments = mediaResult.data;
          console.log(`[Campaign Runner] Found ${mediaAttachments.length} media attachments:`, JSON.stringify(mediaAttachments, null, 2));
        }
      } catch (mediaError) {
        console.warn('[Campaign Runner] Failed to fetch media:', mediaError);
      }

      // Check for template image
      let templateImage: any = undefined;
      // ✅ RELAXED CHECK: Allow image even if name is missing (use default)
      if (campaign.template_image_path) {
        templateImage = {
          url: campaign.template_image_path,
          type: campaign.template_image_type || 'image/jpeg',
          filename: campaign.template_image_name || 'image.jpg',
        };
        console.log(`[Campaign Runner] Campaign has template image:`, templateImage);
      }

      const messages = contacts.map((contact) => {
        const contactId = Date.now().toString() + Math.random().toString(36);
        return {
          id: contactId,
          recipientNumber: contact.phone,
          recipientName: contact.name,
          templateText: campaign.message_template || '',
          variables: contact.variables || {},
          mediaAttachments: mediaAttachments.length > 0 ? mediaAttachments : undefined,
          templateImage,
        };
      });

      const delaySettings = {
        preset: campaign.delay_preset || 'medium',
        minDelay: campaign.delay_min,
        maxDelay: campaign.delay_max,
      };

      const campaignTask = {
        campaignId: typeof campaign.id === 'string' ? parseInt(campaign.id, 10) : campaign.id,
        messages,
        delaySettings,
      };

      console.log('[Campaign Runner] Starting campaign:', campaignTask);

      const result = await window.electronAPI.campaign.start(campaignTask);

      if (!result.success) {
        setError(result.error || 'Failed to start campaign');
        setStatus('error');
        toast.error('Failed to start campaign');
      } else {
        setStatus('running');
        toast.success('Campaign started successfully');
      }
    } catch (err: any) {
      console.error('[Campaign Runner] Failed to start campaign:', err);
      setError(err.message || 'Failed to start campaign');
      setStatus('error');
      toast.error('Failed to start campaign');
    }
  };

  const handlePause = async () => {
    try {
      await window.electronAPI.campaign.pause();
    } catch (err: any) {
      console.error('[Campaign Runner] Failed to pause:', err);
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async () => {
    try {
      await window.electronAPI.campaign.resume();
    } catch (err: any) {
      console.error('[Campaign Runner] Failed to resume:', err);
      toast.error('Failed to resume campaign');
    }
  };

  const handleStop = async () => {
    try {
      await window.electronAPI.campaign.stop();
      setStatus('stopped');
      toast.info('Campaign stopped');
    } catch (err: any) {
      console.error('[Campaign Runner] Failed to stop:', err);
      toast.error('Failed to stop campaign');
    }
  };

  const handleClose = () => {
    if (status === 'running' || status === 'paused') {
      if (confirm('Campaign is still running. Are you sure you want to close?')) {
        handleStop();
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge variant="outline">Loading...</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{campaign?.name || 'Campaign'}</DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription>
            Monitor and control your campaign execution in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === 'idle' && (
            <Alert>
              <AlertDescription>
                Click "Start Campaign" to begin sending messages to {campaign?.group_id ? 'the selected group' : 'contacts'}.
              </AlertDescription>
            </Alert>
          )}

          {(status === 'running' || status === 'paused' || status === 'completed' || status === 'stopped') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">{totalMessages}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Sent
                  </div>
                  <div className="text-2xl font-bold text-green-600">{sentCount}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Failed
                  </div>
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                </div>
              </div>

              {isReconnecting && status === 'running' && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Reconnecting to WhatsApp... Campaign will resume automatically.
                  </AlertDescription>
                </Alert>
              )}

              {currentRecipient && status === 'running' && !isReconnecting && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Sending to: {currentRecipient}
                  </AlertDescription>
                </Alert>
              )}

              {status === 'completed' && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Campaign completed successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading campaign data...</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            {status === 'idle' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleStart}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Campaign
                </Button>
              </>
            )}

            {status === 'running' && (
              <>
                <Button variant="outline" onClick={handleStop}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button onClick={handlePause}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              </>
            )}

            {status === 'paused' && (
              <>
                <Button variant="outline" onClick={handleStop}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                <Button onClick={handleResume}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              </>
            )}

            {(status === 'completed' || status === 'stopped' || status === 'error') && (
              <Button onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
