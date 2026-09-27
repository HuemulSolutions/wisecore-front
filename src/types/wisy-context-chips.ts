import type { WorkingContextItem } from './chatbot'

export interface WisyContextChipProps {
  item: WorkingContextItem
  onRemove: (type: string, id: string) => void
}

export interface WisyContextChipsProps {
  items: WorkingContextItem[]
  onRemove: (type: string, id: string) => void
  /** Current page context item to suggest adding */
  currentPageContext?: WorkingContextItem | null
  /** Called when the user clicks the "add current page" badge */
  onAddCurrentPage?: () => void
}
