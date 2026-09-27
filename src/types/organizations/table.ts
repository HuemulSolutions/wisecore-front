import type { HuemulTablePagination } from '@/types/huemul'

/** Pestaña activa del panel de detalle de una organización (espejo de `RoleDetailTab`). */
export type OrganizationDetailTab = 'details' | 'users'

export interface Organization {
  id: string
  name: string
  description?: string | null
  db_name?: string
  created_at?: string
  updated_at?: string
  max_users?: number | null
  token_limit?: number | null
  /** Método que reciben los miembros nuevos; `null` = código por email (docs/sso-frontend.md, Fase 6). */
  default_auth_type_id?: string | null
}

// `OrganizationTableProps` (kebab: editar/eliminar/set-admin) se retiró:
// `/global-admin` migró a `OrganizationsTableProps` de acá abajo — mismo
// componente que `/organizations`, con `canManageSystemLimits`/
// `canManageMembers`/`canSetAdmin` en `OrganizationDetailPanel`.

/**
 * Tabla maestro-detalle de `/organizations` y `/global-admin` (variant
 * "detailed" + chevron, sin kebab) — ver ia context/list-detail-panel-guide.md.
 */
export interface OrganizationsTableProps {
  organizations: Organization[]
  isTableLoading?: boolean
  isTableFetching?: boolean
  /** Abre el panel de detalle. `tab` fuerza la pestaña. */
  onSelectOrganization: (organization: Organization, tab?: OrganizationDetailTab) => void
  /** Fila resaltada como activa. */
  selectedOrganizationId?: string | null
  pagination?: HuemulTablePagination
}
