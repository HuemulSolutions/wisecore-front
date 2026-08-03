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
