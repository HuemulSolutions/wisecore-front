import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ApiError, handleApiError } from "@/lib/error-utils"
import { withRefresh } from "@/lib/query-utils"
import { logger } from "@/lib/logger"
import { parseMissingRequiredCustomFieldsDetail } from "@/lib/custom-field-required-utils"
import { getAdvanceBlockers, parseAdvanceBlockersDetail } from "@/lib/advance-blockers-utils"
import { completeActionLabelKey, completeActionTooltipKey } from "@/lib/lifecycle-labels"
import { useExternalReviewActions } from "@/hooks/useLifecycle"
import { useLifecycleProgress } from "@/hooks/useLifecycleProgress"
import { useMissingRequiredCustomFields } from "@/hooks/useCustomFieldDocuments"
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
import type { AdvanceBlocker } from "@/types/assets"

const VERSION_REQUIRED_CODE = "VERSION_REQUIRED_FOR_APPROVAL"
const REQUIRED_CUSTOM_FIELDS_CODE = "CUSTOM_FIELD_DOCUMENT_REQUIRED_VALUE_MISSING"
const REQUIRED_ANSWERS_CODE = "REQUIRED_ANSWERS_PENDING"

/** Defensa en profundidad: los botones ya no se renderizan sin `asset:u`. */
const NO_TRANSITION_PERMISSION = "Missing permission to transition the lifecycle"

