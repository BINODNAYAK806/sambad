import { useLocation, useNavigate } from 'react-router-dom';
import { User, Plus, LogOut, Settings, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWhatsApp } from '../contexts/WhatsAppContext';
import { useDialogs } from '../contexts/DialogContext';
import { useAuth } from '@/renderer/contexts/AuthContext';
import { useEffect, useState } from 'react';

const pageLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/contacts': 'Contacts',
  '/groups': 'Groups',
  '/campaigns': 'Campaigns',
  '/reports': 'Reports',
  '/console': 'Console',
  '/settings': 'Settings',
};

const pageBreadcrumbs: Record<string, string[]> = {
  '/': ['Home'],
  '/contacts': ['Management', 'Contacts'],
  '/groups': ['Management', 'Groups'],
  '/campaigns': ['Marketing', 'Campaigns'],
  '/reports': ['Analytics', 'Reports'],
  '/console': ['System', 'Console'],
  '/settings': ['System', 'Settings'],
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const pageTitle = pageLabels[location.pathname] || 'Dashboard';
  const breadcrumbs = pageBreadcrumbs[location.pathname] || ['Home'];
  const { isConnected } = useWhatsApp();
  const { setAddContactDialogOpen, setCampaignDialogOpen } = useDialogs();

  const [businessName, setBusinessName] = useState('My Account');
  const [businessLogo, setBusinessLogo] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Check if profile API exists (it might not if preload didn't update yet)
      if (window.electronAPI?.profile) {
        const res = await window.electronAPI.profile.get();
        if (res.success && res.data) {
          if (res.data.business_name) setBusinessName(res.data.business_name);
          if (res.data.logo_path) setBusinessLogo(res.data.logo_path);
        }
      }
    } catch (error) {
      console.error('Failed to load profile for header:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/50 backdrop-blur-xl px-6 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {crumb}
              {index < breadcrumbs.length - 1 && (
                <span className="text-muted-foreground/50">/</span>
              )}
            </span>
          ))}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => setAddContactDialogOpen(true)}
          className="gap-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white border-0"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
        <Button
          size="sm"
          onClick={() => setCampaignDialogOpen(true)}
          className="gap-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white border-0"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full h-9 w-9 hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg
                    viewBox="0 0 48 48"
                    className="w-9 h-9"
                  >
                    <circle cx="24" cy="24" r="24" fill="#25D366" />
                    <path
                      d="M35,12.5C32.3,9.8,28.7,8.2,24.8,8c-8,0-14.5,6.5-14.5,14.5c0,2.6,0.7,5.1,2,7.3l-2.1,7.8l8-2.1c2.1,1.2,4.5,1.8,7,1.8h0c8,0,14.5-6.5,14.5-14.5C39.7,18.8,37.7,15.2,35,12.5z M24.8,33.8L24.8,33.8c-2.2,0-4.4-0.6-6.3-1.7l-0.5-0.3l-4.6,1.2l1.2-4.5l-0.3-0.5c-1.2-2-1.8-4.2-1.8-6.5c0-6.7,5.5-12.1,12.2-12.1c3.3,0,6.3,1.3,8.6,3.6c2.3,2.3,3.6,5.4,3.6,8.6C36.9,28.3,31.5,33.8,24.8,33.8z M31.4,25.2c-0.4-0.2-2.1-1-2.4-1.1c-0.3-0.1-0.6-0.2-0.8,0.2c-0.2,0.4-0.9,1.1-1.1,1.3c-0.2,0.2-0.4,0.3-0.7,0.1c-0.4-0.2-1.5-0.6-2.9-1.8c-1.1-1-1.8-2.1-2-2.5c-0.2-0.4,0-0.6,0.2-0.8c0.2-0.2,0.4-0.4,0.6-0.7c0.2-0.2,0.3-0.4,0.4-0.6c0.1-0.2,0.1-0.4,0-0.7c-0.1-0.2-0.8-1.9-1.1-2.6c-0.3-0.7-0.6-0.6-0.8-0.6c-0.2,0-0.5,0-0.7,0c-0.2,0-0.7,0.1-1,0.5c-0.4,0.4-1.3,1.3-1.3,3.1c0,1.8,1.3,3.6,1.5,3.8c0.2,0.2,2.6,4,6.3,5.6c0.9,0.4,1.6,0.6,2.1,0.8c0.9,0.3,1.7,0.2,2.3,0.1c0.7-0.1,2.1-0.9,2.4-1.7c0.3-0.8,0.3-1.5,0.2-1.7C32.1,25.5,31.8,25.4,31.4,25.2z"
                      fill="white"
                    />
                  </svg>
                  {isConnected && (
                    <Badge
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-green-500 hover:bg-green-500 border-2 border-background shadow-lg animate-pulse"
                    >
                      ✓
                    </Badge>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {isConnected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-primary/20"
            >
              <Avatar className="h-8 w-8">
                {businessLogo ? (
                  <AvatarImage src={businessLogo} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-semibold">{businessName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/settings')}>
              <UserCircle className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
