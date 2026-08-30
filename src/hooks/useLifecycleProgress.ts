import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useAllLifecycleSteps } from "@/hooks/useLifecycle"
import { getRollbackTargets } from "@/services/executions"
import { pipelineSortIndex, getLifecycleMilestones, isGroupableStepType } from "@/lib/lifecycle-access"
import type { LifecycleStatus } from "@/types/assets"
import type { FinalLifecycleStage } from "@/types/document-types"
import type { LifecycleProgress } from "@/types/lifecycle"

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
  let currentMilestoneIndex = currentStage ? milestoneKeys.indexOf(currentStage) : -1
  if (currentMilestoneIndex === -1) currentMilestoneIndex = milestoneKeys.length - 1
  const phases = milestoneKeys.map((key, index) => ({
    key,
    label: stageLabel(key),
    state: (index < currentMilestoneIndex ? "done" : index === currentMilestoneIndex ? "current" : "upcoming") as
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
  const nextStep = (() => {
    if (!currentStepId) return null
    const currentIndex = ordered.findIndex((s) => s.id === currentStepId)
    if (currentIndex === -1) return null
    const next = ordered[currentIndex + 1]
    if (!next) return null
    return {
      name: next.name,
      stage: next.type,
      roleNames: next.step_roles.map((r) => r.role_name).filter((name): name is string => !!name),
    }
  })()

  return { phases, currentPhase, nextStep, isAvailable: true }
}
