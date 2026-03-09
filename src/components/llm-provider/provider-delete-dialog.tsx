import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useTranslation } from "react-i18next"

interface DeleteProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  onAction: () => Promise<void>
}

export function DeleteProviderDialog({
  open,
  onOpenChange,
  provider,
  onAction
}: DeleteProviderDialogProps) {
  const { t } = useTranslation('models')

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteProviderDialog.title')}
      description={t('deleteProviderDialog.description', { name: provider?.name })}
      actionLabel={t('actions.delete')}
      onAction={onAction}
    />
  )
}
