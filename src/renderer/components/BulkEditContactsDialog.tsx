import { useState } from 'react';
import { Loader2, AlertCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Contact } from '../types/electron';
import { toast } from 'sonner';

interface BulkEditContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSuccess: () => void;
}

export function BulkEditContactsDialog({
  open,
  onOpenChange,
  contacts,
  onSuccess,
}: BulkEditContactsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('variables');

  const [variables, setVariables] = useState({
    v1: '',
    v2: '',
    v3: '',
    v4: '',
    v5: '',
    v6: '',
    v7: '',
    v8: '',
    v9: '',
    v10: '',
  });

  const [variableMode, setVariableMode] = useState<'replace' | 'append'>('replace');
  const [selectedVariables, setSelectedVariables] = useState<Set<string>>(new Set());

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
    if (value) {
      setSelectedVariables((prev) => new Set([...prev, key]));
    } else {
      setSelectedVariables((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleSubmit = async () => {
    if (contacts.length === 0) {
      toast.error('No contacts selected');
      return;
    }

    if (activeTab === 'variables' && selectedVariables.size === 0) {
      toast.error('Please enter at least one variable to update');
      return;
    }

    try {
      setIsLoading(true);

      const variablesToUpdate: Record<string, string> = {};
      selectedVariables.forEach((key) => {
        if (variables[key as keyof typeof variables]) {
          variablesToUpdate[key] = variables[key as keyof typeof variables];
        }
      });

      let successCount = 0;
      let failedCount = 0;

      for (const contact of contacts) {
        try {
          const updatedVariables =
            variableMode === 'replace'
              ? { ...contact.variables, ...variablesToUpdate }
              : { ...variablesToUpdate, ...contact.variables };

          const result = await window.electronAPI.contacts.update(contact.id, {
            name: contact.name,
            phone: contact.phone,
            variables: updatedVariables,
          });

          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to update contact ${contact.id}:`, error);
          failedCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Updated ${successCount} contact${successCount > 1 ? 's' : ''} successfully`);
        if (failedCount > 0) {
          toast.warning(`Failed to update ${failedCount} contact${failedCount > 1 ? 's' : ''}`);
        }
        onSuccess();
        handleClose();
      } else {
        toast.error('Failed to update contacts');
      }
    } catch (error: any) {
      console.error('Failed to bulk update contacts:', error);
      toast.error(error.message || 'Failed to update contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setVariables({
      v1: '',
      v2: '',
      v3: '',
      v4: '',
      v5: '',
      v6: '',
      v7: '',
      v8: '',
      v9: '',
      v10: '',
    });
    setSelectedVariables(new Set());
    setVariableMode('replace');
    setActiveTab('variables');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Bulk Edit Contacts
          </DialogTitle>
          <DialogDescription>
            Update variables for {contacts.length} selected contact{contacts.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="space-y-2">
              <p className="font-medium">Selected Contacts:</p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {contacts.slice(0, 10).map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="text-xs">
                    {contact.name}
                  </Badge>
                ))}
                {contacts.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{contacts.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Update Mode:</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={variableMode === 'replace'}
                      onCheckedChange={(checked) => {
                        if (checked) setVariableMode('replace');
                      }}
                    />
                    <span className="text-sm">Replace existing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={variableMode === 'append'}
                      onCheckedChange={(checked) => {
                        if (checked) setVariableMode('append');
                      }}
                    />
                    <span className="text-sm">Keep existing (only add new)</span>
                  </label>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {variableMode === 'replace'
                  ? 'Variables will overwrite existing values'
                  : 'Variables will only be set if not already defined'}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.keys(variables).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`var-${key}`} className="text-sm">
                      {key.toUpperCase()}
                    </Label>
                    <Input
                      id={`var-${key}`}
                      value={variables[key as keyof typeof variables]}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      placeholder={`Enter ${key} value...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {selectedVariables.size > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Variables to update:</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(selectedVariables).map((key) => (
                        <Badge key={key} variant="default">
                          {key.toUpperCase()}: {variables[key as keyof typeof variables]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === 'variables' && selectedVariables.size === 0)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {contacts.length} Contact{contacts.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
