import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserPreference, setUserPreference, deleteUserPreference } from '@/services/user-preferences'

const DEFAULT_DEBOUNCE_MS = 800

export const userPreferenceQueryKeys = {
  all: ['user-preferences'] as const,
  detail: (organizationId: string, key: string) =>
    [...userPreferenceQueryKeys.all, 'detail', organizationId, key] as const,
}

const localStorageKey = (organizationId: string | null | undefined, key: string) =>
  `wisecore:pref:${organizationId ?? 'none'}:${key}`

function readLocal<T>(
  organizationId: string | null | undefined,
  key: string,
  parse: (raw: unknown) => T | null,
): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(localStorageKey(organizationId, key))
    if (!raw) return null
    return parse(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeLocal<T>(organizationId: string | null | undefined, key: string, value: T) {
  try {
    window.localStorage.setItem(localStorageKey(organizationId, key), JSON.stringify(value))
  } catch {
    // modo privado, cuota excedida — la sesión sigue andando en memoria.
  }
}

function removeLocal(organizationId: string | null | undefined, key: string) {
  try {
    window.localStorage.removeItem(localStorageKey(organizationId, key))
  } catch {
    // sin storage disponible — nada que limpiar.
  }
}

export interface UseUserPreferenceOptions<T> {
  key: string
  organizationId: string | null | undefined
  defaultValue: T
  /** Valida/normaliza un blob crudo (localStorage o servidor). null → descartar. */
  parse: (raw: unknown) => T | null
  enabled?: boolean
  debounceMs?: number
}

export interface UseUserPreferenceResult<T> {
  /** Lectura síncrona sin disparar re-render — para callbacks con deps acotadas. */
  valueRef: MutableRefObject<T>
  value: T
  setValue: (next: T) => void
  /** Borra la preferencia (local + servidor) y vuelve a `defaultValue`. */
  remove: () => void
  /** El GET inicial ya resolvió (con o sin valor). */
  isServerLoaded: boolean
  /** El servidor trajo un valor distinto del que había en el caché local al montar. */
  serverDiffered: boolean
}

/**
 * Preferencia de usuario híbrida: localStorage para pintado instantáneo sin
 * parpadeo, servidor (`/user/preferences/{key}`) como fuente de verdad
 * cross-device. Si el backend falla o no responde, la preferencia sigue
 * funcionando solo con localStorage — nunca rompe la interacción.
 *
 * El valor reactivo vive en el caché de TanStack Query (no en un useState
 * local): dos instancias del hook con la misma `key`/`organizationId`
 * comparten la misma entrada de caché, así que un `setValue` en una
 * actualiza a la otra sin pasar por props ni contexto.
 *
 * Un `GET` que responde 404 (clave nunca guardada) **conserva** el valor que
 * ya había en el caché/localStorage — nunca lo pisa con `defaultValue`.
 *
 * Usar solo para preferencias que deben seguir al usuario entre
 * dispositivos/navegadores. Para todo lo demás, el hook simple con
 * localStorage (ver `ia context/persistencia-estado-ui-guide.md`) alcanza.
 */
export function useUserPreference<T>({
  key,
  organizationId,
  defaultValue,
  parse,
  enabled = true,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseUserPreferenceOptions<T>): UseUserPreferenceResult<T> {
  const queryClient = useQueryClient()
  const queryKey = userPreferenceQueryKeys.detail(organizationId ?? '', key)

  // Semilla local por (org, key) — capturada una vez al entrar a esa
  // combinación (no en cada render): sirve de `initialData` síncrono
  // (pintado sin parpadeo) y de base de comparación para `serverDiffered`.
  // Recalcular durante el render (no en un efecto) es el mismo idiom que
  // `activeAssetIdRef` en nav-knowledge.tsx — seguro porque solo muta un ref.
  const orgKeyToken = `${organizationId ?? 'none'}:${key}`
  const seedRef = useRef<{ orgKey: string; value: T } | null>(null)
  const lastWrittenAtRef = useRef(-1)
  if (seedRef.current?.orgKey !== orgKeyToken) {
    seedRef.current = { orgKey: orgKeyToken, value: readLocal(organizationId, key, parse) ?? defaultValue }
    lastWrittenAtRef.current = -1
  }

  const query = useQuery<T>({
    queryKey,
    queryFn: async () => {
      const server = await getUserPreference<unknown>(organizationId!, key)
      const parsed = server ? parse(server.value) : null
      // null del servidor = clave nunca guardada, no un valor vacío: conserva
      // lo que ya hay en caché (la semilla local) en vez de reemplazarlo.
      return parsed ?? queryClient.getQueryData<T>(queryKey) ?? seedRef.current!.value
    },
    initialData: () => seedRef.current!.value,
    initialDataUpdatedAt: 0,
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
    meta: { showErrorToast: false },
  })

  const value = query.data ?? defaultValue
  // Lectura síncrona sin re-render, mismo idiom que activeAssetIdRef en
  // nav-knowledge.tsx.
  const valueRef = useRef(value)
  valueRef.current = value

  const serverDiffered = query.isFetched && JSON.stringify(query.data) !== JSON.stringify(seedRef.current!.value)

  const skipNextWriteRef = useRef(false)

  // Persiste en localStorage cualquier cambio del valor que no haya venido
  // de `setValue`/`remove` de esta misma instancia (esos ya escriben
  // directo) — cubre la hidratación desde el servidor y un refresh manual.
  useEffect(() => {
    if (query.dataUpdatedAt === lastWrittenAtRef.current) return
    lastWrittenAtRef.current = query.dataUpdatedAt
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }
    writeLocal(organizationId, key, query.data ?? defaultValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt])

  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingWriteRef = useRef<{ organizationId: string; value: T } | null>(null)

  const flushPendingWrite = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
    }
    const pending = pendingWriteRef.current
    if (!pending) return
    pendingWriteRef.current = null
    setUserPreference(pending.organizationId, key, pending.value).catch(() => {
      // El caché local ya tiene el valor — un fallo de red no debe
      // interrumpir al usuario ni mostrar un toast.
    })
  }, [key])

  useEffect(() => flushPendingWrite, [flushPendingWrite])

  const setValue = useCallback(
    (next: T) => {
      // Sin esto, `setValue(mismoValor)` igual redistribuye una referencia
      // nueva a todo lo que lea esta `queryKey` (cualquier otra instancia de
      // `useUserPreference` con la misma key/organizationId) — un caller que
      // llame `setValue` desde un efecto sin memoizar bien sus deps puede
      // convertir eso en un loop de renders (ver huemul-file-tree.tsx).
      if (JSON.stringify(next) === JSON.stringify(queryClient.getQueryData<T>(queryKey))) return
      skipNextWriteRef.current = true
      queryClient.setQueryData<T>(queryKey, next)
      writeLocal(organizationId, key, next)

      if (!organizationId) return
      pendingWriteRef.current = { organizationId, value: next }
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = setTimeout(flushPendingWrite, debounceMs)
    },
    [organizationId, key, queryKey, debounceMs, flushPendingWrite, queryClient],
  )

  const remove = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
    }
    pendingWriteRef.current = null
    skipNextWriteRef.current = true
    queryClient.setQueryData<T>(queryKey, defaultValue)
    removeLocal(organizationId, key)
    if (organizationId) {
      deleteUserPreference(organizationId, key).catch(() => {
        // Idem: la clave local ya se borró, un fallo de red no interrumpe.
      })
    }
  }, [organizationId, key, queryKey, defaultValue, queryClient])

  return { valueRef, value, setValue, remove, isServerLoaded: query.isFetched, serverDiffered }
}
