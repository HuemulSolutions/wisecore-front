export interface Token {
  id: string
  name: string
  first_five: string
  last_five: string
  duration_days: number
  organization_id: string
  expires_at: string
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
}

export interface TokensResponse {
  data: Token[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface TokenResponse {
  data: Token
  transaction_id: string
  timestamp: string
}

export interface GetTokensParams {
  page?: number
  page_size?: number
  search?: string
}

export interface CreateTokenRequest {
  name: string
  duration_days: number
}

export interface CreateTokenResult {
  token: string
  metadata: Token
}

export interface CreateTokenResponse {
  data: CreateTokenResult
  transaction_id: string
  timestamp: string
}

export interface UseTokensOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
}
