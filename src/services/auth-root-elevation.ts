/**
 * Modo administrador (`/api/v1/auth/root-elevation/*`, docs/sso-frontend.md §2.1).
 *
 * La URL contiene `/auth/`: `httpClient` manda el token de login y no agrega
 * `X-Org-Id`. El backend acepta el Bearer de login o de organización (mismo `sub`).
 * El token que devuelve `verify` lo guarda `rootElevationStore`, nunca un servicio.
 */
import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  RootElevationCodeResult,
  RootElevationResponse,
  RootElevationStatus,
  RootElevationVerifyResult,
} from '@/types/auth'

const BASE_URL = `${backendUrl}/auth/root-elevation`

/** Envía el código al correo del root admin. 403 `ROOT_ADMIN_REQUIRED` si ya no es root activo. */
export async function requestRootElevationCode(): Promise<RootElevationCodeResult> {
  const response = await httpClient.post(`${BASE_URL}/code`)
  const data = (await response.json()) as RootElevationResponse<RootElevationCodeResult>
  return data.data
}

/** Canjea el código por el token de elevación. 400 si el código es inválido o venció. */
export async function verifyRootElevationCode(code: string): Promise<RootElevationVerifyResult> {
  const response = await httpClient.post(`${BASE_URL}/verify`, { code })
  const data = (await response.json()) as RootElevationResponse<RootElevationVerifyResult>
  return data.data
}

export async function getRootElevationStatus(): Promise<RootElevationStatus> {
  const response = await httpClient.get(`${BASE_URL}/status`)
  const data = (await response.json()) as RootElevationResponse<RootElevationStatus>
  return data.data
}

export type { RootElevationCodeResult, RootElevationStatus, RootElevationVerifyResult } from '@/types/auth'
