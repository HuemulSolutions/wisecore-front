import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useTranslation } from "react-i18next"
import type { LLM } from "@/types/llm"

interface DeleteModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  onAction: () => Promise<void>
}

export function DeleteModelDialog({
  open,
  onOpenChange,
  model,
  onAction
}: DeleteModelDialogProps) {
  const { t } = useTranslation('models')

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteModelDialog.title')}
      description={t('deleteModelDialog.description', { name: model?.name })}
      actionLabel={t('common:delete')}
      onAction={onAction}
    />
  )
}