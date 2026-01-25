import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, Image as ImageIcon, X, Users, UserCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import DelaySelector from './DelaySelector';
import { MediaAttachmentSelector, type MediaAttachment } from './MediaAttachmentSelector';
import { ContactSelector } from './ContactSelector';
import type { Campaign, Group } from '../types/electron';
import type { DelaySettings } from '../types/delay';

type CampaignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  campaign?: Campaign;
};

export function CampaignDialog({ open, onOpenChange, onSuccess, campaign }: CampaignDialogProps) {
  const [name, setName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [targetingMode, setTargetingMode] = useState<'group' | 'contacts'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [delayConfig, setDelayConfig] = useState<DelaySettings>({
    preset: 'medium',
  });
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);
  const [templateImage, setTemplateImage] = useState<{
    file?: File;
    preview?: string;
    existingPath?: string;
    existingName?: string;
  } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    if (open) {
      loadGroups();
      if (campaign) {
        setName(campaign.name);
        setMessageTemplate(campaign.message_template || '');

        if (campaign.group_id) {
          setTargetingMode('group');
          setSelectedGroupId(campaign.group_id.toString());
          setSelectedContactIds([]);
        } else {
          setTargetingMode('contacts');
          setSelectedGroupId('');
          loadExistingContacts(campaign.id);
        }

        if (campaign.delay_preset) {
          setDelayConfig({
            preset: campaign.delay_preset as any,
            customRange: campaign.delay_min && campaign.delay_max
              ? { min: campaign.delay_min, max: campaign.delay_max }
              : undefined,
          });
        }



        loadExistingMedia(campaign.id);
        loadExistingTemplateImage(campaign);
      } else {
        resetForm();
      }
    }
  }, [open, campaign]);

  const loadGroups = async () => {
    try {
      const result = await window.electronAPI.groups.list();
      if (result.success && result.data) {
        setGroups(result.data);
      }
    } catch (err: any) {
      console.error('Failed to load groups:', err);
    }
  };

  const loadExistingContacts = async (campaignId: number) => {
    try {
      const result = await window.electronAPI.campaigns.getContacts(campaignId);
      if (result.success && result.data && result.data.length > 0) {
        console.log('[CampaignDialog] Loading existing contacts:', result.data);
        setSelectedContactIds(result.data.map((c: any) => c.id));
      }
    } catch (err: any) {
      console.error('Failed to load campaign contacts:', err);
    }
  };

  const loadExistingMedia = async (campaignId: number) => {
    try {
      const result = await window.electronAPI.campaigns.getMedia(campaignId);
      if (result.success && result.data && result.data.length > 0) {
        console.log('[CampaignDialog] Loading existing media:', result.data);

        const existingAttachments: MediaAttachment[] = result.data.map((media: any) => ({
          id: media.id.toString(),
          type: media.file_type === 'document' || media.file_name.endsWith('.pdf') ? 'document' : 'image',
          caption: media.caption || '',
          dbId: media.id.toString(),
          filePath: media.file_path,
          fileName: media.file_name,
          fileSize: media.file_size,
          isExisting: true,
          preview: media.file_type && media.file_type.startsWith('image') ? media.file_path : undefined,
        }));

        setMediaAttachments(existingAttachments);
        console.log('[CampaignDialog] Loaded', existingAttachments.length, 'existing media files');
      }
    } catch (err: any) {
      console.error('Failed to load existing media:', err);
    }
  };

  const loadExistingTemplateImage = (campaign: Campaign) => {
    if (campaign.template_image_path && campaign.template_image_name) {
      console.log('[CampaignDialog] Loading existing template image:', campaign.template_image_name);
      setTemplateImage({
        existingPath: campaign.template_image_path,
        existingName: campaign.template_image_name,
        preview: campaign.template_image_path,
      });
    }
  };

  const resetForm = () => {
    setName('');
    setMessageTemplate('');
    setTargetingMode('group');
    setSelectedGroupId('');
    setSelectedContactIds([]);
    setDelayConfig({
      preset: 'medium',
    });
    setMediaAttachments([]);
    setTemplateImage(null);
    setError(null);

  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!messageTemplate.trim()) {
      setError('Message template is required');
      return;
    }

    if (targetingMode === 'group' && !selectedGroupId) {
      setError('Please select a group');
      return;
    }

    if (targetingMode === 'contacts' && selectedContactIds.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const campaignData: any = {
        name: name.trim(),
        status: 'draft',
        message_template: messageTemplate.trim(),
        group_id: targetingMode === 'group' ? parseInt(selectedGroupId) : null,
        delay_preset: delayConfig.preset,
        delay_min: delayConfig.customRange?.min,
        delay_max: delayConfig.customRange?.max,

      };

      if (templateImage?.file) {
        const arrayBuffer = await templateImage.file.arrayBuffer();
        const base64Data = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        campaignData.template_image_data = base64Data;
        campaignData.template_image_name = templateImage.file.name;
        campaignData.template_image_size = templateImage.file.size;
        campaignData.template_image_type = templateImage.file.type;
      } else if (templateImage?.existingPath) {
        // User is keeping the existing template image - preserve the path
        campaignData.template_image_path = templateImage.existingPath;
        campaignData.template_image_name = templateImage.existingName;
      } else if (!templateImage && campaign?.template_image_path) {
        campaignData.template_image_data = null;
        campaignData.template_image_name = null;
        campaignData.template_image_size = null;
        campaignData.template_image_type = null;
        campaignData.template_image_path = null;
      }

      const result = campaign
        ? await window.electronAPI.campaigns.update(campaign.id, campaignData)
        : await window.electronAPI.campaigns.create(campaignData);

      if (result.success) {
        const campaignId = campaign ? campaign.id : result.id;

        if (campaignId) {
          const newMedia = mediaAttachments.filter(a => !a.isExisting && a.file);
          const existingMedia = mediaAttachments.filter(a => a.isExisting);

          if (campaign) {
            const originalMediaResult = await window.electronAPI.campaigns.getMedia(campaign.id);
            if (originalMediaResult.success && originalMediaResult.data) {
              const originalMediaIds = originalMediaResult.data.map((m: any) => m.id.toString());
              const currentMediaIds = existingMedia.map(a => a.dbId);
              const deletedMediaIds = originalMediaIds.filter(id => !currentMediaIds.includes(id));

              for (const mediaId of deletedMediaIds) {
                console.log('[CampaignDialog] Deleting removed media:', mediaId);
                await window.electronAPI.campaigns.deleteMedia(mediaId);
              }
            }
          }

          for (const attachment of newMedia) {
            if (attachment.file) {
              const arrayBuffer = await attachment.file.arrayBuffer();
              const base64Data = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );

              console.log(`[CampaignDialog] Saving media attachment: ${attachment.file.name}, size: ${attachment.file.size}`);
              const addMediaResult = await window.electronAPI.campaigns.addMedia(campaignId, {
                fileName: attachment.file.name,
                fileType: attachment.type,
                fileSize: attachment.file.size,
                fileData: base64Data,
                caption: attachment.caption,
              });
              console.log(`[CampaignDialog] Add media result:`, addMediaResult);
            }
          }

          if (targetingMode === 'contacts') {
            await window.electronAPI.campaigns.clearContacts(campaignId);

            if (selectedContactIds.length > 0) {
              const addResult = await window.electronAPI.campaigns.addContacts(campaignId, selectedContactIds);
              if (!addResult.success) {
                console.error('[CampaignDialog] Failed to add contacts:', addResult.error);
                throw new Error(addResult.error || 'Failed to add contacts to campaign');
              }
              console.log('[CampaignDialog] Added', selectedContactIds.length, 'contacts to campaign');
            }
          } else if (campaign && !campaign.group_id) {
            await window.electronAPI.campaigns.clearContacts(campaignId);
          }
        }

        toast.success(campaign ? 'Campaign updated successfully' : 'Campaign created successfully');
        // Small delay to ensure DB consistency before refresh
        await new Promise(resolve => setTimeout(resolve, 100));
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to save campaign');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleTemplateImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      setError('Image size must be less than 16MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setTemplateImage({
      file,
      preview,
    });

    event.target.value = '';
  };

  const removeTemplateImage = () => {
    if (templateImage?.preview && !templateImage.existingPath) {
      URL.revokeObjectURL(templateImage.preview);
    }
    setTemplateImage(null);
  };

  const insertVariable = (varName: string) => {
    const textarea = document.getElementById('message-template') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageTemplate;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + `{{${varName}}}` + after;

    setMessageTemplate(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + varName.length + 4;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          <DialogDescription>
            Configure your campaign settings, message template, and delivery options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="Enter campaign name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Target Audience</Label>
            <RadioGroup
              value={targetingMode}
              onValueChange={(value: 'group' | 'contacts') => setTargetingMode(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="target-group" />
                <Label htmlFor="target-group" className="font-normal cursor-pointer flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target by Group
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contacts" id="target-contacts" />
                <Label htmlFor="target-contacts" className="font-normal cursor-pointer flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Target by Contacts
                </Label>
              </div>
            </RadioGroup>

            {targetingMode === 'group' ? (
              <div className="space-y-2">
                <Label htmlFor="group-select">Select Group</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger id="group-select">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No groups available. Create a group first.
                      </div>
                    ) : (
                      groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Contacts</Label>
                <ContactSelector
                  selectedContactIds={selectedContactIds}
                  onChange={setSelectedContactIds}
                />
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message-template">Message Template</Label>
              <div className="flex gap-1 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs font-bold border-primary text-primary"
                  onClick={() => insertVariable('name')}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  name
                </Button>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => insertVariable(`v${i}`)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    v{i}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              id="message-template"
              placeholder="Enter your message template. Use {{v1}}, {{v2}}, etc. for variables."
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={6}
            />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Use variables like {"{{v1}}"}, {"{{v2}}"} in your message. They will be replaced with actual values from your contacts.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Template Image (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Add an image that will be sent with your message. The message text will be used as the caption.
            </p>

            {!templateImage ? (
              <Label htmlFor="template-image-upload" className="cursor-pointer">
                <Card className="border-2 border-dashed hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF (Max 16MB)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
                      <img
                        src={templateImage.preview}
                        alt={templateImage.file?.name || templateImage.existingName || 'Template image'}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {templateImage.file?.name || templateImage.existingName || 'Template image'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {templateImage.file ?
                          `${(templateImage.file.size / 1024 / 1024).toFixed(2)} MB` :
                          'Existing image'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This image will be sent with your personalized message as caption
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeTemplateImage}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Input
              id="template-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTemplateImageSelect}
            />
          </div>



          <div className="space-y-2">
            <Label>Delivery Delay</Label>
            <DelaySelector
              value={delayConfig}
              onChange={setDelayConfig}
            />
          </div>

          <Separator className="my-6" />

          <MediaAttachmentSelector
            attachments={mediaAttachments}
            onChange={setMediaAttachments}
            maxImages={10}
            maxDocuments={10}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
