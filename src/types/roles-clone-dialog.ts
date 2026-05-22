import type { Role } from '@/services/rbac'

export interface CloneRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: (copyUsers: boolean) => Promise<void>
}
