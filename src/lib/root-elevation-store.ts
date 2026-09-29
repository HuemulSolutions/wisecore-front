/**
 * Store fuera de React del modo administrador (docs/sso-frontend.md §2.1, Fase 7).
 *
 * El backend no autoriza ninguna acción de root por el token de sesión: exige el
 * header `X-Root-Elevation` con un token que se obtiene verificando un código
 * enviado al correo y que vence a los 30 minutos (absolutos, el uso no los renueva).
 *
 * - El token vive SOLO en memoria (nunca en localStorage/sessionStorage): un F5 o
 *   una pestaña nueva salen del modo. Así un XSS no lo lee de un storage y no se
 *   comparte entre pestañas.
 * - `getToken()` deja de devolverlo `EXPIRY_MARGIN_MS` antes del vencimiento: un
 *   header vencido hace fallar también rutas de org admin (el backend resuelve root
 *   primero), así que nunca se manda uno a punto de vencer.
 * - `requestElevation()` abre el diálogo (`RootElevationDialog`, montado una vez en
 *   `App.tsx`) y devuelve una promesa compartida: varios 403 en paralelo abren un
 *   solo diálogo y todos esperan el mismo resultado.
 * - Login/logout (`sessionEvents`) y `clearSession` de `AuthProvider` lo limpian.
 *
 * Mismo patrón que `auth-step-up-store.ts` (módulo + `useSyncExternalStore`,
 * anclado en `globalThis`).
 */
import { sessionEvents } from '@/lib/session-events'

/** Por qué se pide el código: lo exigió una acción, venció, o el usuario entró a mano. */
export type RootElevationReason = 'required' | 'expired' | 'manual'

export interface RootElevationSnapshot {
  /** Vencimiento del token vigente (epoch ms); `null` fuera del modo administrador. */
  expiresAt: number | null
  /** Pedido de código abierto (el diálogo se muestra mientras no sea `null`). */
  prompt: { id: number; reason: RootElevationReason } | null
}

/** Margen antes del vencimiento a partir del cual el token ya no se manda. */
export const EXPIRY_MARGIN_MS = 5_000

/** Header con el que viaja el token (`src/modules/auth/root_elevation.py` del backend). */
export const ROOT_ELEVATION_HEADER = 'X-Root-Elevation'

type StoreState = {
  token: string | null
  expiresAt: number | null
  timer: ReturnType<typeof setTimeout> | null
  pending: { promise: Promise<boolean>; settle: (ok: boolean) => void } | null
  snapshot: RootElevationSnapshot
  listeners: Set<() => void>
  subscribedToSession: boolean
  /** Distingue un pedido del siguiente (el diálogo se reinicia por `id`). */
  nextPromptId: number
}

const GLOBAL_KEY = '__wisecoreRootElevationStore'
const EMPTY: RootElevationSnapshot = { expiresAt: null, prompt: null }

const globalScope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: StoreState }
const state: StoreState =
  globalScope[GLOBAL_KEY] ??
  (globalScope[GLOBAL_KEY] = {
    token: null,
    expiresAt: null,
    timer: null,
    pending: null,
    snapshot: EMPTY,
    listeners: new Set(),
    subscribedToSession: false,
    nextPromptId: 1,
  })

function emit(): void {
  // Snapshot nuevo solo cuando algo cambió: `useSyncExternalStore` exige referencia estable.
  const prompt = state.snapshot.prompt
  state.snapshot = { expiresAt: state.token ? state.expiresAt : null, prompt }
  state.listeners.forEach((listener) => listener())
}

function setPrompt(prompt: RootElevationSnapshot['prompt']): void {
  state.snapshot = { ...state.snapshot, prompt }
  emit()
}

function clearTimer(): void {
  if (state.timer !== null) {
    clearTimeout(state.timer)
    state.timer = null
  }
}

function clearToken(): void {
  clearTimer()
  if (state.token === null && state.expiresAt === null) return
  state.token = null
  state.expiresAt = null
  emit()
}

/** Cierra el pedido abierto (si lo hay) con el resultado dado. */
function settlePending(ok: boolean): void {
  const pending = state.pending
  state.pending = null
  if (state.snapshot.prompt !== null) setPrompt(null)
  pending?.settle(ok)
}

function ensureSessionSubscription(): void {
  if (state.subscribedToSession) return
  state.subscribedToSession = true
  sessionEvents.subscribe(() => {
    clearToken()
    settlePending(false)
  })
}

ensureSessionSubscription()

export const rootElevationStore = {
  subscribe(listener: () => void): () => void {
    state.listeners.add(listener)
    return () => {
      state.listeners.delete(listener)
    }
  },

  /** Referencia estable cuando nada cambió (React 19 lo exige). */
  getSnapshot(): RootElevationSnapshot {
    return state.snapshot
  },

  /** El token vigente, o `null` fuera del modo o a menos de `EXPIRY_MARGIN_MS` de vencer. */
  getToken(): string | null {
    if (!state.token || state.expiresAt === null) return null
    return Date.now() < state.expiresAt - EXPIRY_MARGIN_MS ? state.token : null
  },

  isElevated(): boolean {
    return rootElevationStore.getToken() !== null
  },

  /** Guarda el token recién verificado y programa su limpieza al vencer. */
  setElevation(token: string, expiresAt: number): void {
    clearTimer()
    state.token = token
    state.expiresAt = expiresAt
    const delay = Math.max(0, expiresAt - EXPIRY_MARGIN_MS - Date.now())
    state.timer = setTimeout(clearToken, delay)
    emit()
  },

  /** Sale del modo administrador (botón "salir", 403 `ROOT_ADMIN_REQUIRED`, cambio de sesión). */
  clear(): void {
    clearToken()
  },

  /**
   * El backend rechazó `token` (vencido o inválido): sale del modo solo si ese sigue
   * siendo el token vigente. Una respuesta atrasada de una request enviada antes de
   * verificar un código nuevo no debe borrar el token recién obtenido.
   */
  discard(token: string | null): void {
    if (token !== null && state.token === token) clearToken()
  },

  /**
   * Pide el código al usuario. Resuelve `true` cuando el token nuevo quedó guardado y
   * `false` si canceló. Un pedido ya abierto se reutiliza.
   */
  requestElevation(reason: RootElevationReason): Promise<boolean> {
    if (state.pending) return state.pending.promise
    let settle!: (ok: boolean) => void
    const promise = new Promise<boolean>((resolve) => {
      settle = resolve
    })
    state.pending = { promise, settle }
    setPrompt({ id: state.nextPromptId++, reason })
    return promise
  },

  /**
   * El código del pedido `promptId` se verificó: guarda el token y libera a quienes
   * esperaban. Si ese pedido ya no es el vigente (se canceló, cambió la sesión o se abrió
   * otro mientras el verify viajaba), se ignora: una respuesta tardía no activa el modo.
   */
  resolve(promptId: number, token: string, expiresAt: number): void {
    if (state.snapshot.prompt?.id !== promptId) return
    rootElevationStore.setElevation(token, expiresAt)
    settlePending(true)
  },

  /** El usuario cerró el diálogo sin verificar. */
  cancel(): void {
    settlePending(false)
  },

  /** Solo para tests. */
  reset(): void {
    clearTimer()
    state.token = null
    state.expiresAt = null
    const pending = state.pending
    state.pending = null
    state.snapshot = EMPTY
    pending?.settle(false)
    state.listeners.forEach((listener) => listener())
  },
}
