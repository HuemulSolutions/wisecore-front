export interface TokenUsage {
  id: string
  llm_id: string
  llm_name: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  input_cost: number | null
  output_cost: number | null
  total_cost: number | null
  source: string
  source_id: string
  user_id: string
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface TokenUsageStats {
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  total_cost: number | null
  record_count: number
}

export interface TokenUsageListResponse {
  data: TokenUsage[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface TokenUsageResponse {
  data: TokenUsage
  transaction_id: string
  timestamp: string
}

export interface TokenUsageStatsResponse {
  data: TokenUsageStats
  transaction_id: string
  timestamp: string
}

export interface GetTokenUsageListParams {
  page?: number
  page_size?: number
  user_id?: string
  source?: string
  llm_id?: string
  source_id?: string
  date_from?: string
  date_to?: string
}

export interface GetTokenUsageStatsParams {
  user_id?: string
  source?: string
  llm_id?: string
  date_from?: string
  date_to?: string
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export interface TokenUsageCostCoverage {
  priced_tokens: number
  unpriced_tokens: number
}

export interface TokenUsageActiveLLM {
  id: string
  name: string
  internal_name: string
}

export interface TokenUsageSummary {
  total_tokens: number
  total_input_tokens: number
  total_output_tokens: number
  /** Decimal serializado como string por el backend. null si ningún registro del rango tiene costo. */
  estimated_cost_usd: string | null
  cost_coverage: TokenUsageCostCoverage
  /** Estado actual de la organización: NO se filtra por fecha ni llm_id. */
  active_llms_count: number
  active_llms: TokenUsageActiveLLM[]
  active_users_count: number
}

export interface TokenUsageSummaryResponse {
  data: TokenUsageSummary
  transaction_id: string
  timestamp: string
}

export interface GetTokenUsageSummaryParams {
  llm_id?: string
  date_from?: string
  date_to?: string
}

// ─── By user ──────────────────────────────────────────────────────────────────
export type TokenUsageByUserSortBy = 'tokens' | 'cost' | 'percentage'
export type TokenUsageSortOrder = 'asc' | 'desc'

export interface TokenUsageByUser {
  user_id: string
  /** null si el usuario fue eliminado de la organización. */
  name: string | null
  last_name: string | null
  email: string | null
  total_tokens: number
  total_input_tokens: number
  total_output_tokens: number
  estimated_cost_usd: string | null
  /** internal_name de los LLMs usados; resolver display name contra GET /llms/ si hace falta. */
  llms_used: string[]
  percentage_of_total: number
}

export interface TokenUsageByUserListResponse {
  data: TokenUsageByUser[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface GetTokenUsageByUserParams {
  page?: number
  /** máx. 100 según backend */
  page_size?: number
  user_id?: string
  llm_id?: string
  date_from?: string
  date_to?: string
  sort_by?: TokenUsageByUserSortBy
  sort_order?: TokenUsageSortOrder
}
