import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { waitForElectronAPI } from '@/renderer/utils/electronAPI';

export interface WhatsAppServerState {
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  error: string | null;
  phoneNumber: string | null;
}

interface WhatsAppContextType {
  // Multi-server state
  servers: Record<number, WhatsAppServerState>;

  // Backward compatibility (maps to Server 1)
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  error: string | null;
  phoneNumber: string | null;

  // Actions
  refreshStatus: (serverId?: number) => Promise<void>;
  refreshAllStatuses: () => Promise<void>;
  clearServerState: (serverId: number) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

const INITIAL_SERVER_STATE: WhatsAppServerState = {
  isConnected: false,
  isConnecting: false,
  qrCode: null,
  error: null,
  phoneNumber: null,
};

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Record<number, WhatsAppServerState>>({
    1: { ...INITIAL_SERVER_STATE },
    2: { ...INITIAL_SERVER_STATE },
    3: { ...INITIAL_SERVER_STATE },
    4: { ...INITIAL_SERVER_STATE },
    5: { ...INITIAL_SERVER_STATE },
  });

  const updateServer = useCallback((serverId: number, updates: Partial<WhatsAppServerState>) => {
    setServers(prev => ({
      ...prev,
      [serverId]: { ...prev[serverId], ...updates }
    }));
  }, []);

  const refreshStatus = useCallback(async (serverId: number = 1) => {
    try {
      const statusResult = await window.electronAPI.whatsapp.getStatus(serverId);
      if (statusResult.success && statusResult.data) {
        updateServer(serverId, {
          isConnected: statusResult.data.isConnected,
          isConnecting: statusResult.data.isInitializing,
          phoneNumber: statusResult.data.phoneNumber || null,
          error: statusResult.error || null
        });
      }
    } catch (error) {
      console.error(`[WhatsApp Context] Error refreshing status for server ${serverId}:`, error);
    }
  }, [updateServer]);

  const refreshAllStatuses = useCallback(async () => {
    try {
      const result = await window.electronAPI.whatsapp.getStatusAll();
      if (result.success && (result as any).statuses) {
        setServers(prev => {
          const next = { ...prev };
          Object.entries((result as any).statuses).forEach(([id, status]: [any, any]) => {
            const sid = Number(id);
            next[sid] = {
              isConnected: status.isReady,
              isConnecting: status.state === 'initializing',
              phoneNumber: status.phoneNumber || null,
              error: status.error || null,
              qrCode: status.state === 'qr' ? prev[sid].qrCode : null
            };
          });
          return next;
        });
      }
    } catch (error) {
      console.error('[WhatsApp Context] Error refreshing all statuses:', error);
    }
  }, []);

  const clearServerState = useCallback((serverId: number) => {
    updateServer(serverId, INITIAL_SERVER_STATE);
  }, [updateServer]);

  useEffect(() => {
    let isMounted = true;
    const cleanupFunctions: (() => void)[] = [];

    const setupListeners = async () => {
      const apiAvailable = await waitForElectronAPI(3000);
      if (!isMounted || !apiAvailable) return;

      console.log('[WhatsApp Context] Setting up multi-session listeners');

      // 1. Status Update
      const unsubscribeStatus = window.electronAPI.whatsapp.onStatus((data: any) => {
        if (!isMounted) return;
        const { serverId, status } = data;
        updateServer(serverId, {
          isConnected: status.isReady,
          isConnecting: status.state === 'initializing',
          phoneNumber: status.phoneNumber || null,
          error: status.error || null
        });
      });
      cleanupFunctions.push(unsubscribeStatus);

      // 2. QR Code
      const unsubscribeQr = window.electronAPI.whatsapp.onQrCode((data: any) => {
        if (!isMounted) return;
        const { serverId, qrCode } = data;
        updateServer(serverId, {
          qrCode,
          isConnecting: true,
          error: null
        });
      });
      cleanupFunctions.push(unsubscribeQr);

      // 3. Ready / Connected
      const unsubscribeReady = window.electronAPI.whatsapp.onReady((data: any) => {
        if (!isMounted) return;
        const { serverId, phoneNumber } = data;
        updateServer(serverId, {
          isConnected: true,
          isConnecting: false,
          qrCode: null,
          error: null,
          phoneNumber: phoneNumber || null
        });
      });
      cleanupFunctions.push(unsubscribeReady);

      // 4. Authenticated
      const unsubscribeAuthenticated = window.electronAPI.whatsapp.onAuthenticated((data: any) => {
        if (!isMounted) return;
        const { serverId } = data;
        updateServer(serverId, { qrCode: null });

        // Timeout check for ready state
        setTimeout(() => {
          setServers(curr => {
            const s = curr[serverId];
            if (s && s.isConnecting && !s.isConnected) {
              return {
                ...curr,
                [serverId]: {
                  ...s,
                  isConnecting: false,
                  error: 'Connection timeout. Please logout and try again.'
                }
              };
            }
            return curr;
          });
        }, 60000);
      });
      cleanupFunctions.push(unsubscribeAuthenticated);

      // 5. Disconnected
      const unsubscribeDisconnected = window.electronAPI.whatsapp.onDisconnected((data: any) => {
        if (!isMounted) return;
        const { serverId } = data;
        updateServer(serverId, {
          isConnected: false,
          isConnecting: false,
          qrCode: null
        });
      });
      cleanupFunctions.push(unsubscribeDisconnected);

      // 6. Reconnecting
      const unsubscribeReconnecting = window.electronAPI.whatsapp.onReconnecting((data: any) => {
        if (!isMounted) return;
        const { serverId } = data;
        updateServer(serverId, {
          isConnected: false,
          isConnecting: true,
          qrCode: null
        });
      })
      if (unsubscribeReconnecting) cleanupFunctions.push(unsubscribeReconnecting);

      // 7. Error
      const unsubscribeError = window.electronAPI.whatsapp.onError((data: any) => {
        if (!isMounted) return;
        const { serverId, error } = data;
        updateServer(serverId, {
          error: error || 'Connection error',
          isConnecting: false,
          qrCode: null
        });
      });
      cleanupFunctions.push(unsubscribeError);

      // 8. Logs
      const unsubscribeLog = window.electronAPI.whatsapp.onLog((data: any) => {
        const { serverId, message } = data;
        console.log(`[BACKEND SERVER ${serverId}] ${message}`);
      });
      if (unsubscribeLog) cleanupFunctions.push(unsubscribeLog);

      // Initial Sync
      refreshAllStatuses();
    };

    setupListeners();

    return () => {
      isMounted = false;
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [updateServer, refreshAllStatuses]);

  return (
    <WhatsAppContext.Provider
      value={{
        servers,
        // Backward compatibility for components using single-server state
        isConnected: servers[1].isConnected,
        isConnecting: servers[1].isConnecting,
        qrCode: servers[1].qrCode,
        error: servers[1].error,
        phoneNumber: servers[1].phoneNumber,

        refreshStatus,
        refreshAllStatuses,
        clearServerState,
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsApp() {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
}
