import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Users, FolderKanban, Megaphone, FileText, Settings, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '../contexts/SidebarContext';

const menuItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/groups', label: 'Groups', icon: FolderKanban },
  { path: '/extractor', label: 'Data Extractor', icon: Database },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
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

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out group",
          isCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        <div className={cn(
          "flex h-16 items-center border-b transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "gap-2 px-6"
        )}>
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            isCollapsed && "flex-col gap-0"
          )}>
            {isCollapsed ? (
              <Megaphone className="h-6 w-6 text-primary transition-all duration-300" />
            ) : (
              /* Replace Text with Image */
              <img
                src="sidelogo.png"
                alt="Wapro"
                className="sidebar-logo max-w-[140px] h-auto object-contain transition-all duration-300"
              />
            )}
            {/* 
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text animate-in fade-in-0 slide-in-from-left-2 duration-300">
                Pingo
              </h1>
            )} 
            */}
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            const button = (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  isCollapsed ? "justify-center px-2" : "justify-start",
                  isActive && [
                    "bg-primary/10 font-medium text-primary",
                    "border-l-2 border-primary shadow-sm",
                    "hover:bg-primary/15"
                  ],
                  !isActive && "hover:bg-accent"
                )}
                asChild
              >
                <Link to={item.path}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "scale-110"
                  )} />
                  {!isCollapsed && (
                    <span className="transition-opacity duration-300">
                      {item.label}
                    </span>
                  )}
                </Link>
              </Button>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        <Separator />

        <div className={cn(
          "p-3 transition-all duration-300",
          isCollapsed && "px-2"
        )}>
          <div className={cn(
            "rounded-lg bg-gradient-to-br from-muted to-muted/50 p-3 text-sm transition-all duration-300",
            isCollapsed && "p-2"
          )}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-center font-semibold text-muted-foreground text-xs">v1.2</p>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Version {appVersion || '...'}
                </TooltipContent>
              </Tooltip>
            ) : (
              <p className="font-medium text-muted-foreground animate-in fade-in-0 duration-300">
                Version {appVersion || '...'}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute -right-4 top-20 z-50 h-9 w-9 rounded-full border-2 bg-gradient-to-br from-background to-muted shadow-lg transition-all duration-300",
            "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0",
            "hover:scale-110 hover:shadow-xl hover:border-primary/50 active:scale-95",
            "backdrop-blur-sm"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-foreground" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-foreground" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
