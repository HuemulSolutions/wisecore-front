import type { Role } from '@/services/rbac'
import type { Permission, PermissionWithStatus } from '@/services/rbac'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'
import type { User } from '@/types/users'

export interface AssignRolesSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** rbac:u — sin default: cada call-site debe resolverlo explícitamente. */
  canAssign: boolean
}

export interface AssignRoleToUsersDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** rbac:u — sin default: secure-by-default. */
  canAssign: boolean
}

export interface CloneRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: (copyUsers: boolean) => Promise<void>
  /** rbac:c — sin default: secure-by-default. */
  canClone: boolean
}

export interface RolesContentEmptyStateProps {
  error?: Error
  onRetry?: () => void
}

export interface CreateRoleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** rbac:c — sin default: secure-by-default. */
  canCreate: boolean
}

export interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: () => Promise<void>
  /** rbac:d — sin default: secure-by-default. */
  canDelete: boolean
}

export interface EditRoleSheetProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** rbac:u — sin default: secure-by-default. */
  canUpdate: boolean
}

export interface RoleFormFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  nameLabel?: string
  descriptionLabel?: string
  includeTextarea?: boolean
  isPosition: boolean
  onIsPositionChange: (isPosition: boolean) => void
  parentRoleId: string | null
  onParentRoleIdChange: (parentRoleId: string | null) => void
  /** Position roles available as parent — already excludes the role being edited. */
  positionRoleOptions: { id: string; name: string }[]
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

export interface RolesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  rolesCount: number
  isRefreshing: boolean
  onRefresh: () => void
  onCreateRole: () => void
  hasError?: boolean
  /** rbac:c — sin default: secure-by-default. */
  canCreate: boolean
  onExport?: () => void
  onImport?: () => void
  canExport?: boolean
  canImport?: boolean
  /** Cantidad de filas seleccionadas para exportar; deshabilita Exportar si es 0. */
  exportSelectedCount?: number
  /** Exportación en curso; deshabilita el botón mientras se descarga el archivo. */
  isExporting?: boolean
}

export interface RolesTableProps {
  roles: Role[]
  isTableLoading?: boolean
  isTableFetching?: boolean
  onAssignToUsers: (role: Role) => void
  onEditRole: (role: Role) => void
  onDeleteRole: (role: Role) => void
  onCloneRole: (role: Role) => void
  pagination?: HuemulTablePagination
  /** rbac:u — habilita "Asignar a usuarios" y "Editar permisos". Sin default. */
  canUpdate: boolean
  /** rbac:d — habilita "Eliminar". Sin default. */
  canDelete: boolean
  /** rbac:c — habilita "Clonar" (crea un rol nuevo). Sin default. */
  canClone: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (next: Set<string>) => void
}

export interface DocumentTypeForRole {
  id: string
  name: string
  color?: string
}
