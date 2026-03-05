import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"

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
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Provider"
      description={`Are you sure you want to delete the "${provider?.name}" provider? This will remove all configuration but keep it available for future setup.`}
      actionLabel="Delete"
      onAction={onAction}
    />
  )
}
