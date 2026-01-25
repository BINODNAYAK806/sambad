import { useState } from 'react';
import { X, Upload, Image, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export type MediaAttachment = {
  id: string;
  file?: File;
  type: 'image' | 'document' | 'video';
  caption?: string;
  preview?: string;
  dbId?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  isExisting?: boolean;
};

type MediaAttachmentSelectorProps = {
  attachments: MediaAttachment[];
  onChange: (attachments: MediaAttachment[]) => void;
  maxImages?: number;
  maxDocuments?: number;
  maxVideos?: number;
};

export function MediaAttachmentSelector({
  attachments,
  onChange,
  maxImages = 10,
  maxDocuments = 10,
  maxVideos = 5,
}: MediaAttachmentSelectorProps) {
  const [error, setError] = useState<string | null>(null);

  const images = attachments.filter(a => a.type === 'image');
  const documents = attachments.filter(a => a.type === 'document');
  const videos = attachments.filter(a => a.type === 'video');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document' | 'video') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const currentCount = type === 'image' ? images.length : type === 'video' ? videos.length : documents.length;
    const maxCount = type === 'image' ? maxImages : type === 'video' ? maxVideos : maxDocuments;

    if (currentCount + files.length > maxCount) {
      setError(`Maximum ${maxCount} ${type === 'image' ? 'images' : type === 'video' ? 'videos' : 'PDF files'} allowed`);
      return;
    }

    const newAttachments: MediaAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (type === 'image') {
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not a valid image`);
          continue;
        }
      } else if (type === 'video') {
        if (!file.type.startsWith('video/')) {
          setError(`File ${file.name} is not a valid video`);
          continue;
        }
        // Check video file size (16MB max for WhatsApp)
        if (file.size > 16 * 1024 * 1024) {
          setError(`Video ${file.name} exceeds 16MB limit`);
          continue;
        }
      } else {
        if (file.type !== 'application/pdf') {
          setError(`File ${file.name} is not a PDF`);
          continue;
        }
      }

      let preview: string | undefined;
      if (type === 'image' || type === 'video') {
        preview = URL.createObjectURL(file);
      }

      newAttachments.push({
        id: `${Date.now()}-${i}`,
        file,
        type,
        preview,
      });
    }

    onChange([...attachments, ...newAttachments]);
    event.target.value = '';
  };

  const removeAttachment = (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onChange(attachments.filter(a => a.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(attachments.map(a =>
      a.id === id ? { ...a, caption } : a
    ));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Media Attachments (Optional)</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Add up to {maxImages} images and {maxDocuments} PDF files to your campaign messages
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="image-upload" className="cursor-pointer">
            <Card className="border-2 border-dashed hover:border-primary transition-colors">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Images
                  </span>
                  <Badge variant="secondary">{images.length}/{maxImages}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Click to upload images
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF
                  </p>
                </div>
              </CardContent>
            </Card>
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
            disabled={images.length >= maxImages}
          />
        </div>

        <div>
          <Label htmlFor="pdf-upload" className="cursor-pointer">
            <Card className="border-2 border-dashed hover:border-primary transition-colors">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Documents
                  </span>
                  <Badge variant="secondary">{documents.length}/{maxDocuments}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Click to upload PDFs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF files only
                  </p>
                </div>
              </CardContent>
            </Card>
          </Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'document')}
            disabled={documents.length >= maxDocuments}
          />
        </div>

        {/* Video Upload Section */}
        <div>
          <Label htmlFor="video-upload" className="cursor-pointer">
            <Card className="border-2 border-dashed hover:border-primary transition-colors">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Videos
                  </span>
                  <Badge variant="secondary">{videos.length}/{maxVideos}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Click to upload videos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, 3GP (Max 16MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          </Label>
          <Input
            id="video-upload"
            type="file"
            accept="video/mp4,video/3gpp,.mp4,.3gp"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'video')}
            disabled={videos.length >= maxVideos}
          />
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Attached Files</Label>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="p-3">
                <div className="flex gap-3">
                  {attachment.preview ? (
                    <div className="flex-shrink-0">
                      {attachment.type === 'video' ? (
                        <video
                          src={attachment.preview}
                          className="w-16 h-16 object-cover rounded"
                          muted
                        />
                      ) : (
                        <img
                          src={attachment.preview}
                          alt={attachment.file?.name || attachment.fileName || 'Image'}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                      {attachment.type === 'video' ? (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.file?.name || attachment.fileName || 'Unknown file'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.file ? formatFileSize(attachment.file.size) :
                            attachment.fileSize ? formatFileSize(attachment.fileSize) : 'Unknown size'}
                        </p>
                        {attachment.isExisting && (
                          <Badge variant="outline" className="text-xs mt-1">Saved</Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor={`caption-${attachment.id}`} className="text-xs">
                        Caption (Optional)
                      </Label>
                      <Textarea
                        id={`caption-${attachment.id}`}
                        placeholder="Add a caption for this file..."
                        value={attachment.caption || ''}
                        onChange={(e) => updateCaption(attachment.id, e.target.value)}
                        className="mt-1 text-sm min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <Alert>
          <AlertDescription className="text-xs">
            Media files will be sent with each campaign message. Captions are optional and will only be sent if provided.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
