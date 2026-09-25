export interface OrganizationDailyModelTelemetry {
  id: string
  organization_id: string
  date: string
  llm_id: string | null
  model_display_name: string
  model_technical_name: string
  total_input_tokens: number
  total_output_tokens: number
}

export interface OrganizationDailyModelTelemetryListResponse {
  data: OrganizationDailyModelTelemetry[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface OrganizationDailyModelTelemetryResponse {
  data: OrganizationDailyModelTelemetry
  transaction_id: string
  timestamp: string
}

export interface GetOrganizationDailyModelTelemetryListParams {
  page?: number
  page_size?: number
  organization_id?: string
  model_technical_name?: string
}

export interface CreateOrganizationDailyModelTelemetryRequest {
  organization_id: string
  date: string
  llm_id?: string | null
  model_display_name: string
  model_technical_name: string
  total_input_tokens?: number
  total_output_tokens?: number
}

export interface UpdateOrganizationDailyModelTelemetryRequest {
  date?: string
  llm_id?: string | null
  model_display_name?: string
  model_technical_name?: string
  total_input_tokens?: number
  total_output_tokens?: number
}

export interface RefreshOrganizationDailyModelTelemetryRequest {
  organization_id?: string | null
  target_date?: string | null
  include_previous_day?: boolean
}

export interface OrganizationDailyModelTelemetryRefreshResult {
  organization_id: string
  target_date: string
  total_input_tokens: number
  total_output_tokens: number
}

export interface OrganizationDailyModelTelemetryRefreshResponse {
  data: OrganizationDailyModelTelemetryRefreshResult[]
  transaction_id: string
  timestamp: string
}
