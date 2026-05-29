import { httpClient } from '@/lib/http-client'
import type { AccessLevelsResponse } from '@/types/access-levels'
export type { AccessLevelsResponse }

/**
 * Obtiene los niveles de acceso disponibles para roles y tipos de documentos
 */
export async function getAccessLevels(): Promise<string[]> {
  const response = await httpClient.get('/api/v1/role-doctype/access-levels')
  const data: AccessLevelsResponse = await response.json()
  return data.data
}
