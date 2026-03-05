import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
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
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Model"
      description={`Are you sure you want to delete the model "${model?.name}"? This action cannot be undone.`}
      actionLabel="Delete"
      onAction={onAction}
    />
  )
}