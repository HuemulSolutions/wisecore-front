import type { Tag, TagObjectType } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'
import type { HuemulTagPickerVariant } from '@/types/huemul'

export interface TagsPageHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  tagsCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
  canCreate?: boolean
}

export interface TagsTableProps {
  tags: Tag[]
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  searchTerm?: string
  canUpdate?: boolean
  canDelete?: boolean
}

export interface TagsErrorStateProps {
  error?: unknown
  onRetry?: () => void
}

/**
 * Wrapper de dominio sobre `HuemulTagPicker`: resuelve `TagObjectType`, cablea
 * `useObjectTags`/`useTagMutations` y expone el popover de asignación anclado
 * en el lugar donde ya está la información (campo de detalle, celda de tabla).
 */
export interface TagsObjectPickerProps {
  objectType: TagObjectType
  /** Objetos sobre los que se aplica: 1 elemento en field/cell, N en bulk. */
  objectIds: string[]
  variant: HuemulTagPickerVariant
  /** Puede ver las etiquetas asignadas (tag:r/tag:l). Sin esto, se muestra vacío. */
  canView?: boolean
  /** Puede asignar/quitar (tag:u). Sin esto, el picker es de solo lectura. */
  canAssign?: boolean
  className?: string
}
