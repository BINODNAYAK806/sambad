import { Router } from './Router';
import { Toaster } from '@/components/ui/sonner';
import { ElectronCheck } from './components/ElectronCheck';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { AuthProvider } from './contexts/AuthContext';


function App() {
  return (
    <ElectronCheck>
      <WhatsAppProvider>
        <AuthProvider>
          <SidebarProvider>
            <Router />
            <Toaster />
          </SidebarProvider>
        </AuthProvider>
      </WhatsAppProvider>
    </ElectronCheck>
  );
}

export default App;
