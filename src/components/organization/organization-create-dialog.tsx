import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { HuemulField } from '@/huemul/components/huemul-field';
import { useTranslation } from 'react-i18next';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  isPending: boolean;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { t } = useTranslation('organizations');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  const isValid = name.trim().length > 0;

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.title')}
      description={t('create.description')}
      icon={Plus}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t('create.button'),
        icon: Plus,
        disabled: !isValid || isPending,
        loading: isPending,
        closeOnSuccess: false,
        onClick: () => {
          if (name.trim()) {
            onSubmit({
              name: name.trim(),
              description: description.trim() || undefined
            });
          }
        }
      }}
    >
      <div className="grid gap-5 py-2">
        <HuemulField
          type="text"
          label={t('form.name')}
          name="name"
          placeholder={t('form.namePlaceholder')}
          value={name}
          onChange={(v) => setName(String(v))}
          required
          disabled={isPending}
        />
        <HuemulField
          type="textarea"
          label={t('form.description')}
          name="description"
          placeholder={t('form.descriptionPlaceholder')}
          value={description}
          onChange={(v) => setDescription(String(v))}
          disabled={isPending}
          rows={3}
        />
      </div>
    </HuemulDialog>
  );
}
