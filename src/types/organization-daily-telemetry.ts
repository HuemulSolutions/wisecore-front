export interface OrganizationDailyTelemetry {
  id: string
  organization_id: string
  date: string
  max_active_users: number
  total_input_tokens: number
  total_output_tokens: number
}

export interface OrganizationDailyTelemetryListResponse {
  data: OrganizationDailyTelemetry[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface OrganizationDailyTelemetryResponse {
  data: OrganizationDailyTelemetry
  transaction_id: string
  timestamp: string
}

export interface GetOrganizationDailyTelemetryListParams {
  page?: number
  page_size?: number
  organization_id?: string
}

export interface CreateOrganizationDailyTelemetryRequest {
  organization_id: string
  date: string
  max_active_users?: number
  total_input_tokens?: number
  total_output_tokens?: number
}

export interface UpdateOrganizationDailyTelemetryRequest {
  date?: string
  max_active_users?: number
  total_input_tokens?: number
  total_output_tokens?: number
}

export interface RefreshOrganizationDailyTelemetryRequest {
  organization_id?: string | null
  target_date?: string | null
  include_previous_day?: boolean
}

export interface OrganizationDailyTelemetryRefreshResult {
  organization_id: string
  target_date: string
  max_active_users: number
  total_input_tokens: number
  total_output_tokens: number
}

export interface OrganizationDailyTelemetryRefreshResponse {
  data: OrganizationDailyTelemetryRefreshResult[]
  transaction_id: string
  timestamp: string
}
