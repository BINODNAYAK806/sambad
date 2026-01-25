import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, LogIn, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/renderer/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showBackdoor, setShowBackdoor] = useState(false);
    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const info = await window.electronAPI.app.getInfo();
                setAppVersion(info.version);
            } catch (error) {
                console.error('Failed to fetch app version:', error);
            }
        };
        fetchVersion();
    }, []);

    const [challenge, setChallenge] = useState<string>('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- Challenge Response Logic ---
        if (showBackdoor) {
            if (!password) {
                toast.error('Please enter the Unlock Key');
                return;
            }

            setLoading(true);
            try {
                const result = await window.electronAPI.auth.verifySupportCode(challenge, password);
                if (result.success) {
                    toast.success('Emergency Access Granted');
                    login(result.data);
                    navigate('/');
                } else {
                    toast.error(result.error || 'Invalid Unlock Key');
                }
            } catch (err: any) {
                toast.error('Verification failed');
            } finally {
                setLoading(false);
            }
            return;
        }

        // --- Standard Login Logic ---
        if (!username || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const result = await window.electronAPI.userAuth.login(username, password);
            if (result.success) {
                toast.success(`Welcome back, ${result.data.username}!`);
                login(result.data);
                navigate('/');
            } else {
                toast.error(result.message || 'Login failed');
            }
        } catch (err: any) {
            toast.error('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const toggleBackdoor = () => {
        // Secret trigger: clicking the shield icon 5 times
        const trigger = (e: React.MouseEvent) => {
            if (e.detail === 5) {
                setShowBackdoor(true);
                setUsername('backdoor');

                // Fetch Challenge Code
                window.electronAPI.auth.getSupportChallenge().then((res: any) => {
                    if (res.success && res.data?.challenge) {
                        setChallenge(res.data.challenge);
                        toast.info('Emergency access mode enabled');
                    } else {
                        toast.error('Failed to generate challenge');
                        setShowBackdoor(false);
                    }
                });
            }
        };
        return trigger;
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

            <Card className="w-full max-w-md border-zinc-800 bg-black/40 backdrop-blur-xl border-white/5 shadow-2xl relative z-10">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div
                        className="relative mx-auto inline-block group mb-2 cursor-pointer"
                        onClick={toggleBackdoor()}
                    >
                        <div className="absolute -inset-1 bg-green-500/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                        {showBackdoor ? (
                            <ShieldAlert className="w-16 h-16 text-red-500 relative z-10 animate-pulse" />
                        ) : (
                            <img src="./sidelogo.png" alt="Wapro Logo" className="relative z-10 w-40 h-40 object-contain drop-shadow-2xl" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-white">
                            {showBackdoor ? 'Emergency Access' : 'Welcome to Wapro'}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 mt-2 font-medium">
                            {showBackdoor
                                ? 'Use the Admin Tool to generate an Unlock Key for this Request Code'
                                : 'Smart Marketing . Safe Sending'
                            }
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            {showBackdoor ? (
                                // --- Backdoor UI ---
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                                            Request Code (Share with Admin)
                                        </label>
                                        <div className="flex items-center justify-center p-3 bg-zinc-900/50 rounded-md border border-zinc-800 text-lg font-mono font-bold tracking-widest text-white select-all">
                                            {challenge || 'Generating...'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                                            <Lock className="w-4 h-4 text-zinc-500" />
                                            Unlock Key
                                        </label>
                                        <Input
                                            placeholder="UNLOCK-XXXX-XXXX"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="font-mono text-center uppercase bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-red-500/20"
                                            autoFocus
                                        />
                                    </div>
                                </>
                            ) : (
                                // --- Standard UI ---
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-zinc-300">
                                            <User className="w-4 h-4 text-zinc-500" />
                                            Username
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            disabled={loading}
                                            autoComplete="username"
                                            className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:ring-green-500/20 h-12 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-zinc-300">
                                            <Lock className="w-4 h-4 text-zinc-500" />
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={loading}
                                                autoComplete="current-password"
                                                className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:ring-green-500/20 h-12 transition-all pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className={`w-full h-12 text-lg font-semibold transition-all hover:shadow-lg shadow-green-900/20 border-0 group ${showBackdoor ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'}`}
                            disabled={loading || (showBackdoor && !challenge)}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                    Verifying...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {showBackdoor ? 'Verify & Unlock' : 'Sign In'}
                                    <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 pb-8 border-t border-white/5 pt-6 bg-white/5">
                    <p className="text-xs text-zinc-500 font-mono">
                        Wapro v{appVersion || '...'} • Local Secure Node
                    </p>

                    {!showBackdoor && (
                        <div className="h-4"></div>
                    )}

                    {showBackdoor && (
                        <Button
                            variant="link"
                            className="text-zinc-400 hover:text-white text-xs h-auto p-0"
                            onClick={() => { setShowBackdoor(false); setUsername(''); }}
                        >
                            Return to standard login
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Background decoration */}
            <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
}
