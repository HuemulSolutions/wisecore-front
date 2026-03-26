import { useState, useEffect } from 'react';
import { FileCode } from 'lucide-react';
import { ReusableDialog } from '@/components/ui/reusable-dialog';
import NameDescriptionFields from '@/components/assets/content/name-description-fields';
import { useTranslation } from 'react-i18next';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isPending: boolean;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending
}: CreateTemplateDialogProps) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const { t } = useTranslation('assets');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({ name: '', description: '' });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
    }
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createTemplate.title')}
      description={t('createTemplate.description')}
      icon={FileCode}
      maxWidth="md"
      maxHeight="90vh"
      formId="create-template-form"
      isValid={isValid}
      isSubmitting={isPending}
      submitLabel={t('createTemplate.submitLabel')}
    >
      <form id="create-template-form" onSubmit={handleSubmit} className="space-y-4">
        <NameDescriptionFields
          name={formData.name}
          description={formData.description}
          onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
          onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
          nameLabel={t('createTemplate.nameLabel')}
          descriptionLabel={t('createTemplate.descriptionLabel')}
          namePlaceholder={t('createTemplate.namePlaceholder')}
          descriptionPlaceholder={t('createTemplate.descriptionPlaceholder')}
          disabled={isPending}
          nameRequired={true}
          descriptionRequired={false}
          useTextarea={true}
        />
      </form>
    </ReusableDialog>
  );
}
