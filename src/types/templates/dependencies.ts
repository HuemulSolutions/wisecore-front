// Dependencias a nivel de TEMPLATE (GET/POST/PATCH/DELETE /templates/{id}/dependencies).
import type { Dependency, DependencyVersionMode } from '@/types/dependency/sheets'

// El item del LISTADO paginado (GET /templates/{id}/dependencies) tiene
// exactamente el mismo shape que el de GET /documents/{id}/dependencies —
// se reusa el tipo tal cual, sin duplicarlo. (El detalle GET /templates/{id}
// trae los mismos datos con OTROS nombres de campo — depends_on_document_name,
// depends_on_section_name — pero ese payload no alimenta este listado.)
export type TemplateDependency = Dependency

export interface TemplateDependenciesResponse {
  data: TemplateDependency[]
  page: number
  page_size: number
  has_next: boolean
}

export interface CreateTemplateDependencyRequest {
  depends_on_document_id: string
  depends_on_section_id?: string | null
  version_mode?: DependencyVersionMode
  depends_on_execution_id?: string | null
}

export interface UpdateTemplateDependencyRequest {
  version_mode?: DependencyVersionMode
  depends_on_execution_id?: string | null
}

export interface UseTemplateDependenciesOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
}
