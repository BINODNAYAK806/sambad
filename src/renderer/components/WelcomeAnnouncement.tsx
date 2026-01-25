import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function WelcomeAnnouncement() {
  const [isOpen, setIsOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        if (window.electronAPI?.app?.getInfo) {
          const info = await window.electronAPI.app.getInfo();
          const currentVersion = info.version;
          setAppVersion(currentVersion);

          const storedVersion = localStorage.getItem('wapro_last_announcement_version');
          
          // Show if first time OR if version changed
          if (!storedVersion || storedVersion !== currentVersion) {
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Failed to get app info:', error);
      }
    };

    checkVersion();
  }, []);

  const handleClose = () => {
    if (appVersion) {
      localStorage.setItem('wapro_last_announcement_version', appVersion);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-2xl">
        <div className="relative group">
          <img 
            src="/grand-launch.png" 
            alt="Wapro Grand Launch" 
            className="w-full h-auto rounded-lg shadow-2xl border-2 border-white/10"
          />
          
          {/* Main Action Overlay */}
          <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <Button 
                onClick={handleClose}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold py-6 px-12 rounded-full shadow-2xl transform transition hover:scale-105"
             >
                GET STARTED NOW
             </Button>
          </div>
          
          {/* Close Icon */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all z-50 backdrop-blur-sm"
          >
            <X size={20} />
          </button>
          
          {/* Mobile/Default button visible */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center lg:hidden">
              <Button 
                onClick={handleClose}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold py-4 px-8 rounded-full shadow-lg"
              >
                GET STARTED NOW
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
