import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/renderer/contexts/AuthContext';
import { UserManagement } from '@/renderer/components/UserManagement';
import { BusinessProfile } from '@/renderer/components/BusinessProfile';
import { ChromiumSettings } from '@/renderer/components/ChromiumSettings';
import { MultiServerSettings } from '@/renderer/components/MultiServerSettings';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Database, Loader2, MessageCircle } from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [appInfo, setAppInfo] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update state
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Listen for update events
    const removeAvailable = window.electronAPI.updater.onUpdateAvailable((info) => {
      setUpdateStatus('available');
      setUpdateInfo(info);
    });

    const removeNotAvailable = window.electronAPI.updater.onUpdateNotAvailable(() => {
      setUpdateStatus('not-available');
    });

    const removeProgress = window.electronAPI.updater.onDownloadProgress((progress) => {
      setUpdateStatus('downloading');
      setDownloadProgress(progress.percent);
    });

    const removeDownloaded = window.electronAPI.updater.onUpdateDownloaded((info) => {
      setUpdateStatus('downloaded');
      setUpdateInfo(info);
    });

    const removeError = window.electronAPI.updater.onUpdateError((error) => {
      setUpdateStatus('error');
      setErrorMessage(error);
    });

    return () => {
      removeAvailable();
      removeNotAvailable();
      removeProgress();
      removeDownloaded();
      removeError();
    };
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      await window.electronAPI.updater.checkForUpdates();
    } catch (error: any) {
      setUpdateStatus('error');
      setErrorMessage(error.message || 'Failed to check for updates');
    }
  };

  useEffect(() => {
    const fetchAppInfo = async () => {
      try {
        const info = await window.electronAPI.app.getInfo();
        setAppInfo(info);
      } catch (error) {
        console.error('Failed to fetch app info:', error);
      }
    };
    fetchAppInfo();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">Configure your application preferences</p>
        </div>
        {appInfo && (
          <div className="text-right">
            <Badge variant="outline" className="text-sm">
              v{appInfo.version}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Electron {appInfo.electron}
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue={isAdmin ? "whatsapp-servers" : "notifications"} className="space-y-4">
        <TabsList className="bg-muted/50 border h-auto p-1 overflow-x-auto justify-start">
          <TabsTrigger value="whatsapp-servers" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp Servers
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="business-profile">Business Profile</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {isAdmin && <TabsTrigger value="chromium">Chromium</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp-servers" className="space-y-4">
          <MultiServerSettings />
        </TabsContent>



        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Campaign complete notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a campaign finishes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Error notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when errors occur
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connection status notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about WhatsApp connection changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {
          isAdmin && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )
        }
        {
          isAdmin && (
            <TabsContent value="business-profile">
              <BusinessProfile />
            </TabsContent>
          )
        }

        {
          isAdmin && (
            <TabsContent value="chromium" className="space-y-4">
              <ChromiumSettings />
            </TabsContent>
          )
        }

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Backup and restore your database for data transfer between devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {backupMessage && (
                <div className={`p-3 rounded-md text-sm ${backupMessage.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                  {backupMessage.text}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Backup Database</Label>
                    <p className="text-sm text-muted-foreground">
                      Export your contacts, campaigns, and media files to a backup file
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      setIsBackingUp(true);
                      setBackupMessage(null);
                      try {
                        const result = await window.electronAPI.database.backup();
                        if (result.success) {
                          setBackupMessage({ type: 'success', text: result.message || 'Backup created successfully!' });
                        } else {
                          setBackupMessage({ type: 'error', text: result.error || 'Backup failed' });
                        }
                      } catch (err: any) {
                        setBackupMessage({ type: 'error', text: err.message || 'Backup failed' });
                      }
                      setIsBackingUp(false);
                    }}
                    disabled={isBackingUp || isRestoring}
                    className="min-w-[140px]"
                  >
                    {isBackingUp ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Backing up...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Backup</>
                    )}
                  </Button>
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Restore Database</Label>
                    <p className="text-sm text-muted-foreground">
                      Import data from a backup file. This will replace all current data.
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ Warning: This will overwrite your existing data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setIsRestoring(true);
                      setBackupMessage(null);
                      try {
                        const result = await window.electronAPI.database.restore();
                        if (result.success) {
                          setBackupMessage({ type: 'success', text: result.message || 'Database restored! Please restart the app.' });
                        } else {
                          setBackupMessage({ type: 'error', text: result.error || 'Restore failed' });
                        }
                      } catch (err: any) {
                        setBackupMessage({ type: 'error', text: err.message || 'Restore failed' });
                      }
                      setIsRestoring(false);
                    }}
                    disabled={isBackingUp || isRestoring}
                    className="min-w-[140px]"
                  >
                    {isRestoring ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Restoring...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> Restore</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Sambad</CardTitle>
              <CardDescription>Application and system information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {appInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Application Name</Label>
                    <p className="font-medium">{appInfo.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Version</Label>
                    <p className="font-medium">{appInfo.version}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Platform</Label>
                    <p className="font-medium">{appInfo.platform}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Architecture</Label>
                    <p className="font-medium">{appInfo.arch}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Electron</Label>
                    <p className="font-medium">{appInfo.electron}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Chrome</Label>
                    <p className="font-medium">{appInfo.chrome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Node.js</Label>
                    <p className="font-medium">{appInfo.node}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">V8</Label>
                    <p className="font-medium">{appInfo.v8}</p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t space-y-4">
                <h3 className="text-sm font-medium">Software Update</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {updateStatus === 'idle' && 'Check for latest version'}
                      {updateStatus === 'checking' && 'Checking for updates...'}
                      {updateStatus === 'available' && `New version ${updateInfo?.version} is available!`}
                      {updateStatus === 'downloading' && `Downloading update... ${downloadProgress}%`}
                      {updateStatus === 'downloaded' && 'Update ready to install!'}
                      {updateStatus === 'not-available' && 'You are up to date!'}
                      {updateStatus === 'error' && 'Error checking for updates'}
                    </p>
                    {updateStatus === 'error' && errorMessage && (
                      <p className="text-xs text-destructive">{errorMessage}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {updateStatus === 'idle' || updateStatus === 'checking' || updateStatus === 'not-available' || updateStatus === 'error' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCheckForUpdates}
                        disabled={updateStatus === 'checking'}
                      >
                        {updateStatus === 'checking' ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
                        ) : (
                          'Check for Updates'
                        )}
                      </Button>
                    ) : null}

                    {updateStatus === 'available' && (
                      <Button size="sm" onClick={() => window.electronAPI.updater.downloadUpdate()}>
                        Download Now
                      </Button>
                    )}

                    {updateStatus === 'downloaded' && (
                      <Button size="sm" onClick={() => window.electronAPI.updater.installUpdate()}>
                        Restart to Install
                      </Button>
                    )}
                  </div>
                </div>

                {updateStatus === 'downloading' && (
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  © 2025 Sambad. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}
