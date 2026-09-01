import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useAllLifecycleSteps } from "@/hooks/useLifecycle"
import { getRollbackTargets } from "@/services/executions"
import {
  pipelineSortIndex,
  getLifecycleMilestones,
  isGroupableStepType,
  milestoneForStage,
} from "@/lib/lifecycle-access"
import type { LifecycleStatus } from "@/types/assets"
import type { FinalLifecycleStage } from "@/types/document-types"
import type { LifecycleNextStep, LifecycleProgress, LifecycleStep } from "@/types/lifecycle"

export interface UseLifecycleProgressOptions {
  documentTypeId: string | null | undefined
  executionId: string | null | undefined
  organizationId: string | null | undefined
  lifecycleStatus: LifecycleStatus | null | undefined
  finalLifecycleStage: FinalLifecycleStage
  /**
   * Habilita `useAllLifecycleSteps` (config de steps del tipo de activo —
   * nombres, orden). De acá salen `phases` y `nextStep`. Se comparte cache
   * por `documentTypeId`, así que puede quedar prendido más tiempo que un
   * sheet puntual (ej. mientras el botón "Completar" necesita el label del
   * próximo destino) sin costo de refetch entre documentos del mismo tipo.
   */
  enabled: boolean
  /**
   * Habilita `getRollbackTargets` (por ejecución, `staleTime: 0`), que solo
   * alimenta `completedIds` para el panel "N de M" (`currentPhase`). Sin
   * completar, los steps previos de la fase actual quedan como `upcoming` en
   * vez de `done` — por eso se gatea aparte, solo mientras un sheet lo
   * muestra.
   */
  includeCompletion: boolean
}

const EMPTY_PROGRESS: LifecycleProgress = {
  phases: [],
  currentPhase: null,
  nextStep: null,
  isAvailable: false,
}

/**
 * Progreso visual (stepper de fases + panel "N de M" de la fase actual +
 * próximo paso) para las confirmaciones de ciclo de vida. Cruza dos fuentes
 * ya existentes:
 * - `useAllLifecycleSteps` (config de steps del tipo de activo — nombres,
 *   roles, orden) para el denominador y los nombres.
 * - `getRollbackTargets` (misma query key que `LifecycleRollbackSheet`, así
 *   comparten cache) para saber qué steps quedaron atrás — es la fuente
 *   correcta incluso después de un rollback, a diferencia del historial de
 *   eventos (que nunca "des-completa" un step ya hecho).
 *
 * Best-effort: si el GET de steps falla o no trae datos (típicamente por
 * permisos — hoy ese endpoint solo se consume en pantallas admin),
 * `isAvailable` es `false` y el caller debe omitir el stepper/panel sin
 * avisar ni bloquear la confirmación.
 */
