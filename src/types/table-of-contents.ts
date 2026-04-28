export interface TocItem {
  id: string
  title: string
  level: number
  hasPendingSuggestion?: boolean
}

export interface TableOfContentsProps {
  items: TocItem[]
}
