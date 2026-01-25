import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Smartphone, Rocket, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ActivationPageProps {
    onActivated: () => void;
}

export function ActivationPage({ onActivated }: ActivationPageProps) {
    const [licenseKey, setLicenseKey] = useState('');
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseKey || !mobile) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const result = await window.electronAPI.license.activate(licenseKey, mobile);
            if (result.success) {
                toast.success('Activation successful!');
                onActivated();
            } else {
                toast.error(result.message || 'Activation failed');
            }
        } catch (err: any) {
            toast.error('An error occurred during activation');
        } finally {
            setLoading(false);
        }
    };

    const openRegistration = () => {
        // Replace with actual registration URL
        window.open('https://sambad.app/register', '_blank');
    };

    const handleStartTrial = async () => {
        if (!mobile) {
            toast.error('Please enter your mobile number for the trial');
            return;
        }

        setLoading(true);
        try {
            const result = await window.electronAPI.license.startTrial(mobile);
            if (result.success) {
                toast.success('3-Day Free Trial Started!');
                onActivated();
            } else {
                toast.error(result.message || 'Failed to start trial');
            }
        } catch (err: any) {
            toast.error('An error occurred while starting the trial');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <Card className="w-full max-w-md border-primary/20 shadow-2xl overflow-hidden backdrop-blur-sm bg-background/80">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 animate-pulse">
                        <Rocket className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold tracking-tight">Activate Sambad</CardTitle>
                        <CardDescription className="text-muted-foreground mt-2">
                            Enter your license key or start a free trial
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleActivate} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                    <Key className="w-4 h-4 text-primary" />
                                    License Key
                                </label>
                                <Input
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    disabled={loading}
                                    className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 text-center font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-primary" />
                                    Registered Mobile Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                                        +91
                                    </div>
                                    <Input
                                        placeholder="9876543210"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        disabled={loading}
                                        className="pl-12 bg-background/50 border-primary/20 focus-visible:ring-primary h-12"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-semibold transition-all hover:shadow-lg hover:shadow-primary/20 group"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                                        Activating...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Activate Now
                                        <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </div>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full h-12 text-md font-medium border-primary/10 hover:bg-primary/5"
                                onClick={handleStartTrial}
                                disabled={loading}
                            >
                                Start 3-Day Free Trial
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 pb-8 border-t border-primary/5 pt-6 bg-primary/5">
                    <p className="text-sm text-muted-foreground">
                        Don't have a license key yet?
                    </p>
                    <Button
                        variant="outline"
                        className="w-full h-11 border-primary/20 hover:bg-primary/10 transition-colors flex items-center gap-2"
                        onClick={openRegistration}
                        type="button"
                    >
                        Register Company
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
