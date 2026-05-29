import type { Role } from '@/services/rbac'
import type { DocumentType } from '@/services/document-types'
import type { Permission, PermissionWithStatus } from '@/services/rbac'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'
import type { User } from '@/types/users'

export interface RoleActionsProps {
  role: Role
  isLoadingUsers?: boolean
  onAssignToUsers: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export interface AssignRolesSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export interface AssignRoleToUsersDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export interface CloneRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: (copyUsers: boolean) => Promise<void>
}

export interface RolesContentEmptyStateProps {
  error?: Error
  onRetry?: () => void
}

export interface CreateRoleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: () => Promise<void>
}

export interface EditRoleSheetProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface RolesEmptyStateProps {
  hasSearchTerm: boolean
  onCreateRole: () => void
}

export interface RoleFormFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  includeTextarea?: boolean
}

export interface PermissionSelectorProps {
  permissions: (Permission | PermissionWithStatus)[]
  selectedPermissions: string[]
  onPermissionsChange: (permissions: string[]) => void
  isLoading?: boolean
  compact?: boolean
  /** If provided, client-side filtering is skipped and this is called when the user presses Enter */
  onSearchChange?: (search: string) => void
}

export interface RolePermissionsDialogProps {
  documentType: DocumentType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface RolesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  rolesCount: number
  isRefreshing: boolean
  onRefresh: () => void
  onCreateRole: () => void
  hasError?: boolean
  canManage?: boolean
}

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

export interface DocumentTypeForRole {
  id: string
  name: string
  color?: string
}
