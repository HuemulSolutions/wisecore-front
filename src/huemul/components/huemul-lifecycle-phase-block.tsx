import { useTranslation } from "react-i18next"
import { ArrowUp, Check, Lock } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { cn } from "@/lib/utils"
import { resolveLifecycleActionsVisibility, isExternalElaborationLocked } from "@/lib/lifecycle-access"
import { lifecycleStagePhaseBlock } from "@/lib/lifecycle-colors"
import type { HuemulLifecyclePhaseBlockProps } from "@/types/lifecycle"

const PRIMARY_BASE = "h-8 rounded-lg pl-3 pr-3.5 text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-blue-500/40"
const PRIMARY_ENABLED =
  "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-[0_1px_2px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]"
const PRIMARY_BLOCKED =
  "bg-white text-slate-400 hover:bg-white hover:text-slate-400 ring-1 ring-inset ring-slate-200 disabled:opacity-100"

/**
 * Bloque "grupo · fase" del header de assets con la acción principal pegada a la
 * derecha (Completar / Publicar). Las reglas de visibilidad y bloqueo son las de
 * `HuemulLifecycleActions` (`resolveLifecycleActionsVisibility`): este componente
 * solo cambia la presentación. El `title` con los bloqueadores existe únicamente
 * mientras el botón está deshabilitado.
 */
export function HuemulLifecyclePhaseBlock({ controller, className }: HuemulLifecyclePhaseBlockProps) {
  const { t } = useTranslation(["assets", "common"])
  const { status, permissions, canTransition } = controller

  const { canComplete, canPublish } = resolveLifecycleActionsVisibility({
    status,
    permissions,
    canTransition,
    finalLifecycleStage: controller.finalLifecycleStage,
    isBlockedByRequiredAnswers: controller.isBlockedByRequiredAnswers,
    hasEnabledElaborationConfig: controller.hasEnabledElaborationConfig,
    hasEnabledExternalPublishConfig: controller.hasEnabledExternalPublishConfig,
  })

  if (!status) return null

  const tone = lifecycleStagePhaseBlock(status.stage)
  const stageLabel = t(`lifecycle.stageLabels.${status.stage}`, { defaultValue: status.stage })
  const groupLabel = status.current_group || stageLabel
  const elaborationLocked = isExternalElaborationLocked(status)

  // Publicar tiene prioridad visual sobre Completar cuando ambos aplicaran (no ocurre hoy: Publicar es solo en `approved`).
  const showPublish = canPublish
  const showComplete = canComplete && !canPublish
  const hasPrimary = showPublish || showComplete

  const isBlocked = showComplete && controller.isBlockedByRequiredAnswers
  const isDisabled = elaborationLocked || isBlocked

  const blockedReason = elaborationLocked
    ? t("lifecycle.tooltipElaborationRunning")
    : [
        t("lifecycle.advanceBlockers.blockedTitle"),
        ...controller.advanceBlockers.map((blocker) =>
          t("lifecycle.advanceBlockers.sectionItem", {
            count: blocker.missing_required,
            section: blocker.section_name,
          }),
        ),
      ].join("\n")

  return (
    <div
      className={cn("flex h-8 items-stretch overflow-hidden rounded-lg border", tone.container, className)}
      data-testid="lifecycle-phase-block"
    >
      <div className="flex items-center gap-1.5 px-2.5 text-[13px]">
        <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", tone.dot)} aria-hidden="true" />
        <span className={cn("font-[650]", tone.text)}>{stageLabel}</span>
        {status.current_group && (
          <>
            <span className={cn("opacity-60", tone.text)} aria-hidden="true">·</span>
            <span className="font-medium text-slate-800">{groupLabel}</span>
          </>
        )}
      </div>
      {hasPrimary && (
        <>
          <span className={cn("my-1 w-px shrink-0", tone.divider)} aria-hidden="true" />
          {showPublish ? (
            <HuemulButton
              variant="ghost"
              label={t("lifecycle.publish")}
              icon={ArrowUp}
              iconClassName="h-3.5 w-3.5"
              className={cn(PRIMARY_BASE, "rounded-l-none", isDisabled ? PRIMARY_BLOCKED : PRIMARY_ENABLED)}
              loading={controller.advanceMutation.isPending}
              disabled={isDisabled}
              tooltip={isDisabled ? blockedReason : undefined}
              onClick={() => controller.setIsPublishDialogOpen(true)}
            />
          ) : (
            <HuemulButton
              variant="ghost"
              label={controller.completeLabel}
              icon={isDisabled ? Lock : Check}
              iconClassName="h-3.5 w-3.5"
              className={cn(PRIMARY_BASE, "rounded-l-none", isDisabled ? PRIMARY_BLOCKED : PRIMARY_ENABLED)}
              loading={controller.checkMutation.isPending}
              disabled={isDisabled}
              tooltip={isDisabled ? blockedReason : undefined}
              onClick={() => controller.setIsCheckDialogOpen(true)}
            />
          )}
        </>
      )}
    </div>
  )
}
