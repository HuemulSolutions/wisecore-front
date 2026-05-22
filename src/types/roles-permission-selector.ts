import type { Permission, PermissionWithStatus } from '@/services/rbac'

export interface PermissionSelectorProps {
  permissions: (Permission | PermissionWithStatus)[]
  selectedPermissions: string[]
  onPermissionsChange: (permissions: string[]) => void
  isLoading?: boolean
  compact?: boolean
  /** If provided, client-side filtering is skipped and this is called when the user presses Enter */
  onSearchChange?: (search: string) => void
}
