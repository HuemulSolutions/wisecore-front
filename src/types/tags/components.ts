import type { Tag, TagObjectType } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

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
 * Sheet reutilizable para asignar/quitar etiquetas de un objeto etiquetable
 * (documento, template o tipo de activo). Se abre desde la pantalla del
 * propio objeto — no desde /tags. Guardado inmediato: cada alta/baja del
 * combobox dispara su propia mutación (la API es idempotente por par).
 */
export interface TagsObjectSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectType: TagObjectType
  objectId: string
  /** Nombre del objeto para el título ("Etiquetas de <nombre>"). Opcional. */
  objectName?: string
  /** Puede asignar/quitar etiquetas (tag:u). Sin esto, el sheet es de solo lectura. */
  canAssign?: boolean
  /** Puede ver las etiquetas asignadas (tag:r). Sin esto, no se monta contenido. */
  canView?: boolean
}
