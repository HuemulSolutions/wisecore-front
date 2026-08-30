import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { lifecycleStateColor } from "@/lib/lifecycle-colors"
import type { ExecutionLifecycleState } from "@/types/execution"

interface HuemulLifecycleBadgeProps {
  state: ExecutionLifecycleState
  className?: string
}

/** Pill de estado de ciclo de vida de una ejecución, con color por estado y label traducido. */
export function HuemulLifecycleBadge({ state, className }: HuemulLifecycleBadgeProps) {
  const { t } = useTranslation("assets")

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        lifecycleStateColor(state),
        className,
      )}
    >
      {t(`lifecycle.stateLabels.${state}`)}
    </span>
  )
}
