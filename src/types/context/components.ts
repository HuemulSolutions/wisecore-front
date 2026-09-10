import type { ContextItem } from './core'

export interface ContextDisplayProps {
  // content siempre string acá: los call-sites resuelven el fallback
  // ("Sin contenido disponible") antes de pasar el item.
  item: Pick<ContextItem, 'id' | 'name' | 'context_type'> & { content: string }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  hideHeader?: boolean
}

export interface AddContextSheetProps {
  id: string
  isSheetOpen?: boolean
  canEdit?: boolean
}
