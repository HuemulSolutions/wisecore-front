/**
 * Ida y vuelta al proveedor de identidad (docs/sso-frontend.md §2).
 *
 * El backend maneja la cookie del flujo OIDC (`state`, `nonce`, PKCE); el
 * frontend solo necesita recordar, en `sessionStorage`, qué estaba haciendo el
 * usuario para retomarlo cuando el IdP lo devuelva a `/auth/sso/callback`.
 */
import { sanitizeReturnPath } from '@/lib/return-url'
import type { SsoFlowPayload } from '@/types/auth'

const KEY = 'sso.flow'

export interface SsoPendingState {
  /** Conexión a la que se fue. */
  connectionId: string
  /** Nombre visible del proveedor (para mensajes). */
  connectionName: string
  /** Email con el que se inició el login, si se conoce. */
  email: string | null
  /** Ruta relativa a la que volver después del login. */
  returnUrl: string | null
  /** Organización a seleccionar tras el login (step-up o caso C). */
  pendingOrganizationId: string | null
  /** Marca de tiempo (ms) para descartar estados viejos. */
  startedAt: number
}

const MAX_AGE_MS = 15 * 60 * 1000

export function savePendingSsoState(state: Omit<SsoPendingState, 'startedAt'>): void {
  const payload: SsoPendingState = { ...state, returnUrl: sanitizeReturnPath(state.returnUrl), startedAt: Date.now() }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* modo privado: la vuelta será a /home */
  }
}

export function peekPendingSsoState(): SsoPendingState | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SsoPendingState
    if (!parsed || typeof parsed.startedAt !== 'number' || Date.now() - parsed.startedAt > MAX_AGE_MS) {
      clearPendingSsoState()
      return null
    }
    return { ...parsed, returnUrl: sanitizeReturnPath(parsed.returnUrl) }
  } catch {
    return null
  }
}

export function consumePendingSsoState(): SsoPendingState | null {
  const state = peekPendingSsoState()
  clearPendingSsoState()
  return state
}

export function clearPendingSsoState(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

/**
 * Navegación real al IdP. Es un objeto (no una función suelta) para que los
 * tests puedan hacer `vi.spyOn(ssoNavigation, 'assign')`: jsdom no implementa
 * `window.location.assign` y la propiedad no es configurable.
 */
export const ssoNavigation = {
  assign(url: string): void {
    window.location.assign(url)
  },
}

export interface BeginSsoRedirectOptions {
  sso: SsoFlowPayload
  email?: string | null
  returnUrl?: string | null
  pendingOrganizationId?: string | null
}

/** Guarda el estado pendiente y manda al usuario al `authorize_url` del backend. */
export function beginSsoRedirect({ sso, email = null, returnUrl = null, pendingOrganizationId = null }: BeginSsoRedirectOptions): void {
  savePendingSsoState({
    connectionId: sso.connection_id,
    connectionName: sso.name,
    email,
    returnUrl,
    pendingOrganizationId,
  })
  ssoNavigation.assign(sso.authorize_url)
}
