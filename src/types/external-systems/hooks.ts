import type { ExternalSystemStatus } from './core'

export interface UseExternalSystemsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  status?: ExternalSystemStatus
}
