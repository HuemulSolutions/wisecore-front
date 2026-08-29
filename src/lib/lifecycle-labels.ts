import { LIFECYCLE_PIPELINE_ORDER } from "@/lib/lifecycle-access"
import type { LifecycleStatus } from "@/types/assets"

/**
 * Resuelve la clave i18n del botón/CTA de "completar" un paso del ciclo de
 * vida según la etapa actual y (si se conoce) el destino real del avance.
 * Puro — sin `t`, sin React — para poder testear/reusar entre el botón y el
 * sheet de confirmación sin duplicar la lógica.
 *
 * Antes el label era fijo ("Completar") sin importar la etapa: en aprobación
 * decía lo mismo que en un borrador. Reglas (ver ia context/ si se agrega
 * un nuevo tipo de step):
 * 1. Si el paso cierra la fase (`will_advance_phase`) y se conoce el destino
 *    → nombra el destino ("Enviar a aprobación").
 * 2. Si cierra fase desde `approve` sin destino conocido → "Aprobar y finalizar".
 * 3. Si no cierra fase → verbo de la etapa actual ("Completar revisión").
 * 4. Fallback: `lifecycle.complete` ("Completar") — nunca peor que antes.
 */
export function completeActionLabelKey(
  status: Pick<LifecycleStatus, "stage" | "will_advance_phase"> | null | undefined,
  nextStage: string | null | undefined,
): string {
  if (!status?.stage) return "lifecycle.complete"

  const stage = isKnownStage(status.stage) ? status.stage : null

  if (status.will_advance_phase) {
    if (nextStage && isKnownStage(nextStage)) {
      return `lifecycle.completeLabels.advanceTo.${nextStage}`
    }
    if (stage === "approve") return "lifecycle.completeLabels.approveFinal"
  }

  if (stage) return `lifecycle.completeLabels.stage.${stage}`

  return "lifecycle.complete"
}

/** Misma lógica que `completeActionLabelKey`, para el tooltip (incluye nombre de grupo/etapa como params). */
export function completeActionTooltipKey(
  status: Pick<LifecycleStatus, "stage" | "will_advance_phase" | "current_group"> | null | undefined,
  nextStage: string | null | undefined,
): { key: string; params?: Record<string, string> } {
  if (!status?.stage) return { key: "lifecycle.tooltipComplete" }

  if (status.will_advance_phase) {
    if (nextStage && isKnownStage(nextStage)) {
      return { key: "lifecycle.tooltipCompletePhaseTo", params: { stage: status.stage, next: nextStage } }
    }
    return { key: "lifecycle.tooltipCompletePhase" }
  }

  if (status.current_group) {
    return { key: "lifecycle.tooltipCompleteStep", params: { step: status.current_group, stage: status.stage } }
  }

  return { key: "lifecycle.tooltipComplete" }
}

function isKnownStage(stage: string): boolean {
  return (LIFECYCLE_PIPELINE_ORDER as readonly string[]).includes(stage)
}
