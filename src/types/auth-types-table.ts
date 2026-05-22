import type { AuthType } from '@/services/auth-types'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface AuthTypesTableProps {
  authTypes: AuthType[]
  onEdit: (authType: AuthType) => void
  onDelete: (authType: AuthType) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
}
