import { useTranslation } from "react-i18next"
import { Undo2, Check, Globe, Archive, RotateCcw, RefreshCw, Sparkles } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { resolveLifecycleActionsVisibility, isExternalElaborationLocked } from "@/lib/lifecycle-access"
import type { HuemulLifecycleActionsProps } from "@/types/lifecycle"

/**
 * Execution lifecycle action buttons (assign version, return, complete, publish,
 * archive, restore, re-run external publish) driven by a `useLifecycleActions`
 * controller. Two visual presets:
 * - `compact`: small outline pills, meant to sit alongside the stage badge inside
 *   a shaded box (assets' mobile header).
 * - `row` (default): plain ghost buttons for an inline row (the workflow panel bar).
 * - `header`: only the secondary actions, as 30px ghost buttons (assets' desktop
 *   header); Complete/Publish are rendered by `HuemulLifecyclePhaseBlock`.
 */
export function HuemulLifecycleActions({
  controller,
  variant = "row",
  showRerunExternalPublish = false,
  showRunElaboration = false,
  hideComplete = false,
  className,
}: HuemulLifecycleActionsProps) {
  const { t } = useTranslation(["assets", "common"])
  const { status, permissions, canTransition } = controller

  // Reglas centralizadas en lib/lifecycle-access.ts: el panel de workflow las
  // consulta antes de renderizar para decidir si su fila de ciclo de vida
  // quedaría vacía. Incluye el gate RBAC (`canTransition`, `asset:u`).
  const { canReturn, canComplete, canPublish, canArchive, canRestore, canRerunExternalPublish, canRunElaboration, hasAny } =
    resolveLifecycleActionsVisibility({
      status,
      permissions,
      canTransition,
      finalLifecycleStage: controller.finalLifecycleStage,
      isBlockedByRequiredAnswers: controller.isBlockedByRequiredAnswers,
      showRerunExternalPublish,
      hideComplete,
      showRunElaboration,
      hasEnabledElaborationConfig: controller.hasEnabledElaborationConfig,
      hasEnabledExternalPublishConfig: controller.hasEnabledExternalPublishConfig,
    })

  const isHeader = variant === "header"
  // En el header, Completar/Publicar los pinta HuemulLifecyclePhaseBlock: acá solo las secundarias.
  const showComplete = canComplete && !isHeader
  const showPublish = canPublish && !isHeader
  const hasVisible = isHeader ? canReturn || canArchive || canRestore || canRerunExternalPublish || canRunElaboration : hasAny

  if (!hasAny || !hasVisible) return null

  // El lock decide `disabled`, no visibilidad (ver resolveLifecycleActionsVisibility):
  // si apagara `canRunElaboration`, el botón desaparecería al disparar y
  // reaparecería al terminar, saltando el layout.
  const elaborationLocked = isExternalElaborationLocked(status ?? undefined)

  const isCompact = variant === "compact"
  const iconClassName = isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
  const buttonVariant = isCompact ? "outline" : "ghost"
  const sizeClass = isCompact
    ? "h-6 text-xs px-2"
    : isHeader
      ? "h-[30px] px-2.5 text-[12.5px] font-medium transition-colors"
      : "h-7 px-2.5 text-xs font-medium transition-colors"
  // Secundarias: text-slate-500, deshabilitadas en text-slate-300 (variante header).
  const secondaryClass = isHeader
    ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-100 disabled:text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/40"
    : `text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"}`

  return (
    <div className={`flex items-center ${isHeader ? "gap-0.5" : "gap-1.5"} flex-wrap ${isCompact ? "" : "shrink-0"} ${className ?? ""}`}>
      {canReturn && (
        <HuemulButton
          variant={buttonVariant}
          icon={Undo2}
          iconClassName={iconClassName}
          label={isHeader ? t("lifecycle.return") : undefined}
          className={
            isHeader
              ? `${sizeClass} ${secondaryClass} hover:cursor-pointer`
              : `${isCompact ? "h-6 w-6" : "h-7 w-7"} p-0 text-gray-600 ${isCompact ? "" : "hover:bg-gray-100 hover:text-gray-800"} hover:cursor-pointer`
          }
          loading={controller.rejectMutation.isPending}
          disabled={elaborationLocked}
          tooltip={elaborationLocked ? t("lifecycle.tooltipElaborationRunning") : t("lifecycle.tooltipReturn")}
          onClick={() => controller.setIsRejectDialogOpen(true)}
        />
      )}
      {showComplete && (
        <HuemulButton
          variant={isCompact ? "default" : "ghost"}
          size="sm"
          label={controller.completeLabel}
          icon={Check}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} ${isCompact ? "" : "bg-primary text-white hover:bg-primary/90 hover:text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"} hover:cursor-pointer`}
          loading={controller.checkMutation.isPending}
          disabled={controller.isBlockedByRequiredAnswers || elaborationLocked}
          tooltip={
            elaborationLocked
              ? t("lifecycle.tooltipElaborationRunning")
              : controller.isBlockedByRequiredAnswers
                ? controller.advanceBlockersTooltip
                : controller.completeTooltip
          }
          onClick={() => controller.setIsCheckDialogOpen(true)}
        />
      )}
      {showPublish && (
        <HuemulButton
          variant={isCompact ? "default" : "ghost"}
          size="sm"
          label={t("lifecycle.publish")}
          icon={Globe}
          iconPosition="left"
          iconClassName={iconClassName}
          // green-600 es el hue de "published" en lib/lifecycle-colors.ts — si ese hue cambia, actualizar acá también.
          className={`${sizeClass} bg-green-600 text-white hover:bg-green-700 hover:text-white ${isCompact ? "" : "rounded-md"} hover:cursor-pointer`}
          loading={controller.advanceMutation.isPending}
          disabled={elaborationLocked}
          tooltip={elaborationLocked ? t("lifecycle.tooltipElaborationRunning") : t("lifecycle.tooltipPublish")}
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
          className={`${sizeClass} ${secondaryClass} hover:cursor-pointer`}
          loading={controller.advanceMutation.isPending}
          disabled={elaborationLocked}
          tooltip={elaborationLocked ? t("lifecycle.tooltipElaborationRunning") : t("lifecycle.tooltipArchive")}
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
          className={`${sizeClass} ${secondaryClass} hover:cursor-pointer`}
          loading={controller.restoreMutation.isPending}
          disabled={elaborationLocked}
          tooltip={elaborationLocked ? t("lifecycle.tooltipElaborationRunning") : t("lifecycle.tooltipRestore")}
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
          className={`${sizeClass} ${secondaryClass} hover:cursor-pointer`}
          loading={controller.runExternalPublishMutation.isPending}
          disabled={elaborationLocked}
          tooltip={elaborationLocked ? t("lifecycle.tooltipElaborationRunning") : undefined}
          onClick={() => controller.runExternalPublishMutation.mutate()}
        />
      )}
      {canRunElaboration && (
        <HuemulButton
          variant={buttonVariant}
          size="sm"
          label={t("lifecycle.runElaboration")}
          icon={Sparkles}
          iconPosition="left"
          iconClassName={iconClassName}
          className={`${sizeClass} ${secondaryClass} hover:cursor-pointer`}
          loading={controller.runElaborationMutation.isPending}
          disabled={elaborationLocked}
          tooltip={elaborationLocked ? t("lifecycle.tooltipElaborationRunning") : t("lifecycle.tooltipRunElaboration")}
          onClick={() => controller.runElaborationMutation.mutate()}
        />
      )}
    </div>
  )
}
