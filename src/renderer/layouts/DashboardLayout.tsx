import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

import { AddContactDialog } from '../components/AddContactDialog';
import { CampaignDialog } from '../components/CampaignDialog';
import { useDialogs } from '../contexts/DialogContext';
import { Minus, Square, X } from 'lucide-react';

export function DashboardLayout() {
  const {
    addContactDialogOpen,
    setAddContactDialogOpen,
    campaignDialogOpen,
    setCampaignDialogOpen
  } = useDialogs();

  // Helper to refresh data if needed when dialogs close successfully
  const handleDialogSuccess = () => {
    // Rely on local page state or global events instead of full reload
    console.log('[Dashboard] Dialog success - avoiding page reload');
  };

  const openWhatsApp = (number: string) => {
    const formattedNumber = number.replace(/\s+/g, '').replace('+', '');
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Custom Title Bar */}
      <div
        className="flex items-center justify-between h-9 px-3 bg-white border-b shrink-0 select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left side - Empty draggable space */}
        <div className="flex-1" />

        {/* Center - Customer Support */}
        <div className="flex items-center gap-4 text-xs" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <span className="text-gray-500">Customer Support:</span>

          <button
            onClick={() => openWhatsApp('+91 70965 76502')}
            className="flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>+91 70965 76502</span>
          </button>

          <button
            onClick={() => openWhatsApp('+971 52 327 3730')}
            className="flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>+971 52 327 3730</span>
          </button>
        </div>

        {/* Right spacer to balance centering */}
        <div className="flex-1" />

        {/* Right side - Window controls */}
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => window.electronAPI.window.minimize()}
            className="flex items-center justify-center w-10 h-9 hover:bg-gray-100 transition-colors"
          >
            <Minus className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => window.electronAPI.window.maximize()}
            className="flex items-center justify-center w-10 h-9 hover:bg-gray-100 transition-colors"
          >
            <Square className="h-3 w-3 text-gray-600" />
          </button>
          <button
            onClick={() => window.electronAPI.window.close()}
            className="flex items-center justify-center w-10 h-9 hover:bg-red-500 transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Layout - Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-background to-muted/20">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <AddContactDialog
        open={addContactDialogOpen}
        onOpenChange={setAddContactDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <CampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
