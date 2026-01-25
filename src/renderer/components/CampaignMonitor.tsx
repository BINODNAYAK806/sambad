import { useCampaignProgress } from '../hooks/useCampaignProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Pause,
  Play,
  Square,
  Clock,
  Send,
  XCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CampaignMonitorProps {
  showControls?: boolean;
  compact?: boolean;
  className?: string;
}

export default function CampaignMonitor({
  showControls = true,
  compact = false,
  className = '',
}: CampaignMonitorProps) {
  const { stats, controls } = useCampaignProgress();

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds === 0) return '--';
    if (seconds < 60) return `${seconds}s`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins < 60) return `${mins}m ${secs}s`;

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getStatusBadge = () => {
    switch (stats.status) {
      case 'authenticating':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Authenticating
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Ready
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-600">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Pause className="mr-1 h-3 w-3" />
            Paused
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            Idle
          </Badge>
        );
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1">
          <Progress value={stats.progress} className="h-2" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {stats.sentCount}/{stats.totalMessages}
          </span>
          {getStatusBadge()}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Campaign Monitor</CardTitle>
            <CardDescription>
              {stats.campaignId ? `Campaign: ${stats.campaignId}` : 'No active campaign'}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {stats.qrCode && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-2">
                <p className="font-medium">Authentication Required</p>
                <p className="text-sm">Scan the QR code with WhatsApp to continue</p>
                <div className="flex justify-center mt-3 p-3 bg-white rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(stats.qrCode)}`}
                    alt="WhatsApp QR Code"
                    className="w-40 h-40"
                  />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {stats.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{stats.error}</AlertDescription>
          </Alert>
        )}

        {(stats.status === 'running' || stats.status === 'paused' || stats.status === 'completed') && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Overall Progress</span>
                <span className="font-bold text-lg">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Send className="h-4 w-4" />
                  <span>Total</span>
                </div>
                <div className="text-3xl font-bold">{stats.totalMessages}</div>
              </div>

              <div className="space-y-2 p-4 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sent</span>
                </div>
                <div className="text-3xl font-bold text-green-700">{stats.sentCount}</div>
              </div>

              <div className="space-y-2 p-4 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>Failed</span>
                </div>
                <div className="text-3xl font-bold text-red-700">{stats.failedCount}</div>
              </div>

              <div className="space-y-2 p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Loader2 className="h-4 w-4" />
                  <span>Pending</span>
                </div>
                <div className="text-3xl font-bold text-blue-700">{stats.pendingCount}</div>
              </div>
            </div>

            {stats.status === 'running' && (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Estimated Time Remaining</div>
                    <div className="text-xs text-muted-foreground">Based on current pace</div>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {formatTime(stats.estimatedTimeRemaining)}
                </div>
              </div>
            )}

            {stats.currentMessage.recipientNumber && stats.status === 'running' && (
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-1">Current Message</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-700">
                    Sending to {stats.currentMessage.recipientNumber}
                  </div>
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
          </>
        )}

        {stats.status === 'idle' && !stats.qrCode && (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No Active Campaign</p>
            <p className="text-sm">Start a campaign to see progress here</p>
          </div>
        )}

        {showControls && (stats.status === 'running' || stats.status === 'paused') && (
          <div className="flex gap-2 pt-2 border-t">
            {stats.status === 'running' && (
              <>
                <Button
                  onClick={controls.pause}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button
                  onClick={controls.stop}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}

            {stats.status === 'paused' && (
              <>
                <Button
                  onClick={controls.resume}
                  className="flex-1"
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
                <Button
                  onClick={controls.stop}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        )}

        {stats.status === 'completed' && (
          <div className="text-center py-6 text-green-700 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3" />
            <p className="font-semibold text-lg">Campaign Completed!</p>
            <p className="text-sm mt-1">
              {stats.sentCount} messages sent successfully
              {stats.failedCount > 0 && `, ${stats.failedCount} failed`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
