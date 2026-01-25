import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Home, Users, Send, Settings, Menu, X, Info } from 'lucide-react';

type AppInfo = {
  name: string;
  version: string;
  platform: string;
  electron: string;
  chrome: string;
  node: string;
};

function App() {
  const [activeView, setActiveView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppInfo().then(setAppInfo);
    }
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-slate-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Sambad</h1>
          <p className="text-slate-400 text-sm mt-1">Communication Platform</p>
        </div>

        <nav className="flex-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeView === item.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {appInfo && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-3 h-3" />
              <span>v{appInfo.version}</span>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {navItems.find(item => item.id === activeView)?.label || 'Home'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Connected
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeView === 'home' && <HomeView appInfo={appInfo} />}
          {activeView === 'contacts' && <ContactsView />}
          {activeView === 'campaigns' && <CampaignsView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function HomeView({ appInfo }: { appInfo: AppInfo | null }) {
  const [name, setName] = useState('');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl">Welcome to Sambad</CardTitle>
          <CardDescription className="text-base">
            Your production-grade communication platform built with Electron, React, and TypeScript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3">
            <Button size="lg">Get Started</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">Learn More</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Sambad</DialogTitle>
                  <DialogDescription>
                    Sambad is a modern desktop application designed for scalable communication workflows.
                    Built with cutting-edge technologies for performance and reliability.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold mb-2">Core Features</h4>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Contact management system</li>
                      <li>• Campaign automation</li>
                      <li>• Real-time messaging</li>
                      <li>• Worker threads for background tasks</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="name">Quick Example - Input Component</Label>
            <div className="flex gap-3">
              <Input
                id="name"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={() => alert(`Hello, ${name || 'there'}!`)}>
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {appInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">System Information</CardTitle>
            <CardDescription>Electron app details from secure IPC</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-700">Platform</dt>
                <dd className="text-slate-600">{appInfo.platform}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Version</dt>
                <dd className="text-slate-600">{appInfo.version}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Electron</dt>
                <dd className="text-slate-600">{appInfo.electron}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Chrome</dt>
                <dd className="text-slate-600">{appInfo.chrome}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700">Node.js</dt>
                <dd className="text-slate-600">{appInfo.node}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 text-white border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl">Ready for Production</CardTitle>
          <CardDescription className="text-slate-400">
            Built with best practices and security in mind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-emerald-400">✓</div>
              <div className="text-sm font-semibold">Secure IPC</div>
              <div className="text-xs text-slate-400">contextBridge enabled</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-emerald-400">✓</div>
              <div className="text-sm font-semibold">TypeScript</div>
              <div className="text-xs text-slate-400">Fully typed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-emerald-400">✓</div>
              <div className="text-sm font-semibold">Modern UI</div>
              <div className="text-xs text-slate-400">shadcn/ui + Tailwind</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactsView() {
  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>Manage your contact list</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Contact management module will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignsView() {
  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Create and manage messaging campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Campaign automation module will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your application preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">Settings and configuration will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
