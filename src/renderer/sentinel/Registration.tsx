import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RegistrationProps {
    onSuccess: (licenseKey: string) => void;
}

export function Registration({ onSuccess }: RegistrationProps) {
    const [mobile, setMobile] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mobile.length < 10) {
            toast.error('Please enter a valid mobile number');
            return;
        }

        setIsLoading(true);
        try {
            const result = await window.electronAPI.sentinel.register(mobile);
            if (result.success && result.license_key) {
                toast.success(result.message || 'Registration successful');
                onSuccess(result.license_key);
            } else {
                toast.error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to register device');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto border-zinc-800 bg-black/40 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-semibold text-white">
                    Device Registration
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Register this device to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-zinc-300">Mobile Number</Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Smartphone className="h-4 w-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                            </div>
                            <Input
                                id="mobile"
                                placeholder="919999999999"
                                className="pl-9 bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-green-500/50 focus:ring-green-500/20 transition-all font-mono"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                maxLength={15}
                                required
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20 border-0"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Register Device'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