export function useLifecycleProgress({
  documentTypeId,
  executionId,
  organizationId,
  lifecycleStatus,
  finalLifecycleStage,
  enabled,
  includeCompletion,
}: UseLifecycleProgressOptions): LifecycleProgress {
  const { t } = useTranslation("assets")

  const { data: allStepsData } = useAllLifecycleSteps(documentTypeId ?? null, enabled && !!documentTypeId)

  // Misma query key que `LifecycleRollbackSheet` — comparten el fetch.
  const { data: rollbackTargets } = useQuery({
    queryKey: ["rollback-targets", executionId, organizationId],
    queryFn: () => getRollbackTargets(executionId!, organizationId!),
    enabled: includeCompletion && !!executionId && !!organizationId,
    staleTime: 0,
  })

  const steps = allStepsData?.data?.steps
  if (!steps || steps.length === 0) return EMPTY_PROGRESS

  const ordered = [...steps].sort(
    (a, b) => pipelineSortIndex(a.type) - pipelineSortIndex(b.type) || (a.order ?? 0) - (b.order ?? 0),
  )
  const completedIds = new Set((rollbackTargets?.steps ?? []).map((s) => s.step_id))
  const currentStepId = lifecycleStatus?.current_step_id ?? null
  const currentStage = lifecycleStatus?.stage ?? null

  const stageLabel = (key: string) => t(`lifecycle.stageLabels.${key}`, { defaultValue: key })

  // ── Stepper de fases ────────────────────────────────────────────────────
  const presentStageTypes = new Set(ordered.map((s) => s.type))
  const milestoneKeys = getLifecycleMilestones(finalLifecycleStage, presentStageTypes)
  const currentMilestoneIndex = currentStage ? milestoneKeys.indexOf(milestoneForStage(currentStage)) : -1
  // El stepper siempre necesita un nodo actual: si el `stage` no cae en la lista
  // recortada, se asume el último hito. `nextStep` NO usa este fallback (no se
  // adivina un destino).
  const phaseIndex = currentMilestoneIndex === -1 ? milestoneKeys.length - 1 : currentMilestoneIndex
  const phases = milestoneKeys.map((key, index) => ({
    key,
    label: stageLabel(key),
    state: (index < phaseIndex ? "done" : index === phaseIndex ? "current" : "upcoming") as
      | "done"
      | "current"
      | "upcoming",
  }))

  // ── Panel "N de M" de la fase actual (solo etapas con varios steps: grupos) ──
  const currentPhase =
    currentStage && isGroupableStepType(currentStage)
      ? (() => {
          const stepsInStage = ordered.filter((s) => s.type === currentStage)
          if (stepsInStage.length === 0) return null
          const items = stepsInStage.map((s) => ({
            id: s.id,
            name: s.name,
            state: (completedIds.has(s.id) ? "done" : s.id === currentStepId ? "current" : "upcoming") as
              | "done"
              | "current"
              | "upcoming",
            roleNames: s.step_roles.map((r) => r.role_name).filter((name): name is string => !!name),
          }))
          return {
            stage: currentStage,
            label: stageLabel(currentStage),
            steps: items,
            completed: items.filter((i) => i.state === "done").length,
            total: items.length,
          }
        })()
      : null

  // ── Próximo paso ─────────────────────────────────────────────────────────
  // El destino NO es el siguiente step del array plano: eso mostraba "Publish"
  // en la aprobación (saltándose el hito "Aprobado", que sí pinta el stepper del
  // mismo sheet) y podía caer en steps que no son destinos de flujo
  // (`publish`/`archive`/`view`). Es el siguiente step del grupo actual si queda
  // alguno, y si el paso cierra la fase, el siguiente hito del stepper.
  const toNextStep = (step: LifecycleStep): LifecycleNextStep => ({
    name: step.name,
    stage: step.type,
    roleNames: step.step_roles.map((r) => r.role_name).filter((name): name is string => !!name),
  })

  const nextStep = (() => {
    if (!currentStage) return null

    // 1. Grupo secuencial en curso (edit/review/approve con varios steps).
    //    `will_advance_phase` del backend es la autoridad sobre si este paso
    //    cierra la fase; la lista local solo resuelve el nombre.
    if (!lifecycleStatus?.will_advance_phase && currentStepId) {
      const stepsInStage = ordered.filter((s) => s.type === currentStage)
      const currentIndex = stepsInStage.findIndex((s) => s.id === currentStepId)
      const nextInStage = currentIndex === -1 ? undefined : stepsInStage[currentIndex + 1]
      if (nextInStage) return toNextStep(nextInStage)
    }

    // 2. Cierra fase → siguiente hito del stepper (ya recortado por
    //    `final_lifecycle_stage` y por los stages con steps configurados).
    if (currentMilestoneIndex === -1) return null
    const nextMilestone = milestoneKeys[currentMilestoneIndex + 1]
    if (!nextMilestone) return null
    const firstOfMilestone = ordered.find((s) => s.type === nextMilestone)
    // Los hitos terminales (`approved`/`published`) no son steps: `name: null`
    // hace que el caller pinte el label traducido de la etapa.
    return firstOfMilestone ? toNextStep(firstOfMilestone) : { name: null, stage: nextMilestone, roleNames: [] }
  })()

  return { phases, currentPhase, nextStep, isAvailable: true }
}
