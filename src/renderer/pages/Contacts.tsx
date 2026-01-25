import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Upload, Users, Trash2, FolderPlus, MoreVertical, Edit, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ImportContactsDialog } from '../components/ImportContactsDialog';
import { GroupManagementDialog } from '../components/GroupManagementDialog';
import { AddContactDialog } from '../components/AddContactDialog';
import { AssignToGroupDialog } from '../components/AssignToGroupDialog';
import { EditContactDialog } from '../components/EditContactDialog';
import { BulkEditContactsDialog } from '../components/BulkEditContactsDialog';
import { ContactActionsMenu } from '../components/ContactActionsMenu';
import type { Contact } from '../types/electron';
import { toast } from 'sonner';

export function Contacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [assigningContact, setAssigningContact] = useState<Contact | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const result = await window.electronAPI.contacts.list();
      if (result.success && result.data) {
        setContacts(result.data);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      setIsRemoving(true);
      const result = await window.electronAPI.contacts.removeDuplicates();
      if (result.success && result.data) {
        toast.success(`Removed ${result.data} duplicate contacts`);
        await loadContacts();
      } else {
        toast.error(result.error || 'Failed to remove duplicates');
      }
    } catch (error: any) {
      console.error('Failed to remove duplicates:', error);
      toast.error('Failed to remove duplicates');
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (contactId: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleAllContacts = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleAssignToGroups = () => {
    if (selectedContacts.size === 0) {
      toast.error('Please select contacts to assign');
      return;
    }
    setAssignDialogOpen(true);
  };

  const handleBulkEdit = () => {
    if (selectedContacts.size === 0) {
      toast.error('Please select contacts to edit');
      return;
    }
    setBulkEditDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedContacts.size === 0) {
      toast.error('Please select contacts to delete');
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const contactIds = Array.from(selectedContacts);

      for (const contactId of contactIds) {
        try {
          const result = await window.electronAPI.contacts.delete(contactId);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to delete contact ${contactId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} contact${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} contact${failCount > 1 ? 's' : ''}`);
      }

      setSelectedContacts(new Set());
      await loadContacts();
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete contacts');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const getSelectedContactObjects = () => {
    return contacts.filter(c => selectedContacts.has(c.id));
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditDialogOpen(true);
  };

  const handleAssignContactToGroups = (contact: Contact) => {
    setAssigningContact(contact);
    setAssignDialogOpen(true);
  };

  const handleSingleAssignSuccess = () => {
    setAssigningContact(null);
    loadContacts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="gradient-text">Contacts</span>
            </h1>
            <p className="text-lg text-muted-foreground">Manage your WhatsApp contact list</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isStaff && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2">
                    <MoreVertical className="h-4 w-4" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Groups
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleRemoveDuplicates}
                    disabled={isRemoving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isRemoving ? 'Removing...' : 'Remove Duplicates'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2 shadow-sm hover:shadow-md transition-all">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {selectedContacts.size > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                {selectedContacts.size}
              </div>
              <div className="text-sm font-semibold">
                {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContacts(new Set())}
                className="h-7 px-2 hover:bg-primary/10"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!isStaff && (
                <>
                  <Button variant="outline" size="sm" onClick={handleBulkEdit} className="gap-2 shadow-sm">
                    <Edit className="h-4 w-4" />
                    Bulk Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkDelete} className="gap-2 shadow-sm text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                    Bulk Delete
                  </Button>
                </>
              )}
              <Button variant="default" size="sm" onClick={handleAssignToGroups} className="gap-2 shadow-sm">
                <FolderPlus className="h-4 w-4" />
                Assign to Groups
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Contact List
              </CardTitle>
              <CardDescription className="mt-1.5">
                {contacts.length} total contacts
                {selectedContacts.size > 0 && ` • ${selectedContacts.size} selected`}
                {searchQuery && ` • ${filteredContacts.length} matching search`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 shadow-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/80">
                <TableRow className="hover:bg-muted/80 border-b-2">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                      onCheckedChange={toggleAllContacts}
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Phone</TableHead>
                  <TableHead className="font-semibold text-foreground">Groups</TableHead>
                  <TableHead className="font-semibold text-foreground">Variables</TableHead>
                  <TableHead className="w-[80px] font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading contacts...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                      {contacts.length === 0
                        ? 'No contacts found. Click "Import" or "Add Contact" to get started.'
                        : 'No contacts match your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="hover:bg-muted/40 transition-colors border-b"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={() => toggleContact(contact.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{contact.name}</TableCell>
                      <TableCell className="text-foreground/80">{contact.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {contact.groups && contact.groups.length > 0 ? (
                            contact.groups.map((group) => (
                              <Badge key={group.id} variant="secondary" className="text-xs shadow-sm bg-primary/10 text-primary border border-primary/20">
                                {group.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-foreground/50 italic">No groups</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {contact.variables &&
                            Object.entries(contact.variables).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs bg-background border-foreground/20 text-foreground">
                                {key}: {value}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ContactActionsMenu
                          contact={contact}
                          onEdit={handleEditContact}
                          onAssignToGroups={handleAssignContactToGroups}
                          onDelete={loadContacts}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ImportContactsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={loadContacts}
      />

      <GroupManagementDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
      />

      <AddContactDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadContacts}
      />

      <AssignToGroupDialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            setAssigningContact(null);
          }
        }}
        contacts={assigningContact ? [assigningContact] : getSelectedContactObjects()}
        onSuccess={() => {
          if (assigningContact) {
            handleSingleAssignSuccess();
          } else {
            setSelectedContacts(new Set());
            loadContacts();
          }
        }}
      />

      <EditContactDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={editingContact}
        onSuccess={loadContacts}
      />

      <BulkEditContactsDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        contacts={getSelectedContactObjects()}
        onSuccess={() => {
          setSelectedContacts(new Set());
          loadContacts();
        }}
      />

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Contacts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedContacts.size}</strong> selected contact{selectedContacts.size > 1 ? 's' : ''}?
              This action cannot be undone and will remove the contacts from all groups and campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
