import { useTranslation } from "react-i18next"
import { lifecycleStageColor, lifecycleStageDot } from "@/lib/lifecycle-colors"
import type { HuemulLifecycleStageBadgeProps } from "@/types/lifecycle"

/** Stage + current-group en un único pill para el lifecycle status. Color centralizado en `lib/lifecycle-colors.ts`. */
export function HuemulLifecycleStageBadge({ status, className }: HuemulLifecycleStageBadgeProps) {
  const { t } = useTranslation("assets")

  if (!status) return null

  const stageLabel = t(`lifecycle.stageLabels.${status.stage}`, { defaultValue: status.stage })
  const label = status.current_group ? `${stageLabel} · ${status.current_group}` : stageLabel

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${lifecycleStageColor(status.stage)} ${className ?? ""}`}
      title={label}
      aria-label={label}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${lifecycleStageDot(status.stage)}`} aria-hidden="true" />
      {label}
    </span>
  )
}
