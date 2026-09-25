import type { CustomField, CustomFieldOption, CustomFieldQuestionType, CustomFieldValueEntityType, CustomFieldValueFile } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'
import type { FormFieldConfig } from '@/types/sections/core'

// Archivo elegido en el sheet de alta (custom field aún sin id) mientras no se sube —
// se acumula en memoria y el padre lo sube tras crear la entidad. previewUrl es un
// object URL (URL.revokeObjectURL al quitarlo o al desmontar).
export interface PendingCustomFieldFile {
  file: File
  previewUrl: string
}

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
  /** Extensiones configuradas en el custom field (carga_de_archivos/image). Sin esto,
   *  cae al catálogo fijo de imágenes (custom fields ya existentes sin `allowed_types`). */
  allowedTypes?: string[]
  /** Tamaño máximo en MB (carga_de_archivos con max_value > 1) — default_value.max_size_mb. */
  maxSizeMb?: number
  /** Requeridos solo cuando max_value > 1 (colección value_blobs, no el value_blob singular). */
  entityType?: CustomFieldValueEntityType
  /** null en el sheet de alta (la entidad todavía no existe) — ver CustomFieldFilesInput. */
  entityCustomFieldId?: string | null
  valueFiles?: CustomFieldValueFile[]
  pendingFiles?: PendingCustomFieldFile[]
  onPendingFilesChange?: (files: PendingCustomFieldFile[]) => void
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
  canCreate?: boolean
}

export interface CustomFieldTableProps {
  customFields: CustomField[]
  onEditCustomField: (customField: CustomField) => void
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
