export interface ContextItem {
  id: string
  name: string
  content: string
}

export interface ContextDisplayProps {
  item: ContextItem
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  hideHeader?: boolean
}
