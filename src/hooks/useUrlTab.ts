import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import type { UseUrlTabOptions, UseUrlTabResult } from "@/types/huemul"

/**
 * Mantiene el tab activo de una superficie en la URL (`?tab=...`), de forma que
 * el estado sea linkeable y sobreviva a un refresh.
 *
 * Única definición de este patrón: antes vivía copiado a mano en `users.tsx` y
 * `roles.tsx` (lectura con whitelist + escritura con `replace`), y la tercera
 * copia iba a ser la página de detalle de tipos de activo.
 *
 * Dos modos de tolerar un valor inválido, según lo que necesite la superficie:
 * - `normalize: false` (default) — cae al fallback solo en lectura, sin tocar la
 *   URL. Es lo que hacían `users`/`roles`.
 * - `normalize: true` — reescribe la URL. Necesario cuando el conjunto de tabs
 *   depende de permisos: un `?tab=lifecycle` que el usuario no puede ver debe
 *   quedar corregido, no solo ignorado. Combinar con `ready` para no reescribir
 *   antes de que los permisos resuelvan.
 */
export function useUrlTab<T extends string>({
  tabs,
  fallback,
  param = "tab",
  ready = true,
  normalize = false,
}: UseUrlTabOptions<T>): UseUrlTabResult<T> {
  const [searchParams, setSearchParams] = useSearchParams()

  const effectiveFallback = fallback ?? tabs[0]
  const raw = searchParams.get(param)
  const isValid = raw !== null && (tabs as readonly string[]).includes(raw)
  const tab = (isValid ? (raw as T) : effectiveFallback) as T

  const applyTab = useCallback(
    (params: URLSearchParams, next: T) => {
      params.set(param, next)
    },
    [param],
  )

  const setTab = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          applyTab(params, next)
          return params
        },
        // El tab no debe acumular entradas de historial: volver atrás tiene que
        // salir de la superficie, no recorrer los tabs visitados.
        { replace: true },
      )
    },
    [setSearchParams, applyTab],
  )

  useEffect(() => {
    if (!normalize || !ready || isValid) return
    // Sin tabs disponibles no hay nada que escribir (p. ej. permisos que no
    // habilitan ninguno): la superficie decide qué mostrar en ese caso.
    if (!effectiveFallback) return
    setTab(effectiveFallback)
  }, [normalize, ready, isValid, effectiveFallback, setTab])

  return { tab, setTab, applyTab }
}
