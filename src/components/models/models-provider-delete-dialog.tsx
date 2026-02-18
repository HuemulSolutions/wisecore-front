import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"

interface DeleteProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteProviderDialog({
  open,
  onOpenChange,
  provider,
  isDeleting,
  onConfirm
}: DeleteProviderDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Provider"
      description={
        <>
          Are you sure you want to delete the <strong>{provider?.name}</strong> provider? 
          This will remove all configuration but keep it available for future setup.
        </>
      }
      onConfirm={onConfirm}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}