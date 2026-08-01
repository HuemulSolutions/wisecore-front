import type { QueryKey, UseMutationResult } from '@tanstack/react-query'
import type { LifecycleStatus, LifecyclePermissions } from '@/types/assets'

// ----------------------------------------
// useLifecycleActions
// ----------------------------------------

export type PendingVersionLifecycleAction =
  | { kind: 'complete'; options?: { comment?: string; run_external_review?: boolean } }
  | { kind: 'advance'; options?: { comment?: string; skip_published?: boolean; publish_step_id?: string; run_external_publish?: boolean } }

export type LifecycleChangeSummaryStatus = 'pending' | 'completed' | 'failed' | null

export interface UseLifecycleActionsOptions {
  documentId: string | null | undefined
  executionId: string | null | undefined
  organizationId: string | null | undefined
  lifecycleStatus?: LifecycleStatus | null
  lifecyclePermissions?: LifecyclePermissions | null
  /** Extra query keys to refetch (besides `['document-content', documentId]`) after every mutation settles. */
  extraRefreshKeys?: () => QueryKey[]
  /** Runs right before an advance (publish/archive) mutation fires — e.g. to preserve scroll position. */
  onBeforeAdvance?: () => void
  /** Opens a version-compare view for the approval step's "ver cambios" action. Omit to hide that action. */
  onViewChanges?: (previousExecutionId: string, currentExecutionId: string) => void
}

export interface LifecycleActionsController {
  status: LifecycleStatus | null | undefined
  permissions: LifecyclePermissions | null | undefined

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
