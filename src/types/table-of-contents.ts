export interface TocItem {
  id: string
  title: string
  level: number
}

export interface TableOfContentsProps {
  items: TocItem[]
}
