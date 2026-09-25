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
  /**
   * `null`/ausente: fila GLOBAL — aplica a cualquiera con acceso al step (por
   * `access_type`, ser dueño del documento, o un grant individual). Como mucho
   * una fila global por (sección, step).
   * Con valor: la fila aplica SOLO a ese rol del step — puede haber una por cada
   * rol asociado, cada una con su propio nivel. El rol debe estar previamente
   * asociado al step o el `PUT` falla.
   */
  role_id?: string | null
  access: TemplateSectionAccess
}

export interface TemplateSectionLifecycleAccessResponse {
  data: TemplateSectionLifecycleAccess[]
  transaction_id: string
}

export interface SetTemplateSectionAccessRequest {
  access: TemplateSectionAccess
  /** Ver el comentario de `role_id` en `TemplateSectionLifecycleAccess`. */
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
 * Acceso de `view` heredado por una sección desde `edit`/`review`/`approve` —
 * CALCULADO por el backend en cada request, no persistido (no tiene `id` propio,
 * a diferencia de `TemplateSectionLifecycleAccess`). `role_id: null` significa lo
 * mismo que en `TemplateSectionLifecycleAccess`: aplica a cualquiera elegible para
 * el step origen (owner, `access_type: "all"`, etc.), no solo a un rol puntual.
 *
 * Un par (sección, rol) puede aparecer AQUÍ y a la vez tener una fila propia en
 * `access` — se sigue pintando bloqueado en ambos casos, porque el DELETE de la
 * fila propia falla con 409 `SECTION_VIEW_ACCESS_INHERITED` mientras la herencia
 * siga vigente.
 */
export interface InheritedViewAccess {
  template_section_id: string
  role_id: string | null
  source_lifecycle_step_id: string
  source_lifecycle_step_type: string
}

/**
 * Payload completo de `GET /templates/{template_id}/lifecycle_access_matrix`:
 * secciones, steps y accesos configurados en una sola llamada. `access` es sparse
 * (ver el comentario de `TemplateSectionAccess` arriba) y puede incluir steps de
 * cualquier tipo de activo vinculado al template — hay que filtrar por
 * `document_type_id` en el consumidor. `inherited_view_access` es calculado (ver
 * `InheritedViewAccess`), no un subconjunto de `access`.
 */
export interface TemplateLifecycleAccessMatrix {
  template_id: string
  sections: TemplateLifecycleAccessMatrixSection[]
  lifecycle_steps: TemplateLifecycleAccessMatrixStep[]
  access: TemplateSectionLifecycleAccess[]
  inherited_view_access?: InheritedViewAccess[]
}
