import type { Role } from '@/services/rbac'

export interface RoleActionsProps {
  role: Role
  isLoadingUsers?: boolean
  onAssignToUsers: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}
