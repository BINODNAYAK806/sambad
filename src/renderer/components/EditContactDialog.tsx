import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Contact } from '../types/electron';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  v1: z.string().optional(),
  v2: z.string().optional(),
  v3: z.string().optional(),
  v4: z.string().optional(),
  v5: z.string().optional(),
  v6: z.string().optional(),
  v7: z.string().optional(),
  v8: z.string().optional(),
  v9: z.string().optional(),
  v10: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type EditContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSuccess: () => void;
};

export function EditContactDialog({ open, onOpenChange, contact, onSuccess }: EditContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      v1: '',
      v2: '',
      v3: '',
      v4: '',
      v5: '',
      v6: '',
      v7: '',
      v8: '',
      v9: '',
      v10: '',
    },
  });

  useEffect(() => {
    if (contact && open) {
      form.reset({
        name: contact.name || '',
        phone: contact.phone || '',
        v1: contact.variables?.v1 || '',
        v2: contact.variables?.v2 || '',
        v3: contact.variables?.v3 || '',
        v4: contact.variables?.v4 || '',
        v5: contact.variables?.v5 || '',
        v6: contact.variables?.v6 || '',
        v7: contact.variables?.v7 || '',
        v8: contact.variables?.v8 || '',
        v9: contact.variables?.v9 || '',
        v10: contact.variables?.v10 || '',
      });
    }
  }, [contact, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!contact) return;

    setIsSubmitting(true);

    try {
      const variables: Record<string, string> = {};
      for (let i = 1; i <= 10; i++) {
        const key = `v${i}` as keyof FormData;
        const value = data[key];
        if (value && value.trim()) {
          variables[key] = value.trim();
        }
      }

      const updateData = {
        name: data.name,
        phone: data.phone,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
      };

      const result = await window.electronAPI.contacts.update(contact.id, updateData);

      if (result.success) {
        toast.success('Contact updated successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to update contact');
      }
    } catch (error: any) {
      console.error('Failed to update contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information and custom variables
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+919876543210" {...field} />
                    </FormControl>
                    <FormDescription>
                      Include country code (e.g., +91 for India)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Variables (v1-v5)</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Variables (v6-v10)</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`v${i}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variable {i} (v{i})</FormLabel>
                        <FormControl>
                          <Input placeholder={`Custom field ${i}`} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                {[6, 7, 8, 9, 10].map((i) => (
                  <FormField
                    key={i}
                    control={form.control}
                    name={`v${i}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variable {i} (v{i})</FormLabel>
                        <FormControl>
                          <Input placeholder={`Custom field ${i}`} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Contact'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
