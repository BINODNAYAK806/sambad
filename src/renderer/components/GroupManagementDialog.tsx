import { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Group } from '../types/electron';

type GroupManagementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
};

export function GroupManagementDialog({ open, onOpenChange, onGroupCreated }: GroupManagementDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadGroups();
    }
  }, [open]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.groups.list();
      if (result.success && result.data) {
        setGroups(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      setError(null);
      const result = await window.electronAPI.groups.create({ name: newGroupName.trim() });
      if (result.success) {
        setNewGroupName('');
        await loadGroups();
        // Notify parent component to refresh its list
        onGroupCreated?.();
      } else {
        setError(result.error || 'Failed to create group');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      setError(null);
      const result = await window.electronAPI.groups.delete(id);
      if (result.success) {
        await loadGroups();
      } else {
        setError(result.error || 'Failed to delete group');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete group');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            Create and manage contact groups for organizing your campaigns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="group-name" className="sr-only">
                Group Name
              </Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateGroup();
                  }
                }}
              />
            </div>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <p>No groups created yet.</p>
                <p className="text-sm">Create your first group to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
