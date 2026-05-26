import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useTranslation } from "react-i18next"
import type { DeleteProviderDialogProps } from "@/types/llm-provider"
export type { DeleteProviderDialogProps } from "@/types/llm-provider"

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
      actionLabel={t('common:delete')}
      onAction={onAction}
    />
  )
}
