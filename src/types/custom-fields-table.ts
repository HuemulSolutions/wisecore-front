import type { CustomField } from './custom-fields'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface CustomFieldTableProps {
  customFields: CustomField[]
  onEditCustomField: (customField: CustomField) => void
  onDeleteCustomField: (customField: CustomField) => void
  pagination?: HuemulTablePagination
  canManage?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
