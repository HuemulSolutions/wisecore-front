import { HuemulAlertDialog } from '@/huemul/components/huemul-alert-dialog';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Organization {
  id: string;
  name: string;
  description?: string | null;
  db_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onConfirm: () => Promise<void>;
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onConfirm,
}: DeleteOrganizationDialogProps) {
  if (!organization) return null;

  const { t } = useTranslation('organizations');

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete.title')}
      description={t('delete.description', { name: organization.name })}
      actionLabel={t('actions.delete')}
      actionIcon={Trash2}
      onAction={onConfirm}
    />
  );
}
