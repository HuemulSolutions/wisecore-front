export type ExternalParameterType = 'header' | 'query_string'

export interface ExternalParameter {
  id: string
  param_type: ExternalParameterType
  name: string
  value: string
  external_system_id: string
  external_functionality_id: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface ExternalParametersResponse {
  data: ExternalParameter[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface ExternalParameterResponse {
  data: ExternalParameter
  transaction_id: string
  timestamp: string
}

export interface GetExternalParametersParams {
  page?: number
  page_size?: number
  search?: string
  param_type?: ExternalParameterType
}

export interface CreateExternalParameterRequest {
  param_type: ExternalParameterType
  name: string
  value: string
}

export interface UpdateExternalParameterRequest {
  param_type?: ExternalParameterType
  name?: string
  value?: string
}
