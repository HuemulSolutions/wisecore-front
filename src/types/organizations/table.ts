import type { HuemulTablePagination } from '@/types/huemul'

export interface Organization {
  id: string
  name: string
  description?: string | null
  db_name?: string
  created_at?: string
  updated_at?: string
  max_users?: number | null
  token_limit?: number | null
}

export interface OrganizationTableProps {
  organizations: Organization[]
  onEditOrganization: (organization: Organization) => void
  onDeleteOrganization: (organization: Organization) => void
  onSetAdmin?: (organization: Organization) => void
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  canSetAdmin?: boolean
  /**
   * No es un eje de RBAC ni un bypass: solo decide si se muestran las
   * columnas de límites de sistema (`max_users`/`token_limit`), que no son
   * org-scoped. Ver ia context/rbac-audit-guide.md.
   */
  canManageSystemLimits?: boolean
  maxHeight?: string
  isLoading?: boolean
  isFetching?: boolean
}
