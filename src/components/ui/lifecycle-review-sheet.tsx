import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, CheckCircle2, GitCompare, Loader2 } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulVersionPicker } from "@/huemul/components/huemul-version-picker"
import type { HuemulVersionPickerValue } from "@/huemul/components/huemul-version-picker"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import MdxEditor from "@/components/layout/mdx-editor"
import { cn } from "@/lib/utils"
import { lifecycleStageTone, lifecycleStagePhaseBlock } from "@/lib/lifecycle-colors"
import type { LifecycleActionsController, LifecycleCurrentPhaseProgress, LifecyclePhase } from "@/types/lifecycle"

interface LifecycleReviewSheetProps {
  controller: LifecycleActionsController
  executionId: string | null | undefined
  organizationId: string | null | undefined
  existingVersions?: string[]
  /** Omitir para ocultar el link: la superficie no tiene tab de campos personalizados. */
  onGoToCustomFields?: () => void
  /** Omitir para ocultar "Ir a la sección": la superficie no puede navegar a una sección puntual. */
  onGoToSection?: (sectionExecutionId: string) => void
}

const FIELD_FOCUS = "focus-within:border-[#2563eb] focus-within:ring-[3px] focus-within:ring-[#dbeafe]"

/**
 * Stepper horizontal en columnas iguales: punto de 22px centrado y líneas de
 * 2px a cada lado (sin línea antes de la primera ni después de la última).
 */
