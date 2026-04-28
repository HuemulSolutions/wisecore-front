export type ExternalFunctionalityHttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export type ExternalFunctionalityExecutionType = 'sync' | 'async'
export type ExternalFunctionalityClass = 'agent' | 'endpoint'
export type ExternalFunctionalityObjective =
  | 'import_asset'
  | 'export_asset'
  | 'edit_section'
  | 'review_section'
  | 'publish_asset'

export interface ExternalFunctionality {
  id: string
  name: string
  description: string
  usage_example: string
  partial_url: string
  storage_url: string
  http_method: ExternalFunctionalityHttpMethod
  objective: ExternalFunctionalityObjective
  body: string
  execution_type: ExternalFunctionalityExecutionType
  functionality_class: ExternalFunctionalityClass
  external_system_id: string
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface ExternalFunctionalitiesResponse {
  data: ExternalFunctionality[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface ExternalFunctionalityResponse {
  data: ExternalFunctionality
  transaction_id: string
  timestamp: string
}

export interface GetExternalFunctionalitiesParams {
  page?: number
  page_size?: number
  search?: string
  http_method?: ExternalFunctionalityHttpMethod
  execution_type?: ExternalFunctionalityExecutionType
  functionality_class?: ExternalFunctionalityClass
  objective?: ExternalFunctionalityObjective
}

export interface CreateExternalFunctionalityRequest {
  name: string
  description: string
  usage_example: string
  partial_url: string
  http_method: ExternalFunctionalityHttpMethod
  objective: ExternalFunctionalityObjective
  body: string
  execution_type: ExternalFunctionalityExecutionType
  functionality_class: ExternalFunctionalityClass
  storage_url?: string
}

export interface UpdateExternalFunctionalityRequest {
  name?: string
  description?: string
  usage_example?: string
  partial_url?: string
  http_method?: ExternalFunctionalityHttpMethod
  objective?: ExternalFunctionalityObjective
  body?: string
  execution_type?: ExternalFunctionalityExecutionType
  functionality_class?: ExternalFunctionalityClass
  storage_url?: string
}
