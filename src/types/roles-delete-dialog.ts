import type { Role } from '@/services/rbac'

export interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: () => Promise<void>
}
