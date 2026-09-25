import { parseErrorDetail } from "@/lib/error-utils"
import type { AdvanceBlocker, LifecycleStatus } from "@/types/assets"

/**
 * Bloqueos de `can_advance` reportados por el backend (respuestas obligatorias
 * pendientes en alguna sección tipo formulario). Contraparte de
 * `custom-field-required-utils.ts` para el nuevo código
 * REQUIRED_ANSWERS_PENDING (ver "ia context" — fix del backend que conecta
 * `advance_blockers` a `can_advance`/`can_complete`).
 */
export function getAdvanceBlockers(status: LifecycleStatus | null | undefined): AdvanceBlocker[] {
  return status?.advance_blockers ?? []
}

function isAdvanceBlockerShape(value: unknown): value is AdvanceBlocker {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as AdvanceBlocker).section_execution_id === "string" &&
    typeof (value as AdvanceBlocker).section_name === "string"
  )
}

/**
 * El `detail` de REQUIRED_ANSWERS_PENDING es JSON estructurado (mismo shape
 * que `advance_blockers`), a diferencia del texto libre de
 * CUSTOM_FIELD_DOCUMENT_REQUIRED_VALUE_MISSING — se parsea con
 * `parseErrorDetail`, no con una regex. Devuelve `[]` si no matchea la forma
 * esperada, para que el llamador caiga al toast genérico y nunca a un diálogo
 * vacío.
 */
export function parseAdvanceBlockersDetail(error: unknown): AdvanceBlocker[] {
  const parsed = parseErrorDetail<unknown>(error)
  const list = Array.isArray(parsed) ? parsed : []
  return list.filter(isAdvanceBlockerShape)
}
