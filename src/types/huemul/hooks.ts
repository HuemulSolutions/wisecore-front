export interface TableLoadingStateOptions {
  /** isLoading from TanStack Query - true when no cached data exists */
  isLoading: boolean
  /** isFetching from TanStack Query - true on every in-flight request */
  isFetching: boolean
  /** Whether the query has returned data at least once */
  hasData: boolean
}

export interface TableLoadingStateResult {
  /** Show full-page loader: only on the very first load (no data ever loaded) */
  showPageLoader: boolean
  /** Pass to DataTable isLoading: skeleton rows when there is no data to display */
  isTableLoading: boolean
  /** Pass to DataTable isFetching: subtle bar + dimmed rows when refetching with existing data */
  isTableFetching: boolean
}

export interface UseUrlTabOptions<T extends string> {
  /** Valores admitidos. El primero es el fallback si no se pasa `fallback`. */
  tabs: readonly T[]
  fallback?: T
  /** Nombre del search param. Default `"tab"`. */
  param?: string
  /**
   * Mientras sea `false` no se normaliza la URL. Sirve para esperar a que
   * resuelvan los permisos antes de reescribir un tab no permitido.
   */
  ready?: boolean
  /**
   * Reescribe la URL cuando el valor del param es inválido o ausente.
   * Default `false`: el tab inválido cae al fallback solo en lectura, sin
   * tocar la URL (comportamiento de `users.tsx` / `roles.tsx`).
   */
  normalize?: boolean
}

export interface UseUrlTabResult<T extends string> {
  /** Tab vigente: el de la URL si es válido, el fallback si no. */
  tab: T
  /** Escribe el tab en la URL (siempre con `replace`). */
  setTab: (tab: T) => void
  /**
   * Escribe el tab sobre un `URLSearchParams` que el llamador ya está armando,
   * para actualizar el tab junto a otros params en una sola navegación.
   */
  applyTab: (params: URLSearchParams, tab: T) => void
}

export interface UseScrollPreservationReturn {
  scrollContainerRef: import('react').RefObject<HTMLDivElement | null>
  saveScrollPosition: () => void
  restoreScrollPosition: () => void
  preserveScroll: () => void
}
