export type Dependency = { 
  id: string
  name: string
}

export interface SortableSectionItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
}

export interface SortableSectionSheetItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
}
