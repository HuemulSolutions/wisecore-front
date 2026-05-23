import type { Role } from '@/services/rbac'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface RolesTableProps {
  roles: Role[]
  isLoadingUsers: boolean
  isTableLoading?: boolean
  isTableFetching?: boolean
  onAssignToUsers: (role: Role) => void
  onEditRole: (role: Role) => void
  onDeleteRole: (role: Role) => void
  onCloneRole: (role: Role) => void
  pagination?: HuemulTablePagination
  canManage?: boolean
}
