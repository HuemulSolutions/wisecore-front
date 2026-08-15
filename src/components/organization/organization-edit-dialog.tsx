import { Pencil } from 'lucide-react';
import { HuemulDialog } from '@/huemul/components/huemul-dialog';
import { HuemulField } from '@/huemul/components/huemul-field';
import { useTranslation } from 'react-i18next';
import type { EditOrganizationDialogProps } from '@/types/organizations';
export type { EditOrganizationDialogProps } from '@/types/organizations';

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSave,
  isSaving,
  onOrgChange,
  canSave,
  canManageSystemLimits = false
}: EditOrganizationDialogProps) {
  if (!organization || !canSave) return null;

  const { t } = useTranslation('organizations');
  const isValid = organization.name.trim().length > 0;

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('edit.title')}
      description={t('edit.description')}
      icon={Pencil}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t('edit.button'),
        disabled: !isValid || isSaving,
        loading: isSaving,
        closeOnSuccess: false,
        onClick: () => {
          if (!canSave) return;
          if (isValid) onSave();
        }
      }}
    >
      <div className="grid gap-5 py-2">
        <HuemulField
          type="text"
          label={t('form.name')}
          name="name"
          placeholder={t('form.namePlaceholder')}
          value={organization.name}
          onChange={(v) => onOrgChange({ ...organization, name: String(v) })}
          required
          disabled={isSaving}
        />
        <HuemulField
          type="textarea"
          label={t('form.description')}
          name="description"
          placeholder={t('form.descriptionPlaceholder')}
          value={organization.description || ''}
          onChange={(v) => onOrgChange({ ...organization, description: String(v) })}
          disabled={isSaving}
          rows={3}
        />

        {canManageSystemLimits && (
          <>
            <HuemulField
              type="number"
              label={t('form.maxUsers')}
              name="max_users"
              placeholder={t('form.maxUsersPlaceholder')}
              value={organization.max_users ?? ''}
              onChange={(v) => onOrgChange({
                ...organization,
                max_users: v !== '' ? parseInt(String(v)) : null
              })}
              min={1}
              disabled={isSaving}
              description={t('form.maxUsersDescription')}
            />
            <HuemulField
              type="number"
              label={t('form.tokenLimit')}
              name="token_limit"
              placeholder={t('form.tokenLimitPlaceholder')}
              value={organization.token_limit ?? ''}
              onChange={(v) => onOrgChange({
                ...organization,
                token_limit: v !== '' ? parseInt(String(v)) : null
              })}
              min={1}
              disabled={isSaving}
              description={t('form.tokenLimitDescription')}
            />
          </>
        )}
      </div>
    </HuemulDialog>
  );
}