function PhaseColumnsStepper({ phases }: { phases: LifecyclePhase[] }) {
  const { t } = useTranslation("assets")
  if (phases.length === 0) return null

  return (
    <ol className="mt-4 flex">
      {phases.map((phase, index) => {
        const tone = lifecycleStageTone(phase.key)
        const previous = phases[index - 1]
        const leftDone = previous?.state === "done"
        const rightDone = phase.state === "done"
        return (
          <li
            key={phase.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            title={`${phase.label} · ${t(`lifecycle.reviewSheet.phaseState.${phase.state}`)}`}
          >
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", index === 0 ? "bg-transparent" : leftDone ? "bg-[#16a34a]" : "bg-[#e2e8f0]")} />
              <span
                className={cn(
                  "inline-flex size-[22px] shrink-0 items-center justify-center rounded-full",
                  phase.state === "done" && "bg-[#16a34a]",
                  phase.state === "current" && cn(tone.solid, "ring-4", tone.ring),
                  phase.state === "upcoming" && "bg-[#e2e8f0]",
                )}
              >
                {phase.state === "done" && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  "h-0.5 flex-1",
                  index === phases.length - 1 ? "bg-transparent" : rightDone ? "bg-[#16a34a]" : "bg-[#e2e8f0]",
                )}
              />
            </div>
            <span
              className={cn(
                "w-full truncate px-0.5 text-center text-[11.5px] leading-tight",
                phase.state === "done" && "text-[#334155]",
                phase.state === "current" && cn("font-semibold", tone.text),
                phase.state === "upcoming" && "text-[#94a3b8]",
              )}
            >
              {phase.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function StepsCard({ currentPhase }: { currentPhase: LifecycleCurrentPhaseProgress }) {
  const { t } = useTranslation("assets")
  const tone = lifecycleStageTone(currentPhase.stage)

  return (
    <section className="rounded-xl bg-[#f8fafc] px-3.5 py-3 shadow-[inset_0_0_0_1px_#e2e8f0]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11.5px] font-semibold uppercase tracking-[.04em] text-[#64748b]">
        <span className="truncate">{t("lifecycle.reviewSheet.stepsIn", { stage: currentPhase.label })}</span>
        <span className="shrink-0">
          {t("lifecycle.reviewSheet.stepsCounter", { completed: currentPhase.completed, total: currentPhase.total })}
        </span>
      </div>
      <ul className="space-y-2">
        {currentPhase.steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2.5">
            {step.state === "done" ? (
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
                <Check className="size-2.5 text-white" strokeWidth={3} />
              </span>
            ) : step.state === "current" ? (
              <span className={cn("inline-block size-4 shrink-0 rounded-full border-[5px] bg-white", tone.border)} />
            ) : (
              <span className="inline-block size-4 shrink-0 rounded-full border-[1.5px] border-[#cbd5e1] bg-white" />
            )}
            <span className={cn("min-w-0 flex-1 truncate text-[13.5px] text-[#0f172a]", step.state === "current" && "font-semibold")} title={step.name ?? currentPhase.label}>
              {step.name ?? currentPhase.label}
            </span>
            {step.roleNames.length > 0 && (
              <span className="max-w-[45%] shrink-0 truncate text-xs text-[#64748b]" title={step.roleNames.join(", ")}>
                {step.roleNames.join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Sheet de "Completar"/"Aprobar": header con ícono de la fase + stepper en
 * columnas, tarjeta de pasos, próximo paso, avisos condicionales (409 inline,
 * campos obligatorios, versión inline en la aprobación, revisión externa),
 * comentario y footer propio. Solo presentación: la lógica vive en
 * `useLifecycleActions` (`confirmApprovalWithVersion` encadena asignar versión +
 * completar en una sola acción).
 */
export function LifecycleReviewSheet({
  controller,
  executionId,
  organizationId,
  existingVersions,
  onGoToCustomFields,
  onGoToSection,
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
    advanceBlockersError,
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
  const showVersionPicker = isApprovalStep && canAssignVersionInline
  const hasBlockersError = advanceBlockersError.length > 0
  const hasMissingFields = missingRequiredCustomFields.length > 0
  const isVersionInvalid = showVersionPicker && (!versionValue?.isValid || !!versionValue?.isFetchingSuggestion)
  const isEditorDisabled = isProcessing || (isApprovalStep && isSummaryLoading)

  const currentPhase = progress.isAvailable ? progress.currentPhase : null
  const headerTone = lifecycleStageTone(currentPhase?.stage ?? status?.stage)
  const stageLabel = (key: string) => t(`lifecycle.stageLabels.${key}`, { defaultValue: key })
  // El nombre del grupo se muestra tal cual lo define el backend, sin traducir.
  const group = status?.current_group ?? null

  const title = isApprovalStep
    ? group
      ? t("lifecycle.approveStepTitle", { step: group })
      : t("lifecycle.advanceStepTitle")
    : group
      ? t("lifecycle.completeStepTitle", { step: group })
      : t("lifecycle.advanceStepTitle")

  const confirmLabel = hasBlockersError
    ? t("lifecycle.reviewSheet.retry")
    : showVersionPicker
      ? t("lifecycle.approveAndAssign", { version: versionValue?.versionString ?? "1.0.0" })
      : isApprovalStep
        ? t("lifecycle.approveConfirm")
        : completeConfirmLabel

  const blockedReason = hasMissingFields
    ? t("lifecycle.reviewSheet.blockedByFields")
    : isVersionInvalid && versionValue && !versionValue.isFetchingSuggestion
      ? t("lifecycle.reviewSheet.blockedByVersion")
      : null

  function handleConfirm() {
    const options = { comment, run_external_review: hasExternalReview }
    if (showVersionPicker && versionValue) {
      confirmApprovalWithVersion({ major: versionValue.major, minor: versionValue.minor, patch: versionValue.patch }, options)
    } else {
      checkMutation.mutate(options)
    }
  }

  const nextStep = progress.isAvailable ? progress.nextStep : null
  const nextStageLabel = nextStep ? stageLabel(nextStep.stage) : ""
  const nextRoles = nextStep?.roleNames.join(", ") ?? ""
  const changesPhase = !!nextStep && nextStep.stage !== currentPhase?.stage
  const nextTone = lifecycleStagePhaseBlock(nextStep?.stage)
  const currentTone = lifecycleStagePhaseBlock(currentPhase?.stage ?? status?.stage)
  const currentStageLabel = currentPhase?.label ?? (status?.stage ? stageLabel(status.stage) : "")
  // El grupo se omite en los hitos sin step y cuando repite el nombre de la etapa.
  const nextGroup = nextStep?.name && nextStep.name !== nextStageLabel ? nextStep.name : null
  const nextNote = nextStep
    ? t(
        `lifecycle.reviewSheet.${changesPhase ? "nextStepNoteChange" : "nextStepNoteSame"}${nextRoles ? "_roles" : ""}`,
        { stage: changesPhase ? nextStageLabel : (currentPhase?.label ?? nextStageLabel), roles: nextRoles },
      )
    : null

  const headerContent = (
    <div className="border-b border-[#eef1f6] px-[22px] pb-4 pt-5 pr-14">
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-[34px] shrink-0 items-center justify-center rounded-full", headerTone.soft)}>
          <CheckCircle2 className="size-5" />
        </span>
        <h2 className="min-w-0 truncate text-[17px] font-[650] leading-tight text-[#0f172a]" title={title}>
          {title}
        </h2>
      </div>
      {progress.isAvailable && <PhaseColumnsStepper phases={progress.phases} />}
    </div>
  )

  const footerContent = (
    <div className="flex items-center gap-3 border-t border-[#eef1f6] bg-white px-4 py-3">
      <p className="min-w-0 flex-1 text-xs text-[#b45309]">{blockedReason}</p>
      <Button
        type="button"
        variant="ghost"
        className="h-9 text-[#475569] hover:cursor-pointer hover:bg-[#f1f5f9]"
        disabled={isProcessing}
        onClick={() => setIsCheckDialogOpen(false)}
      >
        {t("common:cancel", "Cancel")}
      </Button>
      <Button
        type="button"
        className="h-9 rounded-lg bg-[#2563eb] px-4 text-white hover:cursor-pointer hover:bg-[#1d4ed8] disabled:bg-[#e2e8f0] disabled:text-[#64748b] disabled:opacity-100"
        disabled={isProcessing || hasMissingFields || isVersionInvalid}
        onClick={handleConfirm}
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("lifecycle.reviewSheet.completing")}
          </>
        ) : (
          confirmLabel
        )}
      </Button>
    </div>
  )

  return (
    <HuemulSheet
      open={isCheckDialogOpen}
      onOpenChange={(open) => !isProcessing && setIsCheckDialogOpen(open)}
      title={title}
      maxWidth="sm:max-w-none"
      className="w-[520px] max-w-full bg-white shadow-[-20px_0_40px_-20px_rgba(15,23,42,.35)]"
      overlayClassName="bg-[rgba(15,23,42,.22)]"
      bodyClassName="flex flex-col gap-[18px] px-[22px] py-[18px]"
      headerContent={headerContent}
      footerContent={footerContent}
    >
      {currentPhase && <StepsCard currentPhase={currentPhase} />}

      {nextStep && (
        <div className={cn("relative overflow-hidden rounded-[10px] border py-3 pl-4 pr-3.5", nextTone.container)}>
          <span className={cn("absolute inset-y-0 left-0 w-[3px]", nextTone.dot)} aria-hidden="true" />
          <div className="mb-2 flex items-center gap-2">
            <span className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full", nextTone.dot)}>
              <ArrowRight className="size-3 text-white" strokeWidth={3} />
            </span>
            <p className={cn("text-[11.5px] font-semibold uppercase tracking-[.04em]", nextTone.text)}>
              {t("lifecycle.nextStepLabel")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {changesPhase && (
              <>
                <span className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border border-white bg-white/70 px-2.5 text-xs font-medium text-slate-600">
                  <span className={cn("size-1.5 shrink-0 rounded-full", currentTone.dot)} aria-hidden="true" />
                  {currentStageLabel}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              </>
            )}
            <span className="inline-flex min-w-0 items-center gap-2 text-[15px] font-[650]">
              <span className={cn("size-2 shrink-0 rounded-full", nextTone.dot)} aria-hidden="true" />
              {changesPhase || !nextGroup ? (
                <span className={nextTone.text}>{nextStageLabel}</span>
              ) : null}
              {nextGroup && (
                <>
                  {changesPhase && (
                    <span className={cn("opacity-60", nextTone.text)} aria-hidden="true">·</span>
                  )}
                  <span className={cn("truncate", changesPhase ? "font-medium text-slate-800" : nextTone.text)} title={nextGroup}>
                    {nextGroup}
                  </span>
                </>
              )}
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-slate-600">{nextNote}</p>
        </div>
      )}

      {hasBlockersError && (
        <div role="alert" className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] p-3">
          <p className="mb-2 text-[13px] font-semibold text-[#b91c1c]">{t("lifecycle.reviewSheet.blockersTitle")}</p>
          <ul className="space-y-1.5">
            {advanceBlockersError.map((blocker) => (
              <li key={blocker.section_execution_id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#0f172a]" title={blocker.section_name}>
                    {blocker.section_name}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {t("lifecycle.reviewSheet.blockersCount", { count: blocker.missing_required })}
                  </p>
                </div>
                {onGoToSection && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto shrink-0 p-0 text-xs whitespace-nowrap text-[#2563eb] hover:cursor-pointer"
                    onClick={() => onGoToSection(blocker.section_execution_id)}
                  >
                    {t("lifecycle.advanceBlockers.goToSection")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasMissingFields && (
        <div role="alert" className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] p-3">
          <p className="mb-1 text-[13px] font-semibold text-[#92400e]">{t("lifecycle.requiredCustomFields.warningTitle")}</p>
          <p className="mb-2 text-xs text-[#92400e]">{t("lifecycle.requiredCustomFields.warning")}</p>
          <ul className="mb-2 space-y-1">
            {missingRequiredCustomFields.map((name) => (
              <li key={name} className="flex items-center gap-2 text-[13px] text-[#0f172a]">
                <span className="size-1.5 shrink-0 rounded-full bg-[#d97706]" />
                {name}
              </li>
            ))}
          </ul>
          {onGoToCustomFields && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs font-semibold whitespace-nowrap text-[#b45309] hover:cursor-pointer"
              onClick={onGoToCustomFields}
            >
              {t("lifecycle.reviewSheet.completeData")}
            </Button>
          )}
        </div>
      )}

      {showVersionPicker && (
        <HuemulVersionPicker
          variant="compact"
          open={isCheckDialogOpen}
          executionId={executionId}
          organizationId={organizationId}
          existingVersions={existingVersions}
          disabled={isProcessing}
          onChange={setVersionValue}
        />
      )}

      {hasExternalReview && (
        <div className="flex items-start gap-3 rounded-[10px] border border-[#e2e8f0] p-3">
          <Checkbox checked disabled className="mt-0.5" aria-labelledby="review-external-title" />
          <div className="min-w-0">
            <p id="review-external-title" className="text-[13px] font-semibold text-[#0f172a]">
              {t("lifecycle.reviewSheet.externalReviewTitle")}
            </p>
            <p className="text-xs text-[#64748b]">{t("lifecycle.reviewSheet.externalReviewDescription")}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="review-comment" className="flex min-w-0 items-baseline gap-2 whitespace-nowrap text-[13px] font-semibold text-[#0f172a]">
            {isApprovalStep ? t("lifecycle.changeSummaryLabel") : t("lifecycle.commentLabel")}
            <span className="truncate text-xs font-normal text-[#94a3b8]">
              {isApprovalStep ? t("lifecycle.reviewSheet.changeSummaryHint") : t("lifecycle.reviewSheet.commentOptional")}
            </span>
          </label>
          {isApprovalStep && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 gap-1.5 p-0 text-[13px] whitespace-nowrap text-[#2563eb] hover:cursor-pointer"
              disabled={!canViewChanges}
              onClick={handleViewChanges}
            >
              <GitCompare className="size-3.5" />
              {t("lifecycle.viewChanges")}
            </Button>
          )}
        </div>

        {isApprovalStep ? (
          <>
            {isSummaryLoading && (
              <div className="space-y-2 py-1">
                <div className="h-3 w-full animate-pulse rounded bg-[#eef1f6]" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-[#eef1f6]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[#eef1f6]" />
                <p className="pt-1 text-xs text-[#64748b]">{t("lifecycle.reviewSheet.preparingSummary")}</p>
              </div>
            )}
            {!isSummaryLoading && changeSummaryStatus === "failed" && (
              <p role="alert" className="rounded-lg bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">
                {changeSummaryError || t("lifecycle.summaryFailed")}
              </p>
            )}
            {!isSummaryLoading && (
              <div className={cn("overflow-hidden rounded-[9px] border border-[#e2e8f0]", FIELD_FOCUS)}>
                <MdxEditor key={seeded ? "seeded" : "empty"} value={comment} onChange={setComment} />
              </div>
            )}
          </>
        ) : (
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("lifecycle.commentPlaceholder")}
            disabled={isEditorDisabled}
            rows={3}
            className="rounded-[9px] border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-[3px] focus-visible:ring-[#dbeafe]"
          />
        )}
      </div>
    </HuemulSheet>
  )
}
