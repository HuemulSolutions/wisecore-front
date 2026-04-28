export type ExternalSystemStatus = 'active' | 'inactive'

export interface ExternalSystem {
  id: string
  name: string
  status: ExternalSystemStatus
  base_url: string
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface ExternalSystemsResponse {
  data: ExternalSystem[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface GetExternalSystemsParams {
  page?: number
  page_size?: number
  search?: string
  status?: ExternalSystemStatus
}

export interface CreateExternalSystemRequest {
  name: string
  base_url: string
  status?: ExternalSystemStatus
}

export interface UpdateExternalSystemRequest {
  name: string
  base_url: string
  status?: ExternalSystemStatus
}

export interface ExternalSystemResponse {
  data: ExternalSystem
  transaction_id: string
  timestamp: string
}

