import { HuemulAlertDialog } from '@/huemul/components/huemul-alert-dialog';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DeleteOrganizationDialogProps } from '@/types/organization-delete-dialog';
export type { DeleteOrganizationDialogProps } from '@/types/organization-delete-dialog';

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onConfirm,
}: DeleteOrganizationDialogProps) {
  if (!organization) return null;

  const { t } = useTranslation(['organizations', 'common']);

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete.title')}
      description={t('delete.description', { name: organization.name })}
      actionLabel={t('common:delete')}
      actionIcon={Trash2}
      onAction={onConfirm}
    />
  );
}
