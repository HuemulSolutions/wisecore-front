// ─── Entities ─────────────────────────────────────────────────────────────────

/** A DOCX template attached to a Template resource */
export interface DocxTemplate {
  id: string
  name: string
  file_name: string
  mime_type: string
  file_size: number
  template_id: string
  created_at: string
  updated_at: string
}

/** A DOCX template available for a document/execution export, with source info */
export interface AvailableDocxTemplate {
  id: string
  name: string
  file_name: string
  mime_type: string
  file_size: number
  source_type: 'document' | 'template'
  source_id: string
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface DocxTemplatesResponse {
  transaction_id: string
  data: DocxTemplate[]
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface DocxTemplateResponse {
  transaction_id: string
  data: DocxTemplate
  timestamp: string
}

export interface AvailableDocxTemplatesResponse {
  transaction_id: string
  data: AvailableDocxTemplate[]
  timestamp: string
}

// ─── Request params ───────────────────────────────────────────────────────────

export interface GetDocxTemplatesParams {
  page?: number
  page_size?: number
}

export interface RenameDocxTemplateRequest {
  name: string
}
