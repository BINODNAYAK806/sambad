import { createContext, useContext, useState, ReactNode } from 'react';

interface DialogContextType {
  addContactDialogOpen: boolean;
  setAddContactDialogOpen: (open: boolean) => void;
  campaignDialogOpen: boolean;
  setCampaignDialogOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);

  return (
    <DialogContext.Provider
      value={{
        addContactDialogOpen,
        setAddContactDialogOpen,
        campaignDialogOpen,
        setCampaignDialogOpen,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialogs must be used within a DialogProvider');
  }
  return context;
}
