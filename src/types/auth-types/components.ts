import type { AuthType } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface AuthTypesEmptyStateProps {
  searchTerm: string
}

export interface AuthTypesErrorStateProps {
  error?: any
  onRetry?: () => void
}

export interface AuthTypesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  authTypesCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
  /** Root admin (único eje de esta página, no existe recurso `auth_type` propio). Default `false`. */
  canManage?: boolean
  /**
   * Filtro por organización (solo root admin, que ve las conexiones de todas).
   * `value === ''` = todas las organizaciones.
   */
  organizationFilter?: {
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }
}

export interface AuthTypesTableProps {
  authTypes: AuthType[]
  onEdit: (authType: AuthType) => void
  onDelete: (authType: AuthType) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  /** Root admin (único eje de esta página, no existe recurso `auth_type` propio). Default `false`. */
  canManage?: boolean
}
