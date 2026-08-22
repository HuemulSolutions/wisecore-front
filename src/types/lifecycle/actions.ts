import type { QueryKey, UseMutationResult } from '@tanstack/react-query'
import type { LifecycleStatus, LifecyclePermissions } from '@/types/assets'
import type { FinalLifecycleStage } from '@/types/document-types'

// ----------------------------------------
// useLifecycleActions
// ----------------------------------------

export type PendingVersionLifecycleAction =
  | { kind: 'complete'; options?: { comment?: string; run_external_review?: boolean } }
  | { kind: 'advance'; options?: { comment?: string; skip_published?: boolean; publish_step_id?: string; run_external_publish?: boolean } }

export type LifecycleChangeSummaryStatus = 'pending' | 'completed' | 'failed' | null

/**
 * Capacidades RBAC globales que se cruzan con el lifecycle del documento para
 * decidir si las transiciones están disponibles.
 *
 * Granularidad GRUESA a propósito (`asset:u`, no `section_execution:u` /
 * `version:u`): mismo criterio que `AssetRbacCaps` en useDocumentAccess.ts.
 */
export interface LifecycleRbacCaps {
  /** asset:u — completar/devolver, publicar, archivar, restaurar, asignar versión. */
  canTransition: boolean
}

export interface UseLifecycleActionsOptions {
  documentId: string | null | undefined
  executionId: string | null | undefined
  organizationId: string | null | undefined
  /** Para leer `final_lifecycle_stage` del tipo de activo (oculta "Publicar" si el tipo nunca llega a publicarse). */
  documentTypeId?: string | null
  lifecycleStatus?: LifecycleStatus | null
  lifecyclePermissions?: LifecyclePermissions | null
  /**
   * OBLIGATORIA a propósito (mismo criterio que el 3er parámetro de
   * `computeFrontendPermissions`): el lifecycle contesta "¿sos el revisor DE
   * ESTE documento?" y RBAC "¿tu rol te permite esta acción EN ABSOLUTO?".
   * Sin default, un call-site futuro que se olvide de cruzar RBAC rompe el
   * build en vez de reabrir el hueco en silencio.
   */
  rbac: LifecycleRbacCaps
  /** Extra query keys to refetch (besides `['document-content', documentId]`) after every mutation settles. */
  extraRefreshKeys?: () => QueryKey[]
  /** Runs right before an advance (publish/archive) mutation fires — e.g. to preserve scroll position. */
  onBeforeAdvance?: () => void
  /** Runs after `checkMutation` (complete/return the current step) succeeds — e.g. to close a wizard that chained into this transition. */
  onAfterComplete?: () => void
  /** Opens a version-compare view for the approval step's "ver cambios" action. Omit to hide that action. */
  onViewChanges?: (previousExecutionId: string, currentExecutionId: string) => void
  /** `custom_fields:l|r` del scope de la página. Gatea la query que alimenta la validación de obligatorios sin valor. */
  canListCustomFields?: boolean
  /** Abre el tab de campos personalizados del documento. Omitir donde ese tab no existe (WorkflowDetailPanel): el botón "Ir a campos personalizados" se oculta. */
  onOpenCustomFields?: () => void
}

export interface LifecycleActionsController {
  status: LifecycleStatus | null | undefined
  permissions: LifecyclePermissions | null | undefined
  /** Eje RBAC del cruce (asset:u). Se ANDea con el lifecycle en cada affordance. */
  canTransition: boolean
  /** Etapa en la que termina el ciclo de vida del tipo de activo. Default `'publish'` mientras carga. */
  finalLifecycleStage: FinalLifecycleStage

  isCheckDialogOpen: boolean
  setIsCheckDialogOpen: (open: boolean) => void
  isRejectDialogOpen: boolean
  setIsRejectDialogOpen: (open: boolean) => void
  isPublishDialogOpen: boolean
  setIsPublishDialogOpen: (open: boolean) => void
  isArchiveDialogOpen: boolean
  setIsArchiveDialogOpen: (open: boolean) => void
  isRestoreDialogOpen: boolean
  setIsRestoreDialogOpen: (open: boolean) => void
  isAssignVersionDialogOpen: boolean
  setIsAssignVersionDialogOpen: (open: boolean) => void
  isRequiredCustomFieldsDialogOpen: boolean
  setIsRequiredCustomFieldsDialogOpen: (open: boolean) => void

  checkMutation: UseMutationResult<unknown, unknown, { comment?: string; run_external_review?: boolean } | undefined>
  rejectMutation: UseMutationResult<unknown, unknown, { comment: string; target_state?: string; target_step_id?: string } | undefined>
  advanceMutation: UseMutationResult<unknown, unknown, { comment?: string; skip_published?: boolean; publish_step_id?: string; run_external_publish?: boolean } | undefined>
  assignVersionMutation: UseMutationResult<unknown, unknown, { major: number; minor: number; patch: number }>
  restoreMutation: UseMutationResult<unknown, unknown, { comment?: string } | undefined>
  runExternalPublishMutation: UseMutationResult<unknown, unknown, void>

  // Auxiliary data for the "complete" (review) dialog.
  hasExternalReview: boolean
  isApprovalStep: boolean
  changeSummary: string | null
  changeSummaryStatus: LifecycleChangeSummaryStatus
  changeSummaryError: string | null
  canViewChanges: boolean
  isSummaryLoading: boolean
  handleViewChanges: () => void
  /** Obligatorios sin valor para el aviso preventivo. Vacío si la transición no sale de draft. */
  missingRequiredCustomFields: string[]
  /** Campos que el backend reportó al rechazar la transición (local, o parseados del detail como fallback). */
  requiredCustomFieldsError: string[]
  /** Passthrough de la opción homónima; undefined = la superficie no tiene tab de custom fields. */
  onOpenCustomFields?: () => void
}

// ----------------------------------------
// HuemulLifecycleActions
// ----------------------------------------

export interface HuemulLifecycleActionsProps {
  controller: LifecycleActionsController
  /** `compact` = pill row inside a shaded box (mobile header); `row` = plain inline row (desktop metadata row / panels). */
  variant?: 'compact' | 'row'
  /** Render the "re-lanzar publish externo" button inline. Assets' desktop row hides it behind the more-options dropdown instead. */
  showRerunExternalPublish?: boolean
  className?: string
}

export interface HuemulLifecycleStageBadgeProps {
  status: LifecycleStatus | null | undefined
  className?: string
}

// ----------------------------------------
// HuemulLifecycleDialogs
// ----------------------------------------

export interface HuemulLifecycleDialogsProps {
  controller: LifecycleActionsController
  executionId: string | null | undefined
  organizationId: string | null | undefined
  existingVersions?: string[]
}
