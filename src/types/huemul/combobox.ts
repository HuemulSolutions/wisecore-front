import type { LucideIcon } from 'lucide-react'
import type { FetchOptionsParams, FetchOptionsResult } from './field'

export interface HuemulComboboxOption {
  value: string
  label: string
  description?: string
  color?: string
  icon?: LucideIcon
}

export interface HuemulComboboxProps {
  id?: string
  /** Selección única → string; múltiple → string[]. */
  value: string | string[]
  onValueChange: (value: string | string[]) => void
  /** Activa selección múltiple con chips. value pasa a ser string[]. @default false */
  multiSelect?: boolean

  // ── Modo estático (sin caja de búsqueda, sin filtrado) ──────────────────
  /** Opciones en memoria. Se renderizan tal cual; NO se filtran client-side. */
  options?: HuemulComboboxOption[]

  // ── Modo async (server-side, con buscador) ──────────────────────────────
  fetchOptions?: (params: FetchOptionsParams) => Promise<FetchOptionsResult>
  /** @default 10 */
  pageSize?: number
  /** Debounce de la búsqueda server-side en ms. @default 300 */
  debounceMs?: number
  /** Buscar solo al presionar Enter en vez de con debounce. @default false */
  searchOnEnter?: boolean
  /** Opciones fijadas arriba de los resultados async (p.ej. "Sin asignar"). */
  staticOptions?: HuemulComboboxOption[]
  staticOptionsLabel?: string
  asyncResultsLabel?: string
  /** Etiquetas/colores precargados para valores ya seleccionados que aún no
   *  están en la lista (resuelve el display label inicial en async). */
  selectedOptions?: HuemulComboboxOption[]
  /** Se dispara (junto a onValueChange) con el label de la opción resuelta al
   *  seleccionar o limpiar. Permite a los callers cachear nombres (p.ej. chips).
   *  Solo aplica en selección única. */
  onSelectedLabelChange?: (label?: string) => void

  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  error?: boolean | string
  className?: string
}
