export interface Dependency {
  document_id: string
  document_name: string
  section_name: string | null
  dependency_type: string
}

export interface DocumentType {
  id: string
  name: string
  color: string
}

export interface AddDependencySheetProps {
  id: string
  isSheetOpen?: boolean
  canEdit?: boolean
}
