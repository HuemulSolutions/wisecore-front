import { useState, useEffect } from 'react';
import { FileCode } from 'lucide-react';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import NameDescriptionFields from '@/components/assets/content/name-description-fields';
import { useTranslation } from 'react-i18next';
import type { CreateTemplateDialogProps } from '@/types/assets';
export type { CreateTemplateDialogProps } from '@/types/assets';

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

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
    }
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createTemplate.title')}
      description={t('createTemplate.description')}
      icon={FileCode}
      maxWidth="sm:max-w-md"
      maxHeight="max-h-[90vh]"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('createTemplate.submitLabel'),
        onClick: handleSubmit,
        disabled: !isValid,
        loading: isPending,
        closeOnSuccess: false,
      }}
    >
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
    </HuemulDialog>
  );
}
