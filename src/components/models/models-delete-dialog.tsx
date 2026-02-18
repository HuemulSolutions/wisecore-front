import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import type { LLM } from "@/services/llms"

interface DeleteModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteModelDialog({
  open,
  onOpenChange,
  model,
  isDeleting,
  onConfirm
}: DeleteModelDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Model"
      description={
        <>
          Are you sure you want to delete the model <strong>"{model?.name}"</strong>? 
          This action cannot be undone.
        </>
      }
      onConfirm={onConfirm}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}