import { useState, useEffect } from 'react';
import { FileCode } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import NameDescriptionFields from '@/components/assets/content/name-description-fields';
import { createTemplateFromDocument } from '@/services/assets';
import { toast } from 'sonner';

interface CreateTemplateFromDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  organizationId: string | null;
  onTemplateCreated: (template: { id: string; name: string }) => void;
}

export function CreateTemplateFromDocumentDialog({
  open,
  onOpenChange,
  documentId,
  organizationId,
  onTemplateCreated
}: CreateTemplateFromDocumentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({ name: '', description: '' });
    }
  }, [open]);

  const createTemplateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      createTemplateFromDocument(documentId, data, organizationId!),
    onSuccess: (template) => {
      toast.success('Template created successfully');
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['templates', organizationId] });
      onOpenChange(false);
      
      // Wait for dialog to close before navigating
      setTimeout(() => {
        onTemplateCreated(template);
      }, 300);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && organizationId) {
      createTemplateMutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
    }
  };

  const isValid = formData.name.trim().length > 0 && !!organizationId;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Template from Asset"
      description="Create a reusable template based on this document's structure. The document's sections, dependencies, and custom fields will be copied to the new template."
      icon={FileCode}
      maxWidth="md"
      maxHeight="90vh"
      showDefaultFooter
      formId="create-template-from-document-form"
      isValid={isValid}
      isSubmitting={createTemplateMutation.isPending}
      submitLabel="Create Template"
    >
      <form id="create-template-from-document-form" onSubmit={handleSubmit} className="space-y-4">
        <NameDescriptionFields
          name={formData.name}
          description={formData.description}
          onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
          onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
          nameLabel="Template Name *"
          descriptionLabel="Description (Optional)"
          namePlaceholder="Enter template name..."
          descriptionPlaceholder="Describe what this template is for..."
          disabled={createTemplateMutation.isPending}
          nameRequired={true}
          descriptionRequired={false}
          useTextarea={true}
        />
      </form>
    </ReusableDialog>
  );
}
