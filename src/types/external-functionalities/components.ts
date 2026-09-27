import type { ExternalFunctionality } from './core'
import type {
  ExternalFunctionalityHttpMethod,
  ExternalFunctionalityExecutionType,
  ExternalFunctionalityClass,
  ExternalFunctionalityObjective,
} from './core'
import type { ExternalParameterType } from '@/types/external-parameters'

export type ExternalFunctionalityTab = "docs" | "params" | "body" | "logs" | "lifecycle"

export interface ExternalFunctionalityDetailProps {
  functionality: ExternalFunctionality
  organizationId?: string
  systemId?: string
  onEdit?: () => void
  onDelete?: () => void
}

export interface ExternalFunctionalityFormData {
  name?: string
  description?: string
  usage_example?: string
  partial_url?: string
  storage_url?: string
  http_method?: ExternalFunctionalityHttpMethod
  objective?: ExternalFunctionalityObjective
  body?: string
  execution_type?: ExternalFunctionalityExecutionType
  functionality_class?: ExternalFunctionalityClass
}

export interface ExternalFunctionalityFormProps {
  formData: ExternalFunctionalityFormData
  onChange: <K extends keyof ExternalFunctionalityFormData>(field: K, value: ExternalFunctionalityFormData[K]) => void
}

export interface ExternalFunctionalityParamsTabProps {
  organizationId: string
  systemId: string
  functionalityId: string
}

export interface ExternalFunctionalityParamsEditingState {
  id: string
  name: string
  value: string
  param_type: ExternalParameterType
}

export interface ExternalFunctionalityParamsAddFormState {
  param_type: ExternalParameterType
  name: string
  value: string
}
