import { useTranslation } from "react-i18next"
import { lifecycleStageColor, toneColor } from "@/lib/lifecycle-colors"
import type { HuemulLifecycleStageBadgeProps } from "@/types/lifecycle"

/** Stage pill + current-group chip for a document's lifecycle status. Color centralizado en `lib/lifecycle-colors.ts`. */
export function HuemulLifecycleStageBadge({ status, className }: HuemulLifecycleStageBadgeProps) {
  const { t } = useTranslation("assets")

  if (!status) return null

  const stageLabel = t(`lifecycle.stageLabels.${status.stage}`, { defaultValue: status.stage })

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ""}`}>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lifecycleStageColor(status.stage)}`}>
        {stageLabel}
      </span>
      {status.current_group && (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${toneColor("gray")}`}>
          {status.current_group}
        </span>
      )}
    </div>
  )
}
