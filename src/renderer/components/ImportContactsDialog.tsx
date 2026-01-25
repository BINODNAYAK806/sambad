import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2, XCircle, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';


import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { importContacts, extractUniqueGroupNames, getGroupContactCounts, type ImportResult } from '../services/importService';
import { GroupSelectorForImport } from './GroupSelectorForImport';

type ImportContactsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
};

type GroupSelection = {
  id?: number;
  name: string;
  isNew: boolean;
};

type ImportStep = 'idle' | 'processing-file' | 'importing-contacts' | 'creating-groups' | 'assigning-groups' | 'complete';

export function ImportContactsDialog({ open, onOpenChange, onImportComplete }: ImportContactsDialogProps) {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [enableGroupAssignment, setEnableGroupAssignment] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<GroupSelection[]>([]);
  const [currentStep, setCurrentStep] = useState<ImportStep>('idle');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setIsProcessing(true);

    try {
      // 1. Parse File
      const result = await importContacts(selectedFile);

      // 2. Normalize and Deduplicate File Content (Priority: Keep First)
      const uniqueContacts: typeof result.contacts = [];
      const seenPhones = new Set<string>();
      const fileDuplicates: string[] = [];

      for (const contact of result.contacts) {
        if (!contact.isValid) {
          // Keep invalid ones for reporting counts, but don't check for dups
          uniqueContacts.push(contact);
          continue;
        }

        if (seenPhones.has(contact.phone)) {
          fileDuplicates.push(contact.phone);
        } else {
          seenPhones.add(contact.phone);
          uniqueContacts.push(contact);
        }
      }

      // 3. Check Database for Existing
      const validPhones = uniqueContacts.filter(c => c.isValid).map(c => c.phone);
      let existingPhones: string[] = [];

      if (validPhones.length > 0) {
        const checkResult = await window.electronAPI.contacts.checkExisting(validPhones);
        if (checkResult.success && checkResult.data) {
          existingPhones = checkResult.data;
        }
      }

      // 4. Update Result with Deduplicated Counts
      const existingSet = new Set(existingPhones);

      // Mark existing as skipped/invalid in our local view or just separate them?
      // The requirement says: "Which numbers were skipped because they were duplicates in the file."
      // "Which numbers were skipped because they already exist in the system."

      // Let's filter the final list to be imported
      const finalContacts = uniqueContacts.map(c => {
        if (c.isValid && existingSet.has(c.phone)) {
          return { ...c, isExisting: true };
        }
        return c;
      });

      setImportResult({
        ...result,
        contacts: finalContacts as any, // Type cast if needed or update type
        fileDuplicateCount: fileDuplicates.length,
        fileDuplicates: fileDuplicates, // Store the list
        existingCount: existingPhones.length,
        existingPhones: existingPhones, // Store the list
        totalRows: result.totalRows
      } as any);

    } catch (err: any) {
      setError(err.message || 'Failed to process file');
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importResult) return;

    setIsImporting(true);
    setError(null);

    try {
      // Filter: Valid AND Not Existing (File dups were already removed from 'contacts' array in handleFileSelect logic above? 
      // Wait, in step 2 I pushed to uniqueContacts. So file dups are gone.
      // Now filter out existing db contacts.

      const contactsToImport = importResult.contacts.filter((c: any) => c.isValid && !c.isExisting);

      if (contactsToImport.length === 0) {
        setError("No new contacts to import.");
        setIsImporting(false);
        return;
      }

      const csvGroupNames = extractUniqueGroupNames(contactsToImport);
      const hasContactGroups = csvGroupNames.length > 0;
      const hasManualGroups = enableGroupAssignment && selectedGroups.length > 0;
      const groupNameToIdMap = new Map<string, number>();

      if (hasContactGroups) {
        setCurrentStep('creating-groups');
        setImportProgress({
          current: 0,
          total: csvGroupNames.length,
          message: `Creating/finding ${csvGroupNames.length} groups from CSV...`
        });

        console.log('[Import] Processing CSV groups:', csvGroupNames);

        try {
          const groupResults = await Promise.all(
            csvGroupNames.map(async (groupName, index) => {
              try {
                const result = await window.electronAPI.groups.findOrCreate(groupName);
                setImportProgress({
                  current: index + 1,
                  total: csvGroupNames.length,
                  message: `Processing group: ${groupName}`
                });

                if (result.success && result.data) {
                  // console.log(`[Import] Group "${groupName}" → ID: ${result.data}`);
                  return { name: groupName, id: result.data };
                } else {
                  throw new Error(`Failed to create/find group: ${result.error}`);
                }
              } catch (err: any) {
                console.error(`[Import] Failed to create/find group "${groupName}":`, err);
                throw new Error(`Failed to create/find group "${groupName}": ${err.message}`);
              }
            })
          );

          groupResults.forEach(({ name, id }) => {
            groupNameToIdMap.set(name.toLowerCase(), id);
          });

          // console.log('[Import] Group mapping created:', Array.from(groupNameToIdMap.entries()));
        } catch (err: any) {
          setError(err.message || 'Failed to create/find groups from CSV');
          setCurrentStep('idle');
          setIsImporting(false);
          return;
        }
      }

      if (hasManualGroups) {
        const manualGroupStep = hasContactGroups ? 'creating-groups' : 'creating-groups';
        setCurrentStep(manualGroupStep);

        const newGroups = selectedGroups.filter(g => g.isNew);
        const existingGroups = selectedGroups.filter(g => !g.isNew);

        if (newGroups.length > 0) {
          setImportProgress({
            current: 0,
            total: newGroups.length,
            message: `Creating ${newGroups.length} manual groups...`
          });

          try {
            const manualGroupResults = await Promise.all(
              newGroups.map(async (group, index) => {
                const result = await window.electronAPI.groups.findOrCreate(group.name);
                setImportProgress({
                  current: index + 1,
                  total: newGroups.length,
                  message: `Creating group: ${group.name}`
                });

                if (result.success && result.data) {
                  return { name: group.name, id: result.data };
                } else {
                  throw new Error(`Failed to create group: ${result.error}`);
                }
              })
            );

            manualGroupResults.forEach(({ name, id }) => {
              groupNameToIdMap.set(name.toLowerCase(), id);
            });
          } catch (err: any) {
            setError(err.message || 'Failed to create manual groups');
            setCurrentStep('idle');
            setIsImporting(false);
            return;
          }
        }

        existingGroups.forEach(g => {
          if (g.id && g.name) {
            groupNameToIdMap.set(g.name.toLowerCase(), g.id);
          }
        });
      }

      setCurrentStep('importing-contacts');
      setImportProgress({
        current: 0,
        total: contactsToImport.length,
        message: `Importing ${contactsToImport.length} contacts...`
      });

      // Pass TRUE as second arg to silently skip duplicates if any slip through, 
      // but we already filtered them.
      const result = await window.electronAPI.contacts.bulkCreate(contactsToImport);

      if (!result.success) {
        setError(result.error || 'Failed to import contacts');
        setCurrentStep('idle');
        setIsImporting(false);
        return;
      }

      const importedContactIds = result.data || [];
      console.log('[Import] Imported contacts:', importedContactIds.length);

      setImportProgress({
        current: importedContactIds.length,
        total: contactsToImport.length,
        message: `Successfully imported ${importedContactIds.length} contacts`
      });

      if ((hasContactGroups || hasManualGroups) && importedContactIds.length > 0) {
        setCurrentStep('assigning-groups');

        const contactToGroupsMap = new Map<number, number[]>();

        if (hasContactGroups) {
          for (let i = 0; i < contactsToImport.length; i++) {
            const contact = contactsToImport[i];
            const contactId = importedContactIds[i];

            if (contact.groupNames && contact.groupNames.length > 0) {
              const groupIds = contact.groupNames
                .map(name => groupNameToIdMap.get(name.toLowerCase()))
                .filter((id): id is number => id !== undefined);

              if (groupIds.length > 0) {
                contactToGroupsMap.set(contactId, groupIds);
              }
            }
          }
        }

        if (hasManualGroups) {
          const manualGroupIds = Array.from(
            new Set(
              selectedGroups
                .map(g => g.name ? groupNameToIdMap.get(g.name.toLowerCase()) : g.id)
                .filter((id): id is number => id !== undefined)
            )
          );

          for (const contactId of importedContactIds) {
            const existing = contactToGroupsMap.get(contactId) || [];
            const combined = Array.from(new Set([...existing, ...manualGroupIds]));
            contactToGroupsMap.set(contactId, combined);
          }
        }

        const totalAssignments = Array.from(contactToGroupsMap.values()).reduce(
          (sum, groups) => sum + groups.length,
          0
        );

        setImportProgress({
          current: 0,
          total: totalAssignments,
          message: `Assigning contacts to groups...`
        });

        // console.log('[Import] Contact-to-groups mapping:', Array.from(contactToGroupsMap.entries()).slice(0, 5));

        try {
          // Optimization: Group contacts by their target groups to reduce IPC calls
          // Map<StringifiedGroupIds, ContactIds[]>
          const groupCombinationMap = new Map<string, number[]>();

          for (const [contactId, groupIds] of contactToGroupsMap.entries()) {
            if (groupIds.length > 0) {
              // Sort to ensure [1,2] is same as [2,1]
              const key = groupIds.sort((a, b) => a - b).join(',');

              if (!groupCombinationMap.has(key)) {
                groupCombinationMap.set(key, []);
              }
              groupCombinationMap.get(key)?.push(contactId);
            }
          }

          const totalBatches = groupCombinationMap.size;
          let completedBatches = 0;
          let completedAssignments = 0;

          // console.log(`[Import] Optimized assignment into ${totalBatches} batches`);

          for (const [key, contactIds] of groupCombinationMap.entries()) {
            const groupIds = key.split(',').map(Number);

            // console.log(`[Import] Batch ${completedBatches + 1}/${totalBatches}: Assigning ${contactIds.length} contacts to groups [${groupIds.join(', ')}]`);

            await window.electronAPI.groups.bulkAddContactsToMultipleGroups(groupIds, contactIds);

            completedAssignments += contactIds.length * groupIds.length; // Total relationships created
            completedBatches++;

            setImportProgress({
              current: completedAssignments,
              total: totalAssignments,
              message: `Assigning batches (${completedBatches}/${totalBatches})...`
            });
          }

          console.log('[Import] Group assignments completed');
        } catch (err: any) {
          console.error('[Import] Failed to assign contacts to groups:', err);
          setError(`Contacts imported, but some group assignments failed: ${err.message}`);
        }
      }

      setCurrentStep('complete');
      onImportComplete();

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('[Import] Error during import:', err);
      setError(err.message || 'Failed to import contacts');
      setCurrentStep('idle');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setError(null);

    setEnableGroupAssignment(false);
    setSelectedGroups([]);
    setCurrentStep('idle');
    setImportProgress({ current: 0, total: 0, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      ['phone', 'name', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'groups'],
      ['+1234567890', 'John Doe', 'Variable 1', 'Variable 2', '', '', '', '', '', '', '', '', 'Sales,Marketing'],
      ['+0987654321', 'Jane Smith', 'Value A', 'Value B', 'Value C', '', '', '', '', '', '', '', 'Support'],
      ['+1122334455', 'Bob Johnson', 'Test 1', 'Test 2', 'Test 3', 'Test 4', '', '', '', '', '', '', '']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'importing-contacts':
        return { step: 1, total: 3, label: 'Importing contacts' };
      case 'creating-groups':
        return { step: 2, total: 3, label: 'Creating groups' };
      case 'assigning-groups':
        return { step: 3, total: 3, label: 'Assigning to groups' };
      case 'complete':
        return { step: 3, total: 3, label: 'Complete' };
      default:
        return { step: 0, total: 3, label: '' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Import contacts from CSV or Excel files. Supports phone, name, and up to 10 variables (v1-v10).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!importResult && !isProcessing && !isImporting && (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV or Excel (XLSX, XLS)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required columns:</strong> phone, name
                  <br />
                  <strong>Optional columns:</strong> v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, groups
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Tip: Use the "groups" column with comma-separated group names (e.g., "Sales,Marketing") to auto-assign contacts to groups.
                  </span>
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                onClick={handleDownloadSample}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2 py-8">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">Processing file...</p>
            </div>
          )}

          {importResult && !isProcessing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Valid New Contacts */}
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Valid New Contacts</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    {(importResult as any).contacts.filter((c: any) => c.isValid && !c.isExisting).length}
                  </p>
                </div>

                {/* Invalid / Skipped Stats */}
                <div className="space-y-2">
                  {/* Invalid Format */}
                  <Collapsible className="border rounded-lg bg-red-50 border-red-100">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-red-100/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-900">Invalid Format</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700">{importResult.invalidRows}</span>
                        {importResult.invalidRows > 0 && <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Users className="h-3 w-3" /></Button>}
                      </div>
                    </CollapsibleTrigger>
                    {importResult.invalidRows > 0 && (
                      <CollapsibleContent className="p-4 pt-0">
                        <div className="max-h-32 overflow-y-auto text-sm bg-white rounded border border-red-100 p-2 mt-2">
                          {importResult.contacts.filter(c => !c.isValid).map((c, i) => (
                            <div key={i} className="text-red-600 font-mono text-xs border-b border-red-50 last:border-0 py-1">
                              {c.phone || c.rawPhone || "Unknown"} <span className="text-gray-400">- {c.validationError || 'Invalid'}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>

                  {/* File Duplicates */}
                  <Collapsible className="border rounded-lg bg-orange-50 border-orange-100">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-orange-100/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-900">Skipped (File Duplicate)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-700">{(importResult as any).fileDuplicateCount || 0}</span>
                      </div>
                    </CollapsibleTrigger>
                    {((importResult as any).fileDuplicateCount || 0) > 0 && (
                      <CollapsibleContent className="p-4 pt-0">
                        <div className="max-h-32 overflow-y-auto text-sm bg-white rounded border border-orange-100 p-2 mt-2">
                          <p className="text-xs text-orange-800 mb-1">These numbers appeared multiple times in the file:</p>
                          {(importResult as any).fileDuplicates?.map((phone: string, i: number) => (
                            <div key={i} className="text-orange-600 font-mono text-xs border-b border-orange-50 last:border-0 py-1">
                              {phone}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>

                  {/* Existing in DB */}
                  <Collapsible className="border rounded-lg bg-blue-50 border-blue-100">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-blue-100/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-900">Skipped (Already Exists)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700">{(importResult as any).existingCount || 0}</span>
                      </div>
                    </CollapsibleTrigger>
                    {((importResult as any).existingCount || 0) > 0 && (
                      <CollapsibleContent className="p-4 pt-0">
                        <div className="max-h-32 overflow-y-auto text-sm bg-white rounded border border-blue-100 p-2 mt-2">
                          <p className="text-xs text-blue-800 mb-1">These numbers are already in your database:</p>
                          {(importResult as any).existingPhones?.map((phone: string, i: number) => (
                            <div key={i} className="text-blue-600 font-mono text-xs border-b border-blue-50 last:border-0 py-1">
                              {phone}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </div>
              </div>

              {(() => {
                const validNewContacts = (importResult as any).contacts.filter((c: any) => c.isValid && !c.isExisting);
                const csvGroups = extractUniqueGroupNames(validNewContacts);
                const groupCounts = getGroupContactCounts(validNewContacts);

                if (csvGroups.length > 0) {
                  return (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Users className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-blue-900">
                            Detected {csvGroups.length} group{csvGroups.length !== 1 ? 's' : ''} from CSV:
                          </p>
                          <ul className="text-sm space-y-1 text-blue-800">
                            {csvGroups.map((groupName) => {
                              const count = groupCounts.get(groupName.toLowerCase()) || 0;
                              return (
                                <li key={groupName} className="flex items-center gap-2">
                                  <span className="font-medium">{groupName}</span>
                                  <span className="text-blue-600">({count} new contact{count !== 1 ? 's' : ''})</span>
                                </li>
                              );
                            })}
                          </ul>
                          <p className="text-xs text-blue-700 mt-2">
                            These groups will be created automatically if they don't exist.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}

              <Collapsible className="border rounded-lg">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Group Assignment (Optional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enableGroupAssignment}
                      onCheckedChange={setEnableGroupAssignment}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0">
                  {enableGroupAssignment && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Assign all imported contacts to one or more groups. You can select existing groups or create new ones.
                      </p>
                      <GroupSelectorForImport onSelectionChange={setSelectedGroups} />
                      {selectedGroups.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            All {(importResult as any).contacts.filter((c: any) => c.isValid && !c.isExisting).length} valid new contacts will be assigned to{' '}
                            <strong>{selectedGroups.length}</strong> group{selectedGroups.length !== 1 ? 's' : ''}:{' '}
                            {selectedGroups.map(g => g.name).join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {isImporting && (
            <div className="space-y-4 py-4">
              {currentStep !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{getStepInfo().label}</span>
                    <span className="text-muted-foreground">
                      Step {getStepInfo().step} of {getStepInfo().total}
                    </span>
                  </div>
                  <Progress value={(getStepInfo().step / getStepInfo().total) * 100} className="w-full" />
                  {importProgress.message && (
                    <p className="text-sm text-muted-foreground">{importProgress.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && !importResult && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          {importResult && (
            <Button
              onClick={handleImport}
              disabled={
                isImporting ||
                (importResult as any).contacts.filter((c: any) => c.isValid && !c.isExisting).length === 0
              }
            >
              {isImporting
                ? 'Importing...'
                : (() => {
                  const validCount = (importResult as any).contacts.filter((c: any) => c.isValid && !c.isExisting).length;
                  if (enableGroupAssignment && selectedGroups.length > 0) {
                    return `Import & Assign ${validCount} Contacts`;
                  }
                  return `Import ${validCount} Contacts`;
                })()
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
