// ─── useLifecycleProgress ─────────────────────────────────────────────────────
//
// Progreso visual de las confirmaciones de ciclo de vida (stepper de fases +
// panel "N de M" de la fase actual + próximo paso), calculado en el frontend
// a partir de `useAllLifecycleSteps` + `getRollbackTargets`. Ver
// `src/hooks/useLifecycleProgress.ts`.

export type LifecyclePhaseState = 'done' | 'current' | 'upcoming'

export interface LifecyclePhase {
  /** Clave del hito (`create/edit/review/approve/approved/published`), ver `LIFECYCLE_MILESTONES`. */
  key: string
  label: string
  state: LifecyclePhaseState
}

export type LifecycleStepProgressState = 'done' | 'current' | 'upcoming'

export interface LifecycleStepProgressItem {
  id: string
  name: string | null
  state: LifecycleStepProgressState
  roleNames: string[]
}

export interface LifecycleCurrentPhaseProgress {
  /** `type` crudo del step (create/edit/review/approve/publish/archive/view). */
  stage: string
  label: string
  steps: LifecycleStepProgressItem[]
  completed: number
  total: number
}

export interface LifecycleNextStep {
  name: string | null
  stage: string
  roleNames: string[]
}

export interface LifecycleProgress {
  phases: LifecyclePhase[]
  currentPhase: LifecycleCurrentPhaseProgress | null
  nextStep: LifecycleNextStep | null
  /** `false` = no se pudo leer la config de steps (sin permiso o sin datos) — degradar, no pintar progreso. */
  isAvailable: boolean
}
