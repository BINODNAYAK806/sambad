import { useState, useEffect } from 'react';
import { Plus, Search, Users, Trash2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Group, Contact } from '../types/electron';
import { toast } from 'sonner';
import { GroupManagementDialog } from '../components/GroupManagementDialog';

export function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupContacts, setGroupContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [removeContactDialog, setRemoveContactDialog] = useState(false);
  const [removingContact, setRemovingContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupContacts(selectedGroup.id);
    } else {
      setGroupContacts([]);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.groups.list();
      if (result.success && result.data) {
        setGroups(result.data);
        if (selectedGroup) {
          const updatedSelected = result.data.find(g => g.id === selectedGroup.id);
          if (updatedSelected) {
            setSelectedGroup(updatedSelected);
          } else {
            setSelectedGroup(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupContacts = async (groupId: number) => {
    try {
      setIsLoadingContacts(true);
      const result = await window.electronAPI.groups.getContacts(groupId);
      if (result.success && result.data) {
        setGroupContacts(result.data);
      }
    } catch (error) {
      console.error('Failed to load group contacts:', error);
      toast.error('Failed to load group contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    try {
      const result = await window.electronAPI.groups.delete(deletingGroup.id);
      if (result.success) {
        toast.success(`Group "${deletingGroup.name}" deleted successfully`);
        if (selectedGroup?.id === deletingGroup.id) {
          setSelectedGroup(null);
        }
        await loadGroups();
      } else {
        toast.error(result.error || 'Failed to delete group');
      }
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingGroup(null);
    }
  };

  const handleRemoveContact = async () => {
    if (!removingContact || !selectedGroup) return;

    try {
      const result = await window.electronAPI.groups.removeContact(
        selectedGroup.id,
        removingContact.id
      );
      if (result.success) {
        toast.success(`Removed ${removingContact.name} from ${selectedGroup.name}`);
        await loadGroupContacts(selectedGroup.id);
      } else {
        toast.error(result.error || 'Failed to remove contact from group');
      }
    } catch (error: any) {
      console.error('Failed to remove contact:', error);
      toast.error('Failed to remove contact from group');
    } finally {
      setRemoveContactDialog(false);
      setRemovingContact(null);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="mt-2 text-muted-foreground">Manage contact groups for organized campaigns</p>
        </div>
        <Button onClick={() => setGroupDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>
              {groups.length} total groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading groups...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p className="font-medium">No groups found</p>
                  <p className="text-sm">
                    {groups.length === 0
                      ? 'Create your first group to get started'
                      : 'No groups match your search'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedGroup?.id === group.id ? 'bg-muted border-primary' : ''
                        }`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{group.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingGroup(group);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedGroup ? `Contacts in "${selectedGroup.name}"` : 'Group Contacts'}
            </CardTitle>
            <CardDescription>
              {selectedGroup
                ? `${groupContacts.length} contacts in this group`
                : 'Select a group to view its contacts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <p className="font-medium">No Group Selected</p>
                <p className="text-sm">Select a group from the left to view its contacts</p>
              </div>
            ) : isLoadingContacts ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading contacts...
              </div>
            ) : groupContacts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <p className="font-medium">No Contacts</p>
                <p className="text-sm">This group has no contacts yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRemovingContact(contact);
                                setRemoveContactDialog(true);
                              }}
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <GroupManagementDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onGroupCreated={loadGroups}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the group <strong>{deletingGroup?.name}</strong>?
              This will remove all contacts from this group but will not delete the contacts themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={removeContactDialog} onOpenChange={setRemoveContactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Contact from Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removingContact?.name}</strong> from{' '}
              <strong>{selectedGroup?.name}</strong>? This will not delete the contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveContact}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
