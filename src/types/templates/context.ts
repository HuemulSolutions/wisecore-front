// Contexto de texto a nivel de TEMPLATE (GET/POST/PATCH/DELETE /templates/{id}/context).
// A diferencia del contexto de documento (@/types/context), a nivel template
// solo existe la variante de texto — no hay contexto de archivo.

export interface TemplateContext {
  id: string
  name: string
  content: string
  context_kind: string
  template_id: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// context_kind se omite a propósito: el backend lo default-ea a "text" y un
// valor inválido devuelve 400. La UI no expone el selector (ver plan).
export interface CreateTemplateContextRequest {
  name: string
  content: string
}

export interface UpdateTemplateContextRequest {
  name?: string
  content?: string
}

export interface UseTemplateContextsOptions {
  enabled?: boolean
}
