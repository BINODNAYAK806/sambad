import { useState, useEffect, useCallback } from 'react';
import type { CampaignProgress } from '../types/electron';

export interface CampaignStats {
  campaignId: string | number | null;
  status: 'idle' | 'authenticating' | 'ready' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  currentMessage: {
    id: string | null;
    recipientNumber: string | null;
    status: 'sent' | 'failed' | null;
  };
  error: string | null;
  qrCode: string | null;
  startTime: number | null;
  estimatedTimeRemaining: number | null;
}

interface UseCampaignProgressResult {
  stats: CampaignStats;
  controls: {
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
  isWorkerReady: boolean;
}

export function useCampaignProgress(): UseCampaignProgressResult {
  const [stats, setStats] = useState<CampaignStats>({
    campaignId: null,
    status: 'idle',
    progress: 0,
    totalMessages: 0,
    sentCount: 0,
    failedCount: 0,
    pendingCount: 0,
    currentMessage: {
      id: null,
      recipientNumber: null,
      status: null,
    },
    error: null,
    qrCode: null,
    startTime: null,
    estimatedTimeRemaining: null,
  });

  const [isWorkerReady, setIsWorkerReady] = useState(false);

  const calculateEstimatedTime = useCallback((
    startTime: number,
    sentCount: number,
    totalMessages: number
  ): number | null => {
    if (sentCount === 0 || !startTime) return null;

    const elapsedTime = Date.now() - startTime;
    const avgTimePerMessage = elapsedTime / sentCount;
    const remainingMessages = totalMessages - sentCount;
    const estimatedMs = avgTimePerMessage * remainingMessages;

    return Math.round(estimatedMs / 1000);
  }, []);

  useEffect(() => {
    const unsubQr = window.electronAPI.campaignWorker.onQrCode((qrCode) => {
      setStats((prev) => ({
        ...prev,
        qrCode,
        status: 'authenticating',
      }));
    });

    const unsubReady = window.electronAPI.campaignWorker.onReady(() => {
      setIsWorkerReady(true);
      setStats((prev) => ({
        ...prev,
        qrCode: null,
        status: 'ready',
      }));
    });

    const unsubProgress = window.electronAPI.campaignWorker.onProgress((data: CampaignProgress) => {
      setStats((prev) => {
        const newStartTime = prev.startTime || Date.now();
        const totalMessages = data.totalMessages || prev.totalMessages;
        const sentCount = data.sentCount || 0;
        const failedCount = data.failedCount || 0;
        const pendingCount = totalMessages - sentCount - failedCount;

        const estimatedTimeRemaining = calculateEstimatedTime(
          newStartTime,
          sentCount,
          totalMessages
        );

        return {
          ...prev,
          campaignId: data.campaignId || prev.campaignId,
          status: 'running',
          progress: data.progress || 0,
          totalMessages,
          sentCount,
          failedCount,
          pendingCount,
          currentMessage: {
            id: data.messageId || null,
            recipientNumber: data.recipientNumber || null,
            status: data.status || null,
          },
          startTime: newStartTime,
          estimatedTimeRemaining,
          error: null,
        };
      });
    });

    const unsubComplete = window.electronAPI.campaignWorker.onComplete((data: CampaignProgress) => {
      setStats((prev) => ({
        ...prev,
        campaignId: data.campaignId || prev.campaignId,
        status: 'completed',
        progress: 100,
        totalMessages: data.totalMessages || prev.totalMessages,
        sentCount: data.sentCount || prev.sentCount,
        failedCount: data.failedCount || prev.failedCount,
        pendingCount: 0,
        estimatedTimeRemaining: 0,
      }));
    });

    const unsubError = window.electronAPI.campaignWorker.onError((data: CampaignProgress) => {
      setStats((prev) => ({
        ...prev,
        campaignId: data.campaignId || prev.campaignId,
        status: 'error',
        error: data.error || 'Unknown error occurred',
        sentCount: data.sentCount || prev.sentCount,
        failedCount: data.failedCount || prev.failedCount,
      }));
    });

    const unsubPaused = window.electronAPI.campaignWorker.onPaused((campaignId) => {
      setStats((prev) => ({
        ...prev,
        campaignId: campaignId || prev.campaignId,
        status: 'paused',
      }));
    });

    const unsubResumed = window.electronAPI.campaignWorker.onResumed((campaignId) => {
      setStats((prev) => ({
        ...prev,
        campaignId: campaignId || prev.campaignId,
        status: 'running',
      }));
    });

    return () => {
      unsubQr();
      unsubReady();
      unsubProgress();
      unsubComplete();
      unsubError();
      unsubPaused();
      unsubResumed();
    };
  }, [calculateEstimatedTime]);

  const pause = useCallback(async () => {
    try {
      await window.electronAPI.campaignWorker.pause();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await window.electronAPI.campaignWorker.resume();
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await window.electronAPI.campaignWorker.stop();
      setStats({
        campaignId: null,
        status: 'idle',
        progress: 0,
        totalMessages: 0,
        sentCount: 0,
        failedCount: 0,
        pendingCount: 0,
        currentMessage: {
          id: null,
          recipientNumber: null,
          status: null,
        },
        error: null,
        qrCode: null,
        startTime: null,
        estimatedTimeRemaining: null,
      });
    } catch (error) {
      console.error('Failed to stop campaign:', error);
    }
  }, []);

  return {
    stats,
    controls: {
      pause,
      resume,
      stop,
    },
    isWorkerReady,
  };
}
