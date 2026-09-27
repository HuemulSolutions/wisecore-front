export interface TocItem {
  id: string
  title: string
  level: number
  hasPendingSuggestion?: boolean
  /** Respuestas obligatorias visibles sin valor (ContentSection.missing_required). */
  missingRequired?: number
}

export interface TableOfContentsProps {
  items: TocItem[]
}
