/**
 * Store fuera de React para el step-up de autenticación (docs/sso-frontend.md §2).
 *
 * Cuando `POST /user_roles/user_token` responde 403 `AUTH_METHOD_REQUIRED`, la
 * organización exige entrar con otro método que el usado en el login. Quien lo
 * captura (diálogo de selección, OrgSync de AppLayout, callback SSO) llama
 * `open()`; `AuthMethodRequiredDialog`, montado una vez en `App.tsx`, lo muestra.
 *
 * Mismo patrón que `error-report-store.ts` (módulo + `useSyncExternalStore`,
 * anclado en `globalThis`). Además lleva un contador de intentos por
 * `organización + método` en `sessionStorage`: al segundo intento en 10 minutos
 * el diálogo pasa a modo manual (sin redirección automática) para no entrar en un
 * loop con el proveedor de identidad.
 */
import type { RequiredAuthFlow } from '@/types/auth'

export type StepUpSource = 'dialog' | 'orgsync' | 'callback' | 'test'

export interface StepUpRequest {
  organizationId: string
  organizationName?: string | null
  required: RequiredAuthFlow
  source: StepUpSource
  /**
   * Qué deshacer si el usuario no completa el step-up (cancela o elige otra
   * organización). No corre si el token llega (`resolve`).
   */
  onCancel?: () => void
}

export interface StepUpSnapshot {
  request: StepUpRequest
  /** true: ya se intentó este método para esta organización hace poco; no auto-redirigir. */
  manual: boolean
  attempts: number
}

type StoreState = { current: StepUpSnapshot | null; listeners: Set<() => void> }

const GLOBAL_KEY = '__wisecoreAuthStepUpStore'
const ATTEMPTS_KEY = 'auth.stepUp'
const ATTEMPTS_WINDOW_MS = 10 * 60 * 1000
const MANUAL_AFTER_ATTEMPTS = 2

const globalScope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: StoreState }
const state: StoreState = globalScope[GLOBAL_KEY] ?? (globalScope[GLOBAL_KEY] = { current: null, listeners: new Set() })

interface AttemptsRecord {
  key: string
  attempts: number
  ts: number
}

export function methodKeyOf(required: RequiredAuthFlow): string {
  return required.auth_flow === 'sso' ? `sso:${required.sso.connection_id}` : 'internal_code'
}

function readAttempts(): AttemptsRecord | null {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AttemptsRecord
    if (!parsed || typeof parsed.ts !== 'number' || Date.now() - parsed.ts > ATTEMPTS_WINDOW_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeAttempts(record: AttemptsRecord | null): void {
  try {
    if (record) sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(record))
    else sessionStorage.removeItem(ATTEMPTS_KEY)
  } catch {
    /* noop */
  }
}

function emit(): void {
  state.listeners.forEach((listener) => listener())
}

/** Cierra el pedido actual y lo devuelve (null si no había). */
function clear(): StepUpSnapshot | null {
  const current = state.current
  if (current === null) return null
  state.current = null
  emit()
  return current
}

export const authStepUpStore = {
  subscribe(listener: () => void): () => void {
    state.listeners.add(listener)
    return () => {
      state.listeners.delete(listener)
    }
  },
  /** Referencia estable cuando nada cambió (React 19 lo exige). */
  getSnapshot(): StepUpSnapshot | null {
    return state.current
  },
  /** Registra el pedido de step-up y cuenta el intento para esa organización + método. */
  open(request: StepUpRequest): StepUpSnapshot {
    const key = `${request.organizationId}:${methodKeyOf(request.required)}`
    const previous = readAttempts()
    const attempts = previous && previous.key === key ? previous.attempts + 1 : 1
    writeAttempts({ key, attempts, ts: Date.now() })
    state.current = { request, attempts, manual: attempts >= MANUAL_AFTER_ATTEMPTS }
    emit()
    return state.current
  },
  /** El usuario canceló: cierra sin tocar el contador y corre el `onCancel` del pedido. */
  close(): void {
    clear()?.request.onCancel?.()
  },
  /** El token de organización llegó: se limpia el contador y se cierra. */
  resolve(): void {
    writeAttempts(null)
    clear()
  },
  /** Solo para tests. */
  reset(): void {
    writeAttempts(null)
    state.current = null
    emit()
  },
}
