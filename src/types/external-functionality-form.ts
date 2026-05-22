import type {
  ExternalFunctionalityHttpMethod,
  ExternalFunctionalityExecutionType,
  ExternalFunctionalityClass,
  ExternalFunctionalityObjective,
} from '@/types/external-functionalities'

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
