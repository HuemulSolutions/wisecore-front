import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { type User } from "@/types/users"

interface UserDeleteDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (user: User) => void
  isDeleting?: boolean
}

export default function UserDeleteDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false
}: UserDeleteDialogProps) {
  if (!user) return null

  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete User"
      description={`Are you sure you want to delete "${user.name} ${user.last_name}"? This action cannot be undone.`}
      onConfirm={() => onConfirm(user)}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}