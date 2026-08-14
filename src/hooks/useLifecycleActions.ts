import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { handleApiError } from "@/lib/error-utils"
import { withRefresh } from "@/lib/query-utils"
import { useExternalReviewActions } from "@/hooks/useLifecycle"
import { executionLifecycleQueryKeys } from "@/hooks/useExecutionLifecycle"
import { getDocumentTypeById } from "@/services/document-types"
import {
  completeExecutionLifecycleStep,
  rejectExecutionLifecycle,
  advanceExecutionLifecycle,
  assignExecutionVersion,
  restoreExecutionLifecycle,
  runExternalPublish,
  getExecutionById,
} from "@/services/executions"
import type {
  UseLifecycleActionsOptions,
  LifecycleActionsController,
  PendingVersionLifecycleAction,
} from "@/types/lifecycle"

const VERSION_REQUIRED_CODE = "VERSION_REQUIRED_FOR_APPROVAL"

/** Defensa en profundidad: los botones ya no se renderizan sin `asset:u`. */
const NO_TRANSITION_PERMISSION = "Missing permission to transition the lifecycle"

/**
 * Controller for the execution lifecycle transitions (complete/return, publish,
 * archive, restore, assign version, re-run external publish) — shared by
 * `assets-content.tsx` and `WorkflowDetailPanel` so both consume the same
 * mutations/dialog state instead of duplicating them.
 *
 * Rendering is left to `HuemulLifecycleActions` / `HuemulLifecycleDialogs`; this
 * hook only owns state, mutations and the derived data those components need.
 *
 * Cruce lifecycle × RBAC: `rbac.canTransition` (asset:u) se ANDea con los
 * grants por documento. Acá vive el early-return de las 6 mutaciones — los
 * botones son cosméticos, el gate real es este choke point.
 * Ver ia context/rbac-audit-guide.md (pasada de /workflow).
 */
