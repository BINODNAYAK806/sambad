import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { waitForElectronAPI } from '@/renderer/utils/electronAPI';

interface WhatsAppContextType {
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  error: string | null;
  phoneNumber: string | null; // Logged-in WhatsApp phone number
  setIsConnected: (value: boolean) => void;
  setIsConnecting: (value: boolean) => void;
  setQrCode: (value: string | null) => void;
  setError: (value: string | null) => void;
  setPhoneNumber: (value: string | null) => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cleanupFunctions: (() => void)[] = [];

    const setupListeners = async () => {
      const apiAvailable = await waitForElectronAPI(3000);

      if (!isMounted) return;

      if (!apiAvailable) {
        console.error('[WhatsApp Context] electronAPI not available');
        return;
      }

      console.log('[WhatsApp Context] Setting up listeners');

      const unsubscribeQr = window.electronAPI.whatsapp.onQrCode((qrCode: string) => {
        if (!isMounted) return;
        console.log('[WhatsApp Context] QR Code received');
        setQrCode(qrCode);
        setIsConnecting(true);
        setError(null);
      });
      cleanupFunctions.push(unsubscribeQr);

      const unsubscribeReady = window.electronAPI.whatsapp.onReady((data: { phoneNumber?: string }) => {
        if (!isMounted) return;
        console.log('[WhatsApp Context] Connected and ready, phone:', data?.phoneNumber);
        setIsConnected(true);
        setIsConnecting(false);
        setQrCode(null);
        setError(null);
        if (data?.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
        }
      });
      cleanupFunctions.push(unsubscribeReady);

      const unsubscribeAuthenticated = window.electronAPI.whatsapp.onAuthenticated(() => {
        if (!isMounted) return;
        console.log('[WhatsApp Context] ✅ Authentication successful - waiting for ready state...');
        // Clear QR code immediately after authentication
        setQrCode(null);
        // Keep isConnecting true until READY event

        // Set a timeout in case ready event never fires (e.g., due to markedUnread error)
        setTimeout(() => {
          if (isConnecting && !isConnected) {
            console.error('[WhatsApp Context] ⚠️ Timeout: Ready event not received within 60 seconds');
            setError('Connection timeout. Please try logging out and scanning QR again. If this persists, restart the app.');
            setIsConnecting(false);
          }
        }, 60000); // 60 second timeout
      });
      cleanupFunctions.push(unsubscribeAuthenticated);

      const unsubscribeDisconnected = window.electronAPI.whatsapp.onDisconnected(() => {
        if (!isMounted) return;
        console.log('[WhatsApp Context] Disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        setQrCode(null);
      });
      cleanupFunctions.push(unsubscribeDisconnected);

      const unsubscribeError = window.electronAPI.whatsapp.onError((error: string) => {
        if (!isMounted) return;
        console.error('[WhatsApp Context] Error:', error);
        setError(error || 'Failed to connect to WhatsApp');
        setIsConnecting(false);
        setQrCode(null);
      });
      cleanupFunctions.push(unsubscribeError);

      // LISTEN FOR BACKEND LOGS (Debugging)
      // @ts-ignore
      const unsubscribeLog = window.electronAPI.whatsapp.onLog ? window.electronAPI.whatsapp.onLog((message: string) => {
        console.log(`[BACKEND] ${message}`);
      }) : () => { };
      // @ts-ignore
      if (window.electronAPI.whatsapp.onLog) cleanupFunctions.push(unsubscribeLog);

      // Check initial status
      try {
        const statusResult = await window.electronAPI.whatsapp.getStatus();
        if (statusResult.success && statusResult.data) {
          if (statusResult.data.isConnected) {
            setIsConnected(true);
            setIsConnecting(false);
            if (statusResult.data.phoneNumber) {
              setPhoneNumber(statusResult.data.phoneNumber);
            }
          } else if (statusResult.data.isInitializing) {
            setIsConnecting(true);
          }
        }
      } catch (error) {
        console.error('[WhatsApp Context] Error checking initial status:', error);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  return (
    <WhatsAppContext.Provider
      value={{
        isConnected,
        isConnecting,
        qrCode,
        error,
        phoneNumber,
        setIsConnected,
        setIsConnecting,
        setQrCode,
        setError,
        setPhoneNumber,
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
