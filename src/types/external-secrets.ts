export interface ExternalSecret {
  id: string
  external_system_id: string
  secret_key: string
  name: string
  created_at: string
  updated_at: string
}

export interface ExternalSecretsResponse {
  data: ExternalSecret[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
}

export interface ExternalSecretResponse {
  data: ExternalSecret
  transaction_id: string
}

export interface GetExternalSecretsParams {
  page?: number
  page_size?: number
  search?: string
}

export interface CreateExternalSecretRequest {
  secret_key: string
  name: string
  secret_value: string
}

export interface UpdateExternalSecretRequest {
  secret_key?: string
  name?: string
  secret_value?: string
}
