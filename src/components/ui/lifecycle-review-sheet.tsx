import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Zap, GitCompare, Loader2, AlertCircle } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulLifecycleProgressHeader } from "@/huemul/components/huemul-lifecycle-progress-header"
import { HuemulVersionPicker } from "@/huemul/components/huemul-version-picker"
import type { HuemulVersionPickerValue } from "@/huemul/components/huemul-version-picker"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import MdxEditor from "@/components/layout/mdx-editor"
import type { LifecycleActionsController } from "@/types/lifecycle"

interface LifecycleReviewSheetProps {
  controller: LifecycleActionsController
  executionId: string | null | undefined
  organizationId: string | null | undefined
  existingVersions?: string[]
  /** Omitir para ocultar el link: la superficie no tiene tab de campos personalizados. */
  onGoToCustomFields?: () => void
}

/**
 * Sheet de "Completar"/"Registrar aprobación": header contextual (nombra el
 * step actual), stepper de fases + panel de progreso + próximo paso
 * (`controller.progress`, best-effort), y en la aprobación cuando corresponde,
 * el selector de versión inline (`confirmApprovalWithVersion` encadena
 * asignar versión + completar en una sola acción).
 */
export function LifecycleReviewSheet({
  controller,
  executionId,
  organizationId,
  existingVersions,
  onGoToCustomFields,
}: LifecycleReviewSheetProps) {
  const { t } = useTranslation(["assets", "common"])
  const {
    status,
    isApprovalStep,
    changeSummary,
    changeSummaryStatus,
    changeSummaryError,
    canViewChanges,
    isSummaryLoading,
    handleViewChanges,
    missingRequiredCustomFields,
    progress,
    hasExternalReview,
    checkMutation,
    isCheckDialogOpen,
    setIsCheckDialogOpen,
    canAssignVersionInline,
    confirmApprovalWithVersion,
    assignVersionMutation,
    completeConfirmLabel,
  } = controller

  const [comment, setComment] = useState("")
  const [seeded, setSeeded] = useState(false)
  const [versionValue, setVersionValue] = useState<HuemulVersionPickerValue | null>(null)

  useEffect(() => {
    if (!isCheckDialogOpen) {
      setComment("")
      setSeeded(false)
      setVersionValue(null)
    }
  }, [isCheckDialogOpen])

  // Seed the editor once the change summary has finished loading.
  // `seeded` flips in the same batch as `setComment`, so remounting the
  // MdxEditor (uncontrolled) on `seeded` picks up the populated value.
  useEffect(() => {
    if (isCheckDialogOpen && isApprovalStep && !isSummaryLoading && changeSummary && !seeded) {
      setComment(changeSummary)
      setSeeded(true)
    }
  }, [isCheckDialogOpen, isApprovalStep, isSummaryLoading, changeSummary, seeded])

  const isProcessing = checkMutation.isPending || assignVersionMutation.isPending
  const isEditorDisabled = isProcessing || (isApprovalStep && isSummaryLoading)
  const showVersionPicker = isApprovalStep && canAssignVersionInline

  const group = status?.current_group ?? null
  const stage = status?.stage ?? null
  const stageLabel = (key: string) => t(`lifecycle.stageLabels.${key}`, { defaultValue: key })

  let title: string
  let description: string
  if (isApprovalStep) {
    title = group ? t("lifecycle.approveStepTitle", { step: group }) : t("lifecycle.advanceStepTitle")
    description =
      showVersionPicker || status?.will_advance_phase
        ? t("lifecycle.approveLastDescription")
        : group
          ? t("lifecycle.approveStepDescription", { step: group })
          : t("lifecycle.advanceStepDescription")
  } else {
    title = group ? t("lifecycle.completeStepTitle", { step: group }) : t("lifecycle.advanceStepTitle")
    if (status?.will_advance_phase) {
      description = progress.nextStep
        ? t("lifecycle.completeAndAdvanceDescription", { step: group, stage: stageLabel(progress.nextStep.stage) })
        : t("lifecycle.advanceStateDescription")
    } else {
      description =
        group && stage
          ? t("lifecycle.completeStepDescription", { step: group, stage: stageLabel(stage) })
          : t("lifecycle.advanceStepDescription")
    }
  }

  const confirmLabel = showVersionPicker
    ? t("lifecycle.approveAndAssign", { version: versionValue?.versionString ?? "1.0.0" })
    : isApprovalStep
      ? t("lifecycle.approveConfirm")
      : completeConfirmLabel

  function handleConfirm() {
    const options = { comment, run_external_review: hasExternalReview }
    if (showVersionPicker && versionValue) {
      confirmApprovalWithVersion({ major: versionValue.major, minor: versionValue.minor, patch: versionValue.patch }, options)
    } else {
      checkMutation.mutate(options)
    }
  }

  return (
    <HuemulSheet
      open={isCheckDialogOpen}
      onOpenChange={(open) => !isProcessing && setIsCheckDialogOpen(open)}
      title={title}
      description={description}
      icon={CheckCircle2}
      iconVariant="tile"
      maxWidth="sm:max-w-xl"
      cancelLabel={t("common:cancel", "Cancel")}
      saveAction={{
        label: confirmLabel,
        onClick: handleConfirm,
        loading: isProcessing,
        disabled: showVersionPicker ? !versionValue?.isValid || versionValue?.isFetchingSuggestion : false,
      }}
    >
      <div className="space-y-4">
        <HuemulLifecycleProgressHeader
          progress={progress}
          showStepProgress
          next={
            progress.nextStep
              ? {
                  label: t("lifecycle.nextStepLabel"),
                  value: progress.nextStep.name ?? stageLabel(progress.nextStep.stage),
                  stage: progress.nextStep.stage,
                }
              : null
          }
        />
        {missingRequiredCustomFields.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{t("lifecycle.requiredCustomFields.warningTitle")}</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              <span>{t("lifecycle.requiredCustomFields.warning")}</span>
              <ul className="list-disc pl-5">
                {missingRequiredCustomFields.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              {onGoToCustomFields && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 hover:cursor-pointer"
                  onClick={onGoToCustomFields}
                >
                  {t("lifecycle.requiredCustomFields.goToFields")}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {showVersionPicker && (
          <HuemulVersionPicker
            open={isCheckDialogOpen}
            executionId={executionId}
            organizationId={organizationId}
            existingVersions={existingVersions}
            disabled={isProcessing}
            onChange={setVersionValue}
          />
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="review-comment">
              {isApprovalStep ? t("lifecycle.changeSummaryLabel") : t("lifecycle.commentLabel")}
            </Label>
            {isApprovalStep && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 hover:cursor-pointer"
                disabled={!canViewChanges}
                onClick={handleViewChanges}
              >
                <GitCompare className="h-3.5 w-3.5" />
                {t("lifecycle.viewChanges")}
              </Button>
            )}
          </div>

          {isApprovalStep ? (
            <>
              {isSummaryLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("lifecycle.generatingSummary")}
                </div>
              )}
              {!isSummaryLoading && changeSummaryStatus === "failed" && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription>{changeSummaryError || t("lifecycle.summaryFailed")}</AlertDescription>
                </Alert>
              )}
              {!isSummaryLoading && <MdxEditor key={seeded ? "seeded" : "empty"} value={comment} onChange={setComment} />}
            </>
          ) : (
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("lifecycle.commentPlaceholder")}
              disabled={isEditorDisabled}
              rows={3}
            />
          )}
        </div>
        {hasExternalReview && (
          <Alert>
            <Zap />
            <AlertDescription>{t("lifecycle.externalReviewWillRun")}</AlertDescription>
          </Alert>
        )}
      </div>
    </HuemulSheet>
  )
}
