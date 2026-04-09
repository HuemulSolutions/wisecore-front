import { useState, useEffect } from 'react';
import { FileCode } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { HuemulField } from '@/huemul/components/huemul-field';
import { createTemplateFromDocument } from '@/services/assets';

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
  const { t } = useTranslation('assets');
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
    meta: { successMessage: t('createTemplateFromDocument.success') },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['templates', organizationId] });
      // HuemulDialog closes the dialog after closeDelay (500 ms); navigate after that
      setTimeout(() => {
        onTemplateCreated(template);
      }, 600);
    },
  });

  const handleSubmit = async () => {
    if (formData.name.trim() && organizationId) {
      await createTemplateMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
    }
  };

  const isValid = formData.name.trim().length > 0 && !!organizationId;

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createTemplateFromDocument.title')}
      description={t('createTemplateFromDocument.description')}
      icon={FileCode}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t('createTemplateFromDocument.submitLabel'),
        onClick: handleSubmit,
        disabled: !isValid,
        loading: createTemplateMutation.isPending,
      }}
    >
      <div className="space-y-4 py-2">
        <HuemulField
          label={t('createTemplateFromDocument.nameLabel')}
          required
          value={formData.name}
          onChange={(value) => setFormData((prev) => ({ ...prev, name: String(value) }))}
          placeholder={t('createTemplateFromDocument.namePlaceholder')}
          disabled={createTemplateMutation.isPending}
          autoFocus
        />
        <HuemulField
          type="textarea"
          label={t('createTemplateFromDocument.descriptionLabel')}
          value={formData.description}
          onChange={(value) => setFormData((prev) => ({ ...prev, description: String(value) }))}
          placeholder={t('createTemplateFromDocument.descriptionPlaceholder')}
          disabled={createTemplateMutation.isPending}
        />
      </div>
    </HuemulDialog>
  );
}
