import { useTranslation } from "react-i18next"
import { Undo2, Check, Globe, Archive, RotateCcw, RefreshCw } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { isRestorableLifecycleState } from "@/lib/lifecycle-access"
import type { HuemulLifecycleActionsProps } from "@/types/lifecycle"

/**
 * Execution lifecycle action buttons (assign version, return, complete, publish,
 * archive, restore, re-run external publish) driven by a `useLifecycleActions`
 * controller. Two visual presets:
 * - `compact`: small outline pills, meant to sit alongside the stage badge inside
 *   a shaded box (assets' mobile header).
 * - `row` (default): plain ghost buttons for an inline row (assets' desktop
 *   metadata row, the workflow panel bar).
 */
export function HuemulLifecycleActions({
  controller,
  variant = "row",
  showRerunExternalPublish = false,
  hideComplete = false,
  className,
}: HuemulLifecycleActionsProps) {
  const { t } = useTranslation(["assets", "common"])
  const { status, permissions, canTransition } = controller

  if (!status) return null
  // Cruce lifecycle × RBAC: sin `asset:u` ninguna transición se ofrece, aunque
  // el grant del documento (o `status.can_advance`, que viene del backend y no
  // del objeto de permisos) diga que sí. Ver ia context/rbac-audit-guide.md.
  if (!canTransition) return null

  const isCompact = variant === "compact"
  const iconClassName = isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
  const buttonVariant = isCompact ? "outline" : "ghost"
  const sizeClass = isCompact ? "h-6 text-xs px-2" : "h-7 px-2.5 text-xs font-medium transition-colors"

  // Con etapa final distinta de "publish" (campo `final_lifecycle_stage` del
  // tipo de activo) el documento nunca llega a publicarse: al aprobar, la
  // ejecución se archiva directo.
  const canPublish =
    permissions?.publish && status.state === "approved" && controller.finalLifecycleStage === "publish"
  const canArchive = permissions?.archive && (status.state === "approved" || status.state === "published")
  const canRestore = permissions?.archive && isRestorableLifecycleState(status.state)
  const canRerunExternalPublish = showRerunExternalPublish && permissions?.publish && status.state === "published"

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${isCompact ? "" : "shrink-0"} ${className ?? ""}`}>
      {status.can_rollback && (
        <HuemulButton
          variant={buttonVariant}
          icon={Undo2}
          iconClassName={iconClassName}
          className={`${isCompact ? "h-6 w-6" : "h-7 w-7"} p-0 text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"} hover:cursor-pointer`}
          loading={controller.rejectMutation.isPending}
          tooltip={t("lifecycle.tooltipReturn")}
          onClick={() => controller.setIsRejectDialogOpen(true)}
        />
      )}
      {(status.can_advance || controller.isBlockedByRequiredAnswers) && !hideComplete && (
        <HuemulButton
          variant={isCompact ? "default" : "ghost"}
          size="sm"
          label={controller.completeLabel}
          icon={Check}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} ${isCompact ? "" : "bg-[#4464f7] text-white hover:bg-[#3451e6] hover:text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"} hover:cursor-pointer`}
          loading={controller.checkMutation.isPending}
          disabled={controller.isBlockedByRequiredAnswers}
          tooltip={controller.isBlockedByRequiredAnswers ? controller.advanceBlockersTooltip : controller.completeTooltip}
          onClick={() => controller.setIsCheckDialogOpen(true)}
        />
      )}
      {canPublish && (
        <HuemulButton
          variant={isCompact ? "default" : "ghost"}
          size="sm"
          label={t("lifecycle.publish")}
          icon={Globe}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} bg-green-600 text-white hover:bg-green-700 ${isCompact ? "" : "rounded-md"} hover:cursor-pointer`}
          loading={controller.advanceMutation.isPending}
          tooltip={t("lifecycle.tooltipPublish")}
          onClick={() => controller.setIsPublishDialogOpen(true)}
        />
      )}
      {canArchive && (
        <HuemulButton
          variant={buttonVariant}
          size="sm"
          label={t("lifecycle.archive")}
          icon={Archive}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"} hover:cursor-pointer`}
          loading={controller.advanceMutation.isPending}
          tooltip={t("lifecycle.tooltipArchive")}
          onClick={() => controller.setIsArchiveDialogOpen(true)}
        />
      )}
      {canRestore && (
        <HuemulButton
          variant={buttonVariant}
          size="sm"
          label={t("lifecycle.restore")}
          icon={RotateCcw}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"} hover:cursor-pointer`}
          loading={controller.restoreMutation.isPending}
          tooltip={t("lifecycle.tooltipRestore")}
          onClick={() => controller.setIsRestoreDialogOpen(true)}
        />
      )}
      {canRerunExternalPublish && (
        <HuemulButton
          variant={buttonVariant}
          size="sm"
          label={t("lifecycle.rerunExternalPublish")}
          icon={RefreshCw}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"} hover:cursor-pointer`}
          loading={controller.runExternalPublishMutation.isPending}
          onClick={() => controller.runExternalPublishMutation.mutate()}
        />
      )}
    </div>
  )
}
