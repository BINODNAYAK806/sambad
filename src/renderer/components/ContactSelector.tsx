import { useState, useEffect, useMemo } from 'react';
import { Search, X, Users, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import type { Contact } from '../types/electron';

type ContactSelectorProps = {
  selectedContactIds: number[];
  onChange: (contactIds: number[]) => void;
};

export function ContactSelector({ selectedContactIds, onChange }: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const selectedContacts = useMemo(() => {
    return contacts.filter(c => selectedContactIds.includes(c.id));
  }, [contacts, selectedContactIds]);

  const toggleContact = (contactId: number) => {
    if (selectedContactIds.includes(contactId)) {
      onChange(selectedContactIds.filter(id => id !== contactId));
    } else {
      onChange([...selectedContactIds, contactId]);
    }
  };

  const selectAll = () => {
    onChange(filteredContacts.map(c => c.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const removeContact = (contactId: number) => {
    onChange(selectedContactIds.filter(id => id !== contactId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectAll}
          disabled={filteredContacts.length === 0}
          className="gap-1"
        >
          <Check className="h-3 w-3" />
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          disabled={selectedContactIds.length === 0}
          className="gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      </div>

      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 w-full mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
            </span>
          </div>
          {selectedContacts.map((contact) => (
            <Badge
              key={contact.id}
              variant="secondary"
              className="gap-1 pr-1 bg-primary/10 text-primary hover:bg-primary/20"
            >
              {contact.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeContact(contact.id)}
                className="h-4 w-4 p-0 hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading contacts...
                </div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground p-6 text-center">
                {contacts.length === 0
                  ? 'No contacts available. Add contacts first.'
                  : 'No contacts match your search.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => toggleContact(contact.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleContact(contact.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {contact.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contact.phone}
                        </div>
                      </div>
                      {contact.groups && contact.groups.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {contact.groups.slice(0, 2).map((group) => (
                            <Badge
                              key={group.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {group.name}
                            </Badge>
                          ))}
                          {contact.groups.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.groups.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {!isLoading && filteredContacts.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
      )}
    </div>
  );
}
