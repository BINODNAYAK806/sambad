import { useState, useEffect } from 'react';
import { Search, Plus, X, FolderPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Group } from '../types/electron.d';

type GroupSelection = {
  id?: number;
  name: string;
  isNew: boolean;
};

type GroupSelectorForImportProps = {
  onSelectionChange: (selectedGroups: GroupSelection[]) => void;
};

export function GroupSelectorForImport({ onSelectionChange }: GroupSelectorForImportProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<GroupSelection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    onSelectionChange(selectedGroups);
  }, [selectedGroups, onSelectionChange]);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.groups.list();
      if (result.success && result.data) {
        setGroups(result.data);
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (group: Group, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, { id: group.id, name: group.name, isNew: false }]);
    } else {
      setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
    }
  };

  const handleAddNewGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;

    const existingGroup = groups.find(g => g.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingGroup) {
      if (!selectedGroups.some(sg => sg.id === existingGroup.id)) {
        setSelectedGroups(prev => [...prev, { id: existingGroup.id, name: existingGroup.name, isNew: false }]);
      }
      setNewGroupName('');
      setShowNewGroupInput(false);
      return;
    }

    const alreadyAdded = selectedGroups.find(sg => sg.isNew && sg.name.toLowerCase() === trimmedName.toLowerCase());
    if (alreadyAdded) {
      setNewGroupName('');
      return;
    }

    setSelectedGroups(prev => [...prev, { name: trimmedName, isNew: true }]);
    setNewGroupName('');
    setShowNewGroupInput(false);
  };

  const handleRemoveSelected = (groupToRemove: GroupSelection) => {
    setSelectedGroups(prev =>
      prev.filter(g => {
        if (g.isNew) {
          return g.name !== groupToRemove.name;
        } else {
          return g.id !== groupToRemove.id;
        }
      })
    );
  };

  const handleSelectAll = () => {
    const allGroups = groups.map(g => ({ id: g.id, name: g.name, isNew: false }));
    setSelectedGroups(allGroups);
  };

  const handleClearAll = () => {
    setSelectedGroups([]);
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGroupSelected = (groupId: number) => {
    return selectedGroups.some(sg => sg.id === groupId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewGroupInput(!showNewGroupInput)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {showNewGroupInput && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter new group name..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddNewGroup();
              } else if (e.key === 'Escape') {
                setShowNewGroupInput(false);
                setNewGroupName('');
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleAddNewGroup} disabled={!newGroupName.trim()}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowNewGroupInput(false);
              setNewGroupName('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {selectedGroups.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Selected Groups ({selectedGroups.length})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((group) => (
              <Badge
                key={group.isNew ? `new-${group.name}` : `existing-${group.id}`}
                variant={group.isNew ? 'secondary' : 'default'}
                className="flex items-center gap-1 pr-1"
              >
                {group.isNew && <FolderPlus className="h-3 w-3" />}
                {group.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveSelected(group)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-4">
          Loading groups...
        </div>
      ) : (
        <>
          {filteredGroups.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Available Groups</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  Select All
                </Button>
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-3">
                  {filteredGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={isGroupSelected(group.id)}
                        onCheckedChange={(checked) => handleToggleGroup(group, checked as boolean)}
                      />
                      <Label
                        htmlFor={`group-${group.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {group.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {filteredGroups.length === 0 && searchQuery && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No groups found matching "{searchQuery}"
            </div>
          )}

          {groups.length === 0 && !searchQuery && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No groups available. Create a new group to get started.
            </div>
          )}
        </>
      )}
    </div>
  );
}
