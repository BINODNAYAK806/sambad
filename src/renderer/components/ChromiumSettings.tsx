import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FolderOpen, Check, AlertCircle } from 'lucide-react';

export function ChromiumSettings() {
    const [customPath, setCustomPath] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadCurrentPath();
    }, []);

    const loadCurrentPath = async () => {
        try {
            const result = await window.electronAPI.chromium.getPath();
            if (result.success && result.data) {
                setCurrentPath(result.data.customPath || '');
                setCustomPath(result.data.customPath || '');
            }
        } catch (error) {
            console.error('Failed to load Chromium path:', error);
        }
    };

    const handleBrowse = async () => {
        toast.info('Please enter the full path to chrome.exe');
    };

    const handleSave = async () => {
        if (!customPath.trim()) {
            toast.error('Please enter a Chromium path');
            return;
        }

        const lowercasePath = customPath.toLowerCase();
        if (!lowercasePath.endsWith('chrome.exe') && !lowercasePath.endsWith('chromium.exe')) {
            toast.error('Path must point to chrome.exe (Chromium executable)');
            return;
        }

        setIsLoading(true);
        try {
            const result = await window.electronAPI.chromium.setPath(customPath);
            if (result.success) {
                setCurrentPath(customPath);
                toast.success('Chromium path saved! Please restart the app for changes to take effect.');
            } else {
                toast.error(result.error || 'Failed to save path');
            }
        } catch (error) {
            toast.error('Failed to save Chromium path');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chromium Configuration</CardTitle>
                <CardDescription>
                    Configure custom Chromium browser path. This allows the app to work on any PC with different folder structures.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentPath && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                        <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">Current Chromium Path:</p>
                                <p className="text-sm text-green-700 dark:text-green-300 font-mono break-all mt-1">
                                    {currentPath}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="chromium-path">Custom Chromium Path</Label>
                        <div className="flex gap-2">
                            <Input
                                id="chromium-path"
                                placeholder="C:\Sambad\chromium\chrome-win\chrome.exe"
                                value={customPath}
                                onChange={(e) => setCustomPath(e.target.value)}
                                className="font-mono text-sm"
                            />
                            <Button variant="outline" size="icon" onClick={handleBrowse}>
                                <FolderOpen className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Enter the full path to Chromium executable (chrome.exe)
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-blue-900 dark:text-blue-100">Common Chromium Paths:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 font-mono text-xs">
                                    <li>C:\Sambad\chromium\chrome-win\chrome.exe</li>
                                    <li>D:\Apps\chromium\chrome-win\chrome.exe</li>
                                    <li>E:\Sambad\chromium\chrome-win\chrome.exe</li>
                                </ul>
                                <p className="mt-2 text-blue-700 dark:text-blue-300">
                                    You can install Chromium anywhere and configure the path here. The app will use this path instead of searching automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isLoading} className="w-full">
                        {isLoading ? 'Saving...' : 'Save Chromium Path'}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        ⚠️ You must restart the app after changing the Chromium path
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
