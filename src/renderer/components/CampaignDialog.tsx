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
import { AlertCircle, Image as ImageIcon, X, Users, UserCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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

  // Multi-session & Poll states
  const [sendingStrategy, setSendingStrategy] = useState<'single' | 'rotational'>('single');
  const [selectedServerId, setSelectedServerId] = useState<number>(1);
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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

        // Multi-session fields
        if (campaign.sending_strategy) {
          setSendingStrategy(campaign.sending_strategy as any);
        }
        if (campaign.server_id) {
          setSelectedServerId(campaign.server_id);
        }

        // Poll fields
        if (campaign.is_poll) {
          setIsPoll(true);
          setPollQuestion(campaign.poll_question || '');
          try {
            const options = JSON.parse(campaign.poll_options || '["", ""]');
            setPollOptions(options);
          } catch (e) {
            setPollOptions(['', '']);
          }
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
      }
    } catch (err: any) {
      console.error('Failed to load existing media:', err);
    }
  };

  const loadExistingTemplateImage = (campaign: Campaign) => {
    if (campaign.template_image_path && campaign.template_image_name) {
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
    setDelayConfig({ preset: 'medium' });
    setMediaAttachments([]);
    setTemplateImage(null);
    setSendingStrategy('single');
    setSelectedServerId(1);
    setIsPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!isPoll && !messageTemplate.trim()) {
      setError('Message template is required');
      return;
    }

    if (isPoll && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) {
      setError('Polls require a question and at least 2 non-empty options');
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
      console.log('[CampaignDialog] SAVE DEBUG: sendingStrategy =', sendingStrategy, ', selectedServerId =', selectedServerId);

      const campaignData: any = {
        name: name.trim(),
        status: 'draft',
        message_template: messageTemplate.trim(),
        group_id: targetingMode === 'group' ? parseInt(selectedGroupId) : null,
        delay_preset: delayConfig.preset,
        delay_min: delayConfig.customRange?.min,
        delay_max: delayConfig.customRange?.max,
        // Multi-session
        sending_strategy: sendingStrategy,
        server_id: selectedServerId,
        // Polls
        is_poll: isPoll,
        poll_question: isPoll ? pollQuestion.trim() : null,
        poll_options: isPoll ? JSON.stringify(pollOptions.filter(o => o.trim())) : null,
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
        campaignData.template_image_path = templateImage.existingPath;
        campaignData.template_image_name = templateImage.existingName;
      } else if (!templateImage && campaign?.template_image_path) {
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
                await window.electronAPI.campaigns.deleteMedia(mediaId);
              }
            }
          }

          for (const attachment of newMedia) {
            if (attachment.file) {
              const arrayBuffer = await attachment.file.arrayBuffer();
              const base64Data = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
              await window.electronAPI.campaigns.addMedia(campaignId, {
                fileName: attachment.file.name,
                fileType: attachment.type,
                fileSize: attachment.file.size,
                fileData: base64Data,
                caption: attachment.caption,
              });
            }
          }

          if (targetingMode === 'contacts') {
            await window.electronAPI.campaigns.clearContacts(campaignId);
            if (selectedContactIds.length > 0) {
              await window.electronAPI.campaigns.addContacts(campaignId, selectedContactIds);
            }
          } else if (campaign && !campaign.group_id) {
            await window.electronAPI.campaigns.clearContacts(campaignId);
          }
        }

        toast.success(campaign ? 'Campaign updated' : 'Campaign created');
        await new Promise(resolve => setTimeout(resolve, 100));
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
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
      setError('Invalid image file');
      return;
    }
    const preview = URL.createObjectURL(file);
    setTemplateImage({ file, preview });
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
    const newText = text.substring(0, start) + `{{${varName}}}` + text.substring(end);
    setMessageTemplate(newText);
    setTimeout(() => { textarea.focus(); }, 0);
  };

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          <DialogDescription>
            Configure delivery strategy, message content, and interactive polls.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="Marketing Blast #1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sending Strategy</Label>
              <Select value={sendingStrategy} onValueChange={(v: any) => setSendingStrategy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Account</SelectItem>
                  <SelectItem value="rotational">Rotational (Auto-shuffle)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sendingStrategy === 'single' && (
            <div className="space-y-2">
              <Label>Source Server Slot</Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((id) => (
                  <Button
                    key={id}
                    variant={selectedServerId === id ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedServerId(id)}
                  >
                    Slot {id}
                  </Button>
                ))}
              </div>
            </div>
          )}

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
                  <Users className="h-4 w-4" /> Group
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contacts" id="target-contacts" />
                <Label htmlFor="target-contacts" className="font-normal cursor-pointer flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Contacts
                </Label>
              </div>
            </RadioGroup>

            {targetingMode === 'group' ? (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <ContactSelector selectedContactIds={selectedContactIds} onChange={setSelectedContactIds} />
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold">Content Type</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="is-poll" className="text-sm font-medium">Send as Poll?</Label>
                <Switch id="is-poll" checked={isPoll} onCheckedChange={setIsPoll} />
              </div>
            </div>

            {isPoll ? (
              <div className="space-y-4 p-4 border rounded-xl bg-accent/30">
                <div className="space-y-2">
                  <Label>Poll Question</Label>
                  <Input
                    placeholder="Wanna join our webinar?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Options (Min 2)</Label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => updatePollOption(idx, e.target.value)}
                      />
                      {pollOptions.length > 2 && (
                        <Button variant="ghost" size="icon" onClick={() => removePollOption(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={addPollOption} disabled={pollOptions.length >= 10}>
                    Add Option
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Message Template</Label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => insertVariable('name')}>name</Button>
                      {[1, 2, 3].map(i => (
                        <Button key={i} variant="outline" size="sm" className="h-6 text-xs" onClick={() => insertVariable(`v${i}`)}>v{i}</Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="message-template"
                    placeholder="Hi {{name}}, Check this out!"
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Template Image (Optional)</Label>
                  {!templateImage ? (
                    <Label htmlFor="template-image-upload" className="cursor-pointer">
                      <Card className="border-2 border-dashed hover:border-primary transition-colors">
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Add display image</p>
                        </CardContent>
                      </Card>
                    </Label>
                  ) : (
                    <Card className="p-2">
                      <div className="flex gap-3 items-center">
                        <img src={templateImage.preview} className="w-12 h-12 object-cover rounded" />
                        <span className="flex-1 text-sm truncate">{templateImage.file?.name || 'Existing Image'}</span>
                        <Button variant="ghost" size="icon" onClick={removeTemplateImage}><X className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  )}
                  <input id="template-image-upload" type="file" accept="image/*" className="hidden" onChange={handleTemplateImageSelect} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Delivery Delay</Label>
              <DelaySelector value={delayConfig} onChange={setDelayConfig} />
            </div>
            <div className="space-y-2">
              <Label>Sending Strategy</Label>
              <RadioGroup value={sendingStrategy} onValueChange={(v) => setSendingStrategy(v as 'single' | 'rotational')} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="single" id="strat-single" />
                  <Label htmlFor="strat-single" className="font-normal cursor-pointer">Single Account (Server 1)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="rotational" id="strat-rotational" />
                  <Label htmlFor="strat-rotational" className="font-normal cursor-pointer">Rotational (All Accounts)</Label>
                </div>
              </RadioGroup>
            </div>
            {!isPoll && (
              <MediaAttachmentSelector
                attachments={mediaAttachments}
                onChange={setMediaAttachments}
              />
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
