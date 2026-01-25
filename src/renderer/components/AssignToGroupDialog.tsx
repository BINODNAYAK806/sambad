import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Group, Contact } from '../types/electron';
import { toast } from 'sonner';

type AssignToGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSuccess: () => void;
};

export function AssignToGroupDialog({
  open,
  onOpenChange,
  contacts,
  onSuccess
}: AssignToGroupDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadGroups();
      setSelectedGroups(new Set());
      setError(null);
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.groups.list();
      if (result.success && result.data) {
        setGroups(result.data);
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupId: number) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleSave = async () => {
    if (selectedGroups.size === 0) {
      setError('Please select at least one group');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      for (const contact of contacts) {
        for (const groupId of selectedGroups) {
          await window.electronAPI.groups.addContact(groupId, contact.id);
        }
      }

      toast.success(
        `${contacts.length} contact${contacts.length > 1 ? 's' : ''} assigned to ${selectedGroups.size} group${selectedGroups.size > 1 ? 's' : ''}`
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to assign contacts to groups');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Groups</DialogTitle>
          <DialogDescription>
            Select groups for {contacts.length} contact{contacts.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <Alert>
              <AlertDescription>
                No groups available. Create a group first from the Groups button in Contacts page.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.has(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <Label
                      htmlFor={`group-${group.id}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {group.name}
                    </Label>
                    {selectedGroups.has(group.id) && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedGroups.size === 0}
          >
            {isSaving ? 'Assigning...' : `Assign to ${selectedGroups.size} Group${selectedGroups.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
