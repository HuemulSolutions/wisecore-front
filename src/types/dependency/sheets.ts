export type DependencyVersionMode = 'published' | 'latest_approved' | 'specific'

export interface DocumentType {
  id: string
  name: string
  color: string
}

export interface Dependency {
  id: string
  document_id: string
  document_name: string
  section_name: string | null
  dependency_type: string
  version_mode: DependencyVersionMode
  depends_on_execution_id: string | null
  depends_on_execution_name: string | null
  // Opcional: el backend puede no enviarlo todavía. Ver "ia context/" — pendiente
  // agregar document_type al payload de GET /documents/{id}/dependencies.
  document_type?: DocumentType | null
}

export interface AddDependencySheetProps {
  id: string
  isSheetOpen?: boolean
  canEdit?: boolean
}

export interface CreateDependencyRequest {
  depends_on_document_id: string
  version_mode?: DependencyVersionMode
  depends_on_execution_id?: string | null
}

export interface UpdateDependencyVersionRequest {
  version_mode?: DependencyVersionMode
  depends_on_execution_id?: string | null
}

export interface DependencyVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Documento dependido: nombre para el título, id para listar sus executions. */
  dependsOnDocumentId: string
  dependsOnDocumentName: string
  /** undefined/null = modo creación; presente = edición de una dependencia existente. */
  dependency?: Dependency | null
  onConfirm: (body: UpdateDependencyVersionRequest) => Promise<void>
  isSubmitting?: boolean
}
