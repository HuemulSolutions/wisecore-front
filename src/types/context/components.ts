import type { ContextItem } from './core'

export interface ContextDisplayProps {
  item: ContextItem
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  hideHeader?: boolean
}

export interface AddContextSheetProps {
  id: string
  isSheetOpen?: boolean
  canEdit?: boolean
}
