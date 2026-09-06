import type { Role } from '@/services/rbac'
import type { Permission, PermissionWithStatus } from '@/services/rbac'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

/** Pestaña activa del panel de detalle de un rol (espejo de `UserDetailTab`). */
export type RoleDetailTab = 'details' | 'permissions' | 'users' | 'hierarchy'

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
  /**
   * Rol recién creado. Lo usan las superficies que lo consumen en el acto
   * (p. ej. la matriz de permisos por rol, que lo agrega como fila).
   */
  onCreated?: (role: Role) => void
  /**
   * Prellena el nombre al abrir (ej. desde el popover "Agregar rol" de
   * /users, vía "Con permisos" — ver ia context/inline-create-entity-in-sheet-guide.md).
   * Cambio aditivo: sin esta prop el sheet se comporta igual que antes.
   */
  initialName?: string
}

export interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: () => Promise<void>
  /** rbac:d — sin default: secure-by-default. */
  canDelete: boolean
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
  /**
   * Abre el panel de detalle de este rol. `tab` fuerza la pestaña (ej. la
   * columna Usuarios abre directo en 'users'). Reemplaza a la acción de fila
   * "Asignar a usuarios": esa función vive ahora en el tab Usuarios del panel.
   */
  onSelectRole: (role: Role, tab?: RoleDetailTab) => void
  /** Fila resaltada como activa (vía `getRowClassName`, no `selectedKeys`). */
  selectedRoleId?: string | null
  /** Catálogo completo de roles (`useRolesMap`), para el nombre del rol padre en la columna Jerarquía. */
  rolesById?: Record<string, Role>
  pagination?: HuemulTablePagination
  selectedIds?: Set<string>
  onSelectionChange?: (next: Set<string>) => void
}

export interface DocumentTypeForRole {
  id: string
  name: string
  color?: string
}