export function useLifecycleActions({
  documentId,
  executionId,
  organizationId,
  documentTypeId,
  lifecycleStatus,
  lifecyclePermissions,
  rbac,
  extraRefreshKeys,
  onBeforeAdvance,
  onViewChanges,
}: UseLifecycleActionsOptions): LifecycleActionsController {
  const { t } = useTranslation(["assets", "common"])
  const queryClient = useQueryClient()

  // Misma query key que el tab General del tipo de activo
  // (assets-types-general-form.tsx) — comparte cache, sin fetch extra.
  const { data: documentTypeData } = useQuery({
    queryKey: ["document-type", documentTypeId],
    queryFn: () => getDocumentTypeById(documentTypeId!),
    enabled: !!documentTypeId,
  })
  const finalLifecycleStage = documentTypeData?.data?.final_lifecycle_stage ?? "publish"

  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isAssignVersionDialogOpen, setIsAssignVersionDialogOpenState] = useState(false)
  const [pendingVersionAction, setPendingVersionAction] = useState<PendingVersionLifecycleAction | null>(null)

  // Closing the assign-version dialog (by any path — cancel, backdrop click, or
  // after a successful/failed confirm) must drop any pending retry action, or a
  // later unrelated "assign version" would wrongly re-trigger a stale complete/advance.
  const setIsAssignVersionDialogOpen = (open: boolean) => {
    if (!open) setPendingVersionAction(null)
    setIsAssignVersionDialogOpenState(open)
  }

  const refreshKeys = () => [["document-content", documentId], ...(extraRefreshKeys?.() ?? [])]

  const checkMutation = useMutation({
    mutationFn: withRefresh(
      async (options?: { comment?: string; run_external_review?: boolean }) => {
        if (!rbac.canTransition) throw new Error(NO_TRANSITION_PERMISSION)
        const stepId = lifecycleStatus?.current_step_id
        if (!executionId || !organizationId) throw new Error("Missing execution or organization")
        if (!stepId) throw new Error("Missing step ID")
        return completeExecutionLifecycleStep(executionId, stepId, organizationId, options)
      },
      queryClient,
      refreshKeys,
    ),
    onSuccess: () => {
      setIsCheckDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: executionLifecycleQueryKeys.eventsBase() })
    },
    meta: { successMessage: t("lifecycle.successComplete") },
    onError: (error, variables: { comment?: string; run_external_review?: boolean } | undefined) => {
      setIsCheckDialogOpen(false)
      handleApiError(error, {
        fallbackMessage: t("lifecycle.errorComplete"),
        onErrorCode: (code) => {
          if (code !== VERSION_REQUIRED_CODE) return false
          setPendingVersionAction({ kind: "complete", options: variables })
          setIsAssignVersionDialogOpen(true)
          return true
        },
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: withRefresh(
      async (options?: { comment: string; target_state?: string; target_step_id?: string }) => {
        if (!rbac.canTransition) throw new Error(NO_TRANSITION_PERMISSION)
        if (!executionId || !organizationId) throw new Error("Missing execution or organization")
        return rejectExecutionLifecycle(executionId, organizationId, options)
      },
      queryClient,
      () => [...refreshKeys(), ["rollback-targets"]],
    ),
    onSuccess: () => {
      setIsRejectDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: executionLifecycleQueryKeys.eventsBase() })
    },
    meta: { successMessage: t("lifecycle.successReturn") },
    onError: (error) => {
      setIsRejectDialogOpen(false)
      handleApiError(error, { fallbackMessage: t("lifecycle.errorReturn") })
    },
  })

  const advanceMutation = useMutation({
    mutationFn: withRefresh(
      async (options?: {
        comment?: string
        skip_published?: boolean
        publish_step_id?: string
        run_external_publish?: boolean
      }) => {
        if (!rbac.canTransition) throw new Error(NO_TRANSITION_PERMISSION)
        onBeforeAdvance?.()
        if (!executionId || !organizationId) throw new Error("Missing execution or organization")
        return advanceExecutionLifecycle(executionId, organizationId, options)
      },
      queryClient,
      refreshKeys,
    ),
    onSuccess: () => {
      setIsPublishDialogOpen(false)
      setIsArchiveDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: executionLifecycleQueryKeys.eventsBase() })
    },
    meta: { successMessage: t("lifecycle.successAdvance") },
    onError: (
      error,
      variables:
        | { comment?: string; skip_published?: boolean; publish_step_id?: string; run_external_publish?: boolean }
        | undefined,
    ) => {
      setIsPublishDialogOpen(false)
      setIsArchiveDialogOpen(false)
      handleApiError(error, {
        fallbackMessage: t("lifecycle.errorAdvance"),
        onErrorCode: (code) => {
          if (code !== VERSION_REQUIRED_CODE) return false
          setPendingVersionAction({ kind: "advance", options: variables })
          setIsAssignVersionDialogOpen(true)
          return true
        },
      })
    },
  })

  const assignVersionMutation = useMutation({
    mutationFn: withRefresh(
      async (version: { major: number; minor: number; patch: number }) => {
        if (!rbac.canTransition) throw new Error(NO_TRANSITION_PERMISSION)
        if (!executionId || !organizationId) throw new Error("Missing execution or organization")
        return assignExecutionVersion(executionId, version, organizationId)
      },
      queryClient,
      () => [...refreshKeys(), ["executions", documentId]],
    ),
    onSuccess: () => {
      if (executionId) {
        queryClient.removeQueries({ queryKey: ["execution-version-suggestion", executionId] })
      }
      setIsAssignVersionDialogOpen(false)
      const pending = pendingVersionAction
      setPendingVersionAction(null)
      if (pending?.kind === "advance") advanceMutation.mutate(pending.options)
      else if (pending?.kind === "complete") checkMutation.mutate(pending.options)
    },
    meta: { successMessage: t("mutations.versionAssigned") },
    onError: (error) => {
      setIsAssignVersionDialogOpen(false)
      setPendingVersionAction(null)
      handleApiError(error, { fallbackMessage: t("mutations.failedAssignVersion") })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: withRefresh(
      async (options?: { comment?: string }) => {
        if (!rbac.canTransition) throw new Error(NO_TRANSITION_PERMISSION)
        if (!executionId || !organizationId) throw new Error("Missing execution or organization")
        return restoreExecutionLifecycle(executionId, organizationId, options)
      },
      queryClient,
      () => [...refreshKeys(), ["rollback-targets"]],
    ),
    onSuccess: () => {
      setIsRestoreDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: executionLifecycleQueryKeys.eventsBase() })
    },
    meta: { successMessage: t("lifecycle.successRestore") },
    onError: (error) => {
      setIsRestoreDialogOpen(false)
      handleApiError(error, { fallbackMessage: t("lifecycle.errorRestore") })
    },
  })

  const runExternalPublishMutation = useMutation({
    mutationFn: async () => {
      if (!rbac.canTransition) throw new Error(NO_TRANSITION_PERMISSION)
      const stepId = lifecycleStatus?.current_step_id
      if (!executionId || !stepId || !organizationId) throw new Error("Missing execution, step or organization")
      return runExternalPublish(executionId, organizationId, stepId)
    },
    meta: { successMessage: t("lifecycle.successRerunExternalPublish") },
    onError: (error) => handleApiError(error, { fallbackMessage: t("lifecycle.errorRerunExternalPublish") }),
  })

  // Whether the current lifecycle step (edit/review) has an external system
  // configured — if so, it must run automatically and the user cannot skip it.
  const canHaveExternalReview = lifecycleStatus?.state === "draft" || lifecycleStatus?.state === "in_review"
  const { data: externalReviewActionsData } = useExternalReviewActions(
    organizationId!,
    lifecycleStatus?.current_step_id ?? "",
    isCheckDialogOpen && canHaveExternalReview && !!lifecycleStatus?.current_step_id && !!organizationId,
  )
  const hasExternalReview = (externalReviewActionsData?.data ?? []).some((a) => a.is_enabled)

  // Whether the current lifecycle step is the approval step — shows the
  // AI-generated "change summary" instead of a plain comment box.
  const isApprovalStep = lifecycleStatus?.state === "in_approval"
  const changeSummaryQuery = useQuery({
    queryKey: ["execution-change-summary", executionId],
    queryFn: () => getExecutionById(executionId!, organizationId!),
    enabled: isCheckDialogOpen && isApprovalStep && !!executionId && !!organizationId,
    refetchInterval: (query) => (query.state.data?.change_summary_status === "pending" ? 3000 : false),
  })
  const isSummaryLoading =
    isApprovalStep && (changeSummaryQuery.isLoading || changeSummaryQuery.data?.change_summary_status === "pending")

  const handleViewChanges = () => {
    const previousExecutionId = changeSummaryQuery.data?.previous_execution_id
    if (!previousExecutionId || !executionId) return
    onViewChanges?.(previousExecutionId, executionId)
  }

  return {
    status: lifecycleStatus,
    permissions: lifecyclePermissions,
    canTransition: rbac.canTransition,
    finalLifecycleStage,

    isCheckDialogOpen,
    setIsCheckDialogOpen,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    isPublishDialogOpen,
    setIsPublishDialogOpen,
    isArchiveDialogOpen,
    setIsArchiveDialogOpen,
    isRestoreDialogOpen,
    setIsRestoreDialogOpen,
    isAssignVersionDialogOpen,
    setIsAssignVersionDialogOpen,

    checkMutation,
    rejectMutation,
    advanceMutation,
    assignVersionMutation,
    restoreMutation,
    runExternalPublishMutation,

    hasExternalReview,
    isApprovalStep,
    changeSummary: changeSummaryQuery.data?.change_summary ?? null,
    changeSummaryStatus: changeSummaryQuery.data?.change_summary_status ?? null,
    changeSummaryError: changeSummaryQuery.data?.change_summary_error ?? null,
    canViewChanges: !!changeSummaryQuery.data?.previous_execution_id,
    isSummaryLoading,
    handleViewChanges,
  }
}
