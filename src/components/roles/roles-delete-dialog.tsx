import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { type Role } from "@/services/rbac"

interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  isDeleting?: boolean
  onConfirm: () => void
}

export function DeleteRoleDialog({ open, onOpenChange, role, isDeleting = false, onConfirm }: DeleteRoleDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Role"
      description={`Are you sure you want to delete the role "${role?.name}"? This action cannot be undone and will remove all assignments of this role.`}
      onConfirm={onConfirm}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}
