import { httpClient } from '@/lib/http-client'

export interface AccessLevelsResponse {
  data: string[]
  transaction_id: string
  timestamp: string
}

/**
 * Obtiene los niveles de acceso disponibles para roles y tipos de documentos
 */
export async function getAccessLevels(): Promise<string[]> {
  const response = await httpClient.get('/api/v1/role-doctype/access-levels')
  if (!response.ok) {
    throw new Error('Failed to fetch access levels')
  }
  const data: AccessLevelsResponse = await response.json()
  return data.data
}