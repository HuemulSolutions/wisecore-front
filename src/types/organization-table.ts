import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

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
  isRootAdmin?: boolean
  maxHeight?: string
  isLoading?: boolean
  isFetching?: boolean
}
