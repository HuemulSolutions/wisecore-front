import { useTranslation } from "react-i18next"
import { Tag, Undo2, Check, Globe, Archive, RotateCcw, RefreshCw } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
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
  className,
}: HuemulLifecycleActionsProps) {
  const { t } = useTranslation(["assets", "common"])
  const { status, permissions } = controller

  if (!status) return null

  const isCompact = variant === "compact"
  const iconClassName = isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
  const buttonVariant = isCompact ? "outline" : "ghost"
  const sizeClass = isCompact ? "h-6 text-xs px-2" : "h-7 px-2.5 text-xs font-medium transition-colors"

  const canAssignVersion =
    permissions?.approve && (status.version_required || status.state === "in_approval") && !status.version
  const canPublish = permissions?.publish && status.state === "approved"
  const canArchive = permissions?.archive && (status.state === "approved" || status.state === "published")
  const canRestore = permissions?.archive && status.state === "archived"
  const canRerunExternalPublish = showRerunExternalPublish && permissions?.publish && status.state === "published"

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${isCompact ? "" : "shrink-0"} ${className ?? ""}`}>
      {canAssignVersion && (
        <HuemulButton
          variant={buttonVariant}
          size="sm"
          label={t("content.assignVersion")}
          icon={Tag}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} ${isCompact ? "text-[#4464f7] border-[#4464f7] hover:bg-blue-50" : "text-[#4464f7] hover:bg-blue-50 hover:text-[#3451e6]"} hover:cursor-pointer`}
          loading={controller.assignVersionMutation.isPending}
          tooltip={t("content.assignVersionTooltip")}
          onClick={() => controller.setIsAssignVersionDialogOpen(true)}
        />
      )}
      {status.can_rollback && (
        <HuemulButton
          variant={buttonVariant}
          size="sm"
          label={t("lifecycle.return")}
          icon={Undo2}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"} hover:cursor-pointer`}
          loading={controller.rejectMutation.isPending}
          tooltip={t("lifecycle.tooltipReturn")}
          onClick={() => controller.setIsRejectDialogOpen(true)}
        />
      )}
      {status.can_advance && (
        <HuemulButton
          variant={isCompact ? "default" : "ghost"}
          size="sm"
          label={t("lifecycle.complete")}
          icon={Check}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} ${isCompact ? "" : "bg-[#4464f7] text-white hover:bg-[#3451e6] hover:text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"} hover:cursor-pointer`}
          loading={controller.checkMutation.isPending}
          disabled={status.version_required && !status.version}
          tooltip={
            status.version_required && !status.version
              ? t("content.assignVersionBeforeComplete")
              : status.will_advance_phase
                ? t("lifecycle.tooltipCompletePhase")
                : t("lifecycle.tooltipComplete")
          }
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
