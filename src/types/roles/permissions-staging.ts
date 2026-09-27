import type { PermissionWithStatus } from '@/services/rbac'

/**
 * Staging de permisos de un rol para el tab "Permisos" del panel de detalle.
 * A diferencia de `RoleUsersStagingApi` no trabaja por deltas contra páginas:
 * `getRolePermissions` ya trae el catálogo completo (con `.assigned` por
 * ítem) y el guardado usa `add_permissions`/`remove_permissions` (delta), no
 * un reemplazo total — ver `useRolePermissionsStaging`.
 */
export interface RolePermissionsStagingApi {
  /** Catálogo completo (sin filtrar) tal cual llega del backend. */
  permissions: PermissionWithStatus[]
  /** Selección local de trabajo — la fuente de verdad mientras se edita. */
  selectedIds: Set<string>
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  error: Error | null
  toggle: (permissionId: string) => void
  toggleMany: (permissionIds: string[], checked: boolean) => void
  save: () => Promise<void>
  discard: () => void
}
