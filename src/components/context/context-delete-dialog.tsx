import { Trash2 } from "lucide-react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"

interface DeleteContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteContextDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteContextDialogProps) {
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Context"
      description="Are you sure you want to delete this context? This action cannot be undone and may affect document execution."
      actionLabel="Delete"
      onAction={onConfirm}
      actionVariant="destructive"
      actionIcon={Trash2}
    />
  )
}
