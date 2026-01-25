import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Registration } from './Registration';
import { Activation } from './Activation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export function Sentinel() {
    const [view, setView] = useState<'registration' | 'activation'>('registration');
    const [licenseKeyHint, setLicenseKeyHint] = useState('');
    const [errorReason, setErrorReason] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string>('unknown');

    const location = useLocation();

    useEffect(() => {
        // Parse query params for reason (passed from main process)
        const params = new URLSearchParams(location.search);
        const reason = params.get('reason');

        if (reason) {
            setErrorReason(reason);
        }

        // Fetch device ID for display
        if (window.electronAPI?.sentinel?.getDeviceId) {
            window.electronAPI.sentinel.getDeviceId().then(setDeviceId).catch(console.error);
        }
    }, [location]);

    const handleRegistrationSuccess = (key: string) => {
        setLicenseKeyHint(key);
        setView('activation');
    };

    const getErrorMessage = (reason: string) => {
        switch (reason) {
            case 'expired': return 'Your license has expired. Please renew or register a new one.';
            case 'device_mismatch': return 'Device identity mismatch. Usage on this device is not authorized.';
            case 'suspended': return 'Your license has been suspended.';
            case 'error': return 'A security error occurred. Please contact support.';
            default: return 'Security check failed. Please re-authenticate.';
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black text-white overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                <div className="mb-8 text-center space-y-4">
                    <div className="relative inline-block group mb-4">
                        <div className="absolute -inset-1 bg-green-500/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                        <img src="./sidelogo.png" alt="Wapro Logo" className="relative z-10 w-48 h-48 object-contain drop-shadow-2xl" />
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                            Welcome to Wapro
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium">
                            Smart Marketing . Safe Sending
                        </p>
                    </div>
                </div>

                {errorReason && errorReason !== 'missing' && (
                    <Alert variant="destructive" className="w-full mb-6 border-red-500/20 bg-red-500/10 text-red-200 backdrop-blur-md">
                        <ShieldAlert className="h-4 w-4 text-red-400" />
                        <AlertTitle className="text-red-400 font-semibold">Access Verification Failed</AlertTitle>
                        <AlertDescription className="text-red-200/80 text-xs">
                            {getErrorMessage(errorReason)}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="w-full transition-all duration-500 ease-in-out">
                    {view === 'registration' ? (
                        <>
                            <Registration onSuccess={handleRegistrationSuccess} />
                            <div className="mt-6 text-center">
                                <p className="text-xs text-zinc-500">
                                    Already have a license key?{' '}
                                    <button
                                        onClick={() => setView('activation')}
                                        className="text-green-400 hover:text-green-300 font-medium transition-colors hover:underline underline-offset-4"
                                    >
                                        Activate here
                                    </button>
                                </p>
                            </div>
                        </>
                    ) : (
                        <Activation
                            initialKey={licenseKeyHint}
                            onBack={() => setView('registration')}
                        />
                    )}
                </div>

                <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                        DEVICE ID: {deviceId}
                    </div>
                </div>
            </div>
        </div>
    );
}
