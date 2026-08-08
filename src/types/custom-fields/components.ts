import type { CustomField, CustomFieldOption, CustomFieldQuestionType } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'
import type { FormFieldConfig } from '@/types/sections/core'

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
  questionType: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onMascChange: (value: string) => void
  onQuestionTypeChange: (value: string) => void
  questionTypes: CustomFieldQuestionType[]
  formatQuestionType: (questionType: string) => string
  options: CustomFieldOption[]
  onOptionsChange: (options: CustomFieldOption[]) => void
  minValue: number | null
  maxValue: number | null
  onMinValueChange: (value: number | null) => void
  onMaxValueChange: (value: number | null) => void
  config: FormFieldConfig
  onConfigChange: (patch: Partial<FormFieldConfig>) => void
  required: boolean
  onRequiredChange: (value: boolean) => void
  errors?: {
    name?: string
    description?: string
    question_type?: string
    options?: string
    [key: string]: string | undefined
  }
  disabled?: boolean
  loadingQuestionTypes?: boolean
}

export interface CustomFieldValueFieldProps {
  dataType: string
  questionType?: string
  label: string
  value: string | string[]
  onChange: (value: string | string[]) => void
  options?: CustomFieldOption[]
  error?: string
  disabled?: boolean
  onImageFile?: (file: File) => void
  onImageValidationError?: (message: string) => void
  isUploadingImage?: boolean
  imageUploadDescription?: string
  minValue?: unknown
  maxValue?: unknown
  minLabel?: string
  maxLabel?: string
}

export interface CustomFieldInfoCardProps {
  title: string
  name: string
  dataType: string
  description?: string
  formatDataType: (dataType: string) => string
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
  pagination?: HuemulTablePagination
  canManage?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
