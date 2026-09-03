import { lifecycleAllows, lifecycleStageAllowsEditing } from "@/hooks/useDocumentAccess"
import type { LifecyclePermissions, LifecycleStatus } from "@/types/assets"
import type { FinalLifecycleStage } from "@/types/document-types"

export type WorkflowFinishOutcome = "answersSent" | "sentToApproval" | "approved" | "published"

/** `lifecycle_status.state` → outcome terminal, para los estados en los que el
 *  usuario puede quedarse sin nada más por hacer (ver `resolveWorkflowFinishOutcome`).
 *  `archived` y cualquier otro estado no listado quedan fuera a propósito: archivar
 *  no es un cierre de ESTE flujo (responder/aprobar/publicar). */
const STATE_TO_OUTCOME: Partial<Record<string, WorkflowFinishOutcome>> = {
  draft: "answersSent",
  in_review: "answersSent",
  in_approval: "sentToApproval",
  approved: "approved",
  published: "published",
  finalized: "published",
}

/**
 * Resuelve la tarjeta terminal a mostrar en el link compartido, o `null` si al
 * usuario le sigue quedando algo por hacer (responder alguna sección, ejecutar
 * la próxima transición, o publicar) — en ese caso el wizard sigue su
 * comportamiento actual. Puro, sin `t` ni React — mismo criterio que
 * `lifecycle-labels.ts`.
 *
 * DECLARATIVO a propósito: se llama en cada render (no solo tras el `onSuccess`
 * de una mutación), para cubrir tanto "acabo de completar mi parte en esta
 * sesión" como "abrí el link cuando el documento YA estaba en este estado"
 * (p. ej. otra persona con el mismo rol ya completó el grupo). Una sola regla
 * para las 4 filas de la tabla de diseño: no se rastrea "qué botón apretó" el
 * usuario, se evalúa el estado actual del documento.
 *
 * `canStillPublish` es un término aparte porque publicar no pasa por
 * `can_advance` — se gatea igual que en `HuemulLifecycleActions`
 * (permissions.publish + state "approved" + final_lifecycle_stage "publish").
 */
export function resolveWorkflowFinishOutcome(input: {
  status?: LifecycleStatus | null
  permissions?: LifecyclePermissions | null
  canTransition: boolean
  finalLifecycleStage: FinalLifecycleStage
  /**
   * Al menos una sección del wizard es respondible AHORA por este usuario.
   * Sin este factor, un permiso de ROL "edit" vigente (`lifecycle_permissions.edit`)
   * más una etapa no terminal (`stage: "edit"`) se leían como "sigue pudiendo
   * responder" aunque el grupo activo del step ya sea de OTRO rol — hand-off
   * entre grupos secuenciales de la MISMA etapa (mismo `state`/`stage`, el
   * `current_step_id` avanzó igual), donde `formSections` queda vacío para
   * este usuario sin que el lifecycle "termine" en ningún sentido detectable
   * por `state`/`stage` solos.
   */
  hasAnswerableSection: boolean
}): WorkflowFinishOutcome | null {
  const { status, permissions, canTransition, finalLifecycleStage, hasAnswerableSection } = input
  if (!status) return null

  const canStillAnswer =
    canTransition &&
    lifecycleAllows(permissions ?? undefined, "edit") &&
    lifecycleStageAllowsEditing(status) &&
    hasAnswerableSection
  // `isBlockedByRequiredAnswers` no es un outcome de esta tabla: es "otra sección
  // tiene respuestas obligatorias pendientes", con su propio aviso (`blockedTitle`)
  // — cuenta como "todavía hay algo pendiente", no como cierre del flujo.
  const canStillAdvance = canTransition && (!!status.can_advance || !!status.advance_blockers?.length)
  const canStillPublish =
    canTransition && !!permissions?.publish && status.state === "approved" && finalLifecycleStage === "publish"

  if (canStillAnswer || canStillAdvance || canStillPublish) return null

  return STATE_TO_OUTCOME[status.state] ?? null
}
