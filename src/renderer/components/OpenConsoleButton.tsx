import { Button } from '../../components/ui/button';
import { Terminal } from 'lucide-react';

export default function OpenConsoleButton() {
  const handleOpenConsole = async () => {
    await window.electronAPI.console.open();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleOpenConsole}>
      <Terminal className="mr-2 h-4 w-4" />
      Open Console
    </Button>
  );
}
