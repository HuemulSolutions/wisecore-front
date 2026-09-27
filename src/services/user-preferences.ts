import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import { ApiError } from '@/types/api-error'
import type {
  UserPreference,
  UserPreferenceResponse,
} from '@/types/user-preferences'

const BASE_URL = `${backendUrl}/user/preferences`

/**
 * `null` significa "la clave nunca se guardó" (404 PREFERENCE_NOT_FOUND) —
 * es el estado normal de una preferencia nueva, no un error. Cualquier otro
 * fallo se relanza tal cual.
 */
export async function getUserPreference<T>(
  organizationId: string,
  key: string,
): Promise<UserPreference<T> | null> {
  try {
    const response = await httpClient.get(`${BASE_URL}/${encodeURIComponent(key)}`, {
      headers: { 'X-Org-Id': organizationId },
    })
    const data = (await response.json()) as UserPreferenceResponse<T>
    return data.data
  } catch (error) {
    if (ApiError.isApiError(error) && (error.statusCode === 404 || error.code === 'PREFERENCE_NOT_FOUND')) {
      return null
    }
    throw error
  }
}

export async function setUserPreference<T>(
  organizationId: string,
  key: string,
  value: T,
): Promise<UserPreference<T>> {
  const response = await httpClient.put(
    `${BASE_URL}/${encodeURIComponent(key)}`,
    { value },
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as UserPreferenceResponse<T>
  return data.data
}

export async function deleteUserPreference(
  organizationId: string,
  key: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${encodeURIComponent(key)}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { UserPreference, UserPreferenceResponse }