/**
 * Controller for the execution lifecycle transitions (complete/return, publish,
 * archive, restore, assign version, re-run external publish) — shared by
 * `assets-content.tsx` and `WorkflowDetailPanel` so both consume the same
 * mutations/dialog state instead of duplicating them.
 *
 * Rendering is left to `HuemulLifecycleActions` / `HuemulLifecycleSheets`; this
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
  onAfterComplete,
  onViewChanges,
  canListCustomFields = false,
  onOpenCustomFields,
  onGoToSection,
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
  const [isRequiredCustomFieldsDialogOpen, setIsRequiredCustomFieldsDialogOpen] = useState(false)
  const [requiredCustomFieldsError, setRequiredCustomFieldsError] = useState<string[]>([])
  const [isAdvanceBlockersDialogOpen, setIsAdvanceBlockersDialogOpen] = useState(false)
  const [advanceBlockersError, setAdvanceBlockersError] = useState<AdvanceBlocker[]>([])

  // Closing the assign-version dialog (by any path — cancel, backdrop click, or
  // after a successful/failed confirm) must drop any pending retry action, or a
  // later unrelated "assign version" would wrongly re-trigger a stale complete/advance.
  const setIsAssignVersionDialogOpen = (open: boolean) => {
    if (!open) setPendingVersionAction(null)
    setIsAssignVersionDialogOpenState(open)
  }

  const refreshKeys = () => [
    ["document-content", documentId],
    ["document-section-access", documentId],
    ...(extraRefreshKeys?.() ?? []),
  ]

  // El backend valida los custom fields obligatorios al salir de `draft`
  // (y al pasar in_approval -> approved). `will_advance_phase` distingue
  // "completar este step avanza la fase" de "avanza solo el step": sin él
  // el aviso preventivo dispararía falsas alarmas en steps intermedios de
  // draft.
  const isLeavingDraft = lifecycleStatus?.state === "draft" && !!lifecycleStatus?.will_advance_phase

  const { missingFieldNames } = useMissingRequiredCustomFields({
    documentId,
    organizationId,
    enabled: isCheckDialogOpen && isLeavingDraft && canListCustomFields,
  })

  /**
   * Lista de campos para el diálogo de error: se prefiere el cálculo local
   * sobre custom_field_documents y se cae al detail (texto libre) cuando la
   * query no está disponible (sin permiso, error disparado desde `advance`
   * sin haber abierto el diálogo, cache vacío). Si ninguna de las dos da
   * nombres, devuelve false y gana el toast genérico — nunca un diálogo
   * vacío.
   */
  const handleRequiredCustomFieldsError = (error: unknown): boolean => {
    const parsed = parseMissingRequiredCustomFieldsDetail(ApiError.isApiError(error) ? error.detail : null)
    const names = missingFieldNames.length > 0 ? missingFieldNames : parsed.fieldNames
    if (names.length === 0) return false
    if (missingFieldNames.length > 0 && parsed.fieldNames.length > 0 && names.length !== parsed.fieldNames.length) {
      // Señal de que las reglas locales de "sin valor" se desalinearon del backend.
      logger.warn("[lifecycle] required custom fields mismatch", { local: names, backend: parsed.fieldNames })
    }
    setRequiredCustomFieldsError(names)
    setIsRequiredCustomFieldsDialogOpen(true)
    return true
  }

  // Bloqueos de `can_advance` por respuestas obligatorias pendientes. Se
  // prefieren los blockers ya presentes en `lifecycleStatus` (cache local,
  // sin esperar el 409) y se cae al `detail` del error como fallback — mismo
  // criterio que `handleRequiredCustomFieldsError`, pero acá ambas fuentes
  // comparten shape (AdvanceBlocker[]) porque el detail es JSON, no texto libre.
  const advanceBlockers = getAdvanceBlockers(lifecycleStatus)
  const isBlockedByRequiredAnswers = !lifecycleStatus?.can_advance && advanceBlockers.length > 0

  const handleRequiredAnswersError = (error: unknown): boolean => {
    const blockers = advanceBlockers.length > 0 ? advanceBlockers : parseAdvanceBlockersDetail(error)
    if (blockers.length === 0) return false
    setAdvanceBlockersError(blockers)
    setIsAdvanceBlockersDialogOpen(true)
    return true
  }

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
      onAfterComplete?.()
    },
    meta: { successMessage: t("lifecycle.successComplete") },
    onError: (error, variables: { comment?: string; run_external_review?: boolean } | undefined) => {
      setIsCheckDialogOpen(false)
      handleApiError(error, {
        fallbackMessage: t("lifecycle.errorComplete"),
        onErrorCode: (code) => {
          if (code === REQUIRED_ANSWERS_CODE) return handleRequiredAnswersError(error)
          if (code === REQUIRED_CUSTOM_FIELDS_CODE) return handleRequiredCustomFieldsError(error)
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
          if (code === REQUIRED_ANSWERS_CODE) return handleRequiredAnswersError(error)
          if (code === REQUIRED_CUSTOM_FIELDS_CODE) return handleRequiredCustomFieldsError(error)
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

  // Única fuente para decidir si el sheet de aprobación embebe el selector de
  // versión inline (en vez de bloquear el botón que lo abre, como antes).
  const canAssignVersionInline =
    !!lifecyclePermissions?.approve &&
    (!!lifecycleStatus?.version_required || lifecycleStatus?.state === "in_approval") &&
    !lifecycleStatus?.version

  /**
   * Confirma la aprobación asignando la versión en el mismo paso (selector
   * inline del sheet de aprobación). Reusa el encadenamiento que ya existe
   * para el flujo reactivo (`VERSION_REQUIRED_FOR_APPROVAL`,
   * `assignVersionMutation.onSuccess` arriba): deja pendiente un "complete" y
   * dispara `assignVersionMutation` — al resolver, esa misma `onSuccess`
   * dispara `checkMutation` con las opciones (comentario) originales.
   */
  const confirmApprovalWithVersion = (
    version: { major: number; minor: number; patch: number },
    options?: { comment?: string; run_external_review?: boolean },
  ) => {
    setPendingVersionAction({ kind: "complete", options })
    assignVersionMutation.mutate(version)
  }

  const anySheetOpen =
    isCheckDialogOpen || isRejectDialogOpen || isPublishDialogOpen || isArchiveDialogOpen || isRestoreDialogOpen

  // Progreso visual (stepper de fases + panel "N de M" + próximo paso) para
  // las 4 sheets que lo muestran, y ahora también el label del botón
  // "Completar" (necesita `progress.nextStep.stage` para saber a qué fase
  // avanza). Por eso `enabled` (que trae `phases`/`nextStep`) se separa de
  // `includeCompletion` (que trae el panel "N de M"): el label debe estar
  // disponible con solo `can_advance`, sin esperar a que se abra un sheet.
  // Best-effort: si el GET de steps falla por permisos, `progress.isAvailable`
  // es `false` y tanto las sheets como el label degradan sin avisar (ver
  // `useLifecycleProgress`).
  const progress = useLifecycleProgress({
    documentTypeId,
    executionId,
    organizationId,
    lifecycleStatus,
    finalLifecycleStage,
    enabled: anySheetOpen || !!lifecycleStatus?.can_advance || isBlockedByRequiredAnswers,
    includeCompletion: anySheetOpen,
  })

  const nextStage = progress.nextStep?.stage ?? null
  const stageLabel = (stage: string) => t(`lifecycle.stageLabels.${stage}`, { defaultValue: stage })

  const completeLabel = t(completeActionLabelKey(lifecycleStatus, nextStage))
  const completeConfirmLabel = completeLabel
  const tooltipInfo = completeActionTooltipKey(lifecycleStatus, nextStage)
  const completeTooltip = t(
    tooltipInfo.key,
    tooltipInfo.params
      ? {
          ...tooltipInfo.params,
          ...(tooltipInfo.params.stage ? { stage: stageLabel(tooltipInfo.params.stage) } : {}),
          ...(tooltipInfo.params.next ? { next: stageLabel(tooltipInfo.params.next) } : {}),
        }
      : undefined,
  )

  // Tooltip del botón deshabilitado por `isBlockedByRequiredAnswers`: nombra la
  // sección cuando es una sola, o la cantidad de secciones cuando son varias.
  const advanceBlockersTooltip =
    advanceBlockers.length === 1
      ? t("lifecycle.advanceBlockers.tooltipSection", {
          count: advanceBlockers[0].missing_required,
          section: advanceBlockers[0].section_name,
        })
      : advanceBlockers.length > 1
        ? t("lifecycle.advanceBlockers.tooltipMultiple", { count: advanceBlockers.length })
        : ""

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
    isRequiredCustomFieldsDialogOpen,
    setIsRequiredCustomFieldsDialogOpen,
    isAdvanceBlockersDialogOpen,
    setIsAdvanceBlockersDialogOpen,

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

    missingRequiredCustomFields: isLeavingDraft ? missingFieldNames : [],
    requiredCustomFieldsError,
    onOpenCustomFields,
    progress,

    advanceBlockers,
    isBlockedByRequiredAnswers,
    advanceBlockersTooltip,
    advanceBlockersError,
    onGoToSection,

    completeLabel,
    completeTooltip,
    completeConfirmLabel,

    canAssignVersionInline,
    confirmApprovalWithVersion,
  }
}
