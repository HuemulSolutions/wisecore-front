// Contexto de texto a nivel de TEMPLATE (GET/POST/PATCH/DELETE /templates/{id}/context).
// A diferencia del contexto de documento (@/types/context), a nivel template
// solo existe la variante de texto — no hay contexto de archivo.

export interface TemplateContext {
  id: string
  name: string
  /** Puede venir null: contexto placeholder creado con required=true y sin contenido. */
  content: string | null
  context_kind: string
  template_id: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  /** Bloquea la generación con IA de los documentos que lo heredan mientras no tenga contenido. */
  required: boolean
}

// context_kind se omite a propósito: el backend lo default-ea a "text" y un
// valor inválido devuelve 400. La UI no expone el selector (ver plan).
export interface CreateTemplateContextRequest {
  name: string
  content?: string
  required?: boolean
}

export interface UpdateTemplateContextRequest {
  name?: string
  content?: string
  required?: boolean
}

export interface UseTemplateContextsOptions {
  enabled?: boolean
}
