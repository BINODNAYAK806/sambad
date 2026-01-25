import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, FolderPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Contact } from '../types/electron';
import { toast } from 'sonner';

type ContactActionsMenuProps = {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onAssignToGroups: (contact: Contact) => void;
  onDelete: () => void;
};

export function ContactActionsMenu({
  contact,
  onEdit,
  onAssignToGroups,
  onDelete,
}: ContactActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await window.electronAPI.contacts.delete(contact.id);
      if (result.success) {
        toast.success('Contact deleted successfully');
        onDelete();
      } else {
        toast.error(result.error || 'Failed to delete contact');
      }
    } catch (error: any) {
      console.error('Failed to delete contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted hover:text-foreground">
            <MoreVertical className="h-4 w-4 text-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isStaff && (
            <DropdownMenuItem onClick={() => onEdit(contact)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Contact
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onAssignToGroups(contact)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Assign to Groups
          </DropdownMenuItem>
          {!isStaff && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contact.name}</strong> ({contact.phone})?
              This action cannot be undone and will remove the contact from all groups and campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
