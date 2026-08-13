/**
 * Acceso de una sección de plantilla por etapa del ciclo de vida.
 *
 * El backend solo persiste los pares (sección, step) que son visibles: si no hay
 * fila para un par, esa sección queda OCULTA en ese step. Por eso no existe un
 * valor `"hidden"` — «sin acceso» se representa con la ausencia de la fila, y se
 * consigue con un DELETE.
 */
export type TemplateSectionAccess = 'view' | 'edit'

export interface TemplateSectionLifecycleAccess {
  id: string
  template_section_id: string
  lifecycle_step_id: string
  access: TemplateSectionAccess
}

export interface TemplateSectionLifecycleAccessResponse {
  data: TemplateSectionLifecycleAccess[]
  transaction_id: string
}

export interface SetTemplateSectionAccessRequest {
  access: TemplateSectionAccess
}
