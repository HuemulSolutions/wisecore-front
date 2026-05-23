import type { Role } from '@/services/rbac'

export interface EditRoleSheetProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
