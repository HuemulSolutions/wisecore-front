import type { CustomField } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface CustomFieldContentEmptyStateProps {
  type: "error" | "empty" | "no-results"
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
  onClearFilters?: () => void
}

export interface CustomFieldFormFieldsProps {
  name: string
  description: string
  dataType: string
  masc: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDataTypeChange: (value: string) => void
  onMascChange: (value: string) => void
  dataTypes: string[]
  formatDataType: (dataType: string) => string
  errors?: {
    name?: string
    description?: string
    data_type?: string
  }
  disabled?: boolean
  loadingDataTypes?: boolean
}

export interface CustomFieldPageEmptyStateProps {
  type: "access-denied" | "error" | "empty"
  message?: string
  onCreateFirst?: () => void
}

export interface CustomFieldPageHeaderProps {
  customFieldCount: number
  onCreateCustomField: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}

export interface CustomFieldTableProps {
  customFields: CustomField[]
  onEditCustomField: (customField: CustomField) => void
  onDeleteCustomField: (customField: CustomField) => void
  pagination?: HuemulTablePagination
  canManage?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
