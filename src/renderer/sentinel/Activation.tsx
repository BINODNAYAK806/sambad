import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ActivationProps {
    initialKey?: string;
    onBack: () => void;
}

export function Activation({ initialKey = '', onBack }: ActivationProps) {
    const [licenseKey, setLicenseKey] = useState(initialKey);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseKey) {
            toast.error('Please enter a license key');
            return;
        }

        setIsLoading(true);
        try {
            const result = await window.electronAPI.sentinel.activate(licenseKey);
            if (result.success) {
                toast.success('Activation successful! Launching app...');
                // App will launch automatically from main process
            } else {
                toast.error(`Activation failed: ${result.reason || 'Invalid key'}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to actviate license');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto border-zinc-800 bg-black/40 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-semibold text-white">
                    Activate License
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Enter your license key to continue.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="key" className="text-zinc-300">License Key</Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-4 w-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                            </div>
                            <Input
                                id="key"
                                placeholder="XXXX-XXXX-XXXX"
                                className="pl-9 font-mono tracking-widest uppercase bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:ring-green-500/20 transition-all text-center"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onBack}
                            disabled={isLoading}
                            className="text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20 border-0"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Activate Now'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
