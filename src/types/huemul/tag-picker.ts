import type { FetchOptionsParams } from './field'

/** Etiqueta tal como la necesita el picker: sin campos de dominio (created_at, etc). */
export interface HuemulTagPickerTag {
  id: string
  name: string
  color?: string | null
  /** Cantidad de objetos que usan la etiqueta. Opcional: se omite si el backend no lo expone. */
  usageCount?: number
}

export interface HuemulTagPickerFetchResult {
  tags: HuemulTagPickerTag[]
  hasMore: boolean
}

export type HuemulTagPickerVariant = 'field' | 'cell' | 'bulk'

export interface HuemulTagPickerTarget {
  id: string
  tagIds: string[]
}

export interface HuemulTagPickerProps {
  /** Objetos sobre los que se aplica: 1 elemento en field/cell, N en modo bulk. */
  targets: HuemulTagPickerTarget[]
  variant: HuemulTagPickerVariant
  /** Permiso de crear etiquetas nuevas en el catálogo global. */
  canCreate: boolean
  /** Permiso de asignar/desasignar. Sin él, el picker es de solo lectura (sin "x", sin disparador). */
  canAssign: boolean
  fetchTags: (params: FetchOptionsParams) => Promise<HuemulTagPickerFetchResult>
  /**
   * Etiquetas ya asignadas al target (modo simple) o unión de asignadas entre
   * todos los targets (modo bulk, para poder resolver el tri-estado). Siempre
   * se muestran aunque no vengan en la página actual del catálogo.
   */
  assignedTags: HuemulTagPickerTag[]
  /** Recibe la etiqueta completa (no solo el id): permite al caller aplicar un
   *  update optimista con nombre/color sin tener que buscarla de nuevo. */
  onAssign: (tag: HuemulTagPickerTag, targetIds: string[]) => Promise<void>
  onUnassign: (tagId: string, targetIds: string[]) => Promise<void>
  onCreate: (name: string) => Promise<HuemulTagPickerTag>
  /** Enlace a la administración del catálogo (/tags), mostrado en el pie del popover. */
  manageHref?: string
  disabled?: boolean
  className?: string
  /** Textos ya traducidos por el caller — este componente no asume namespace de dominio. */
  labels: HuemulTagPickerLabels
}

export interface HuemulTagPickerLabels {
  addTag: string
  searchPlaceholder: string
  noResults: string
  noResultsCannotCreate: string
  createAndAssign: (name: string) => string
  duplicateName: string
  selectExisting: string
  applyingTo: (count: number) => string
  partialHint: string
  allLabel: string
  partialLabel: string
  keyboardHint: string
  manageTags: string
  removeTag: (name: string) => string
  moreCount: (count: number) => string
  empty: string
  loading: string
}
