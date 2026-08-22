/**
 * Acceso de una sección de plantilla por etapa del ciclo de vida.
 *
 * El backend solo persiste los pares (sección, step) configurados explícitamente:
 * si no hay fila para un par, esa sección HEREDA el permiso del documento completo
 * en ese step — no queda oculta. Por eso no existe un valor `"hidden"` — «sin
 * configurar» se representa con la ausencia de la fila, y se consigue con un DELETE.
 */
export type TemplateSectionAccess = 'view' | 'edit'

export interface TemplateSectionLifecycleAccess {
  id: string
  template_section_id: string
  lifecycle_step_id: string
  /** Fila por rol en vez de global. Esta pasada solo lee/escribe filas con `role_id` ausente/null. */
  role_id?: string | null
  access: TemplateSectionAccess
}

export interface TemplateSectionLifecycleAccessResponse {
  data: TemplateSectionLifecycleAccess[]
  transaction_id: string
}

export interface SetTemplateSectionAccessRequest {
  access: TemplateSectionAccess
  /** No se envía todavía — la UI de acceso por rol queda pendiente. */
  role_id?: string
}

/** Sección de plantilla tal como la devuelve `GET /templates/{id}/lifecycle_access_matrix`. */
export interface TemplateLifecycleAccessMatrixSection {
  id: string
  name: string
  order: number
}

/** Step del ciclo de vida tal como lo devuelve el mismo endpoint. */
export interface TemplateLifecycleAccessMatrixStep {
  id: string
  document_type_id: string
  type: string
  name: string
  order: number
}

/**
 * Payload completo de `GET /templates/{template_id}/lifecycle_access_matrix`:
 * secciones, steps y accesos configurados en una sola llamada. `access` es sparse
 * (ver el comentario de `TemplateSectionAccess` arriba) y puede incluir steps de
 * cualquier tipo de activo vinculado al template — hay que filtrar por
 * `document_type_id` en el consumidor.
 */
export interface TemplateLifecycleAccessMatrix {
  template_id: string
  sections: TemplateLifecycleAccessMatrixSection[]
  lifecycle_steps: TemplateLifecycleAccessMatrixStep[]
  access: TemplateSectionLifecycleAccess[]
}
