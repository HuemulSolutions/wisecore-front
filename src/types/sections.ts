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
  type?: "ai" | "manual" | "reference"
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  template_section_id?: string
}

export interface SortableSectionSheetItem {
  id: string
  name: string
  prompt: string
  order: number
  dependencies: Dependency[]
  type?: "ai" | "manual" | "reference"
  manual_input?: string
  reference_section_id?: string
  reference_mode?: "latest" | "specific"
  reference_execution_id?: string
  template_section_id?: string
}
