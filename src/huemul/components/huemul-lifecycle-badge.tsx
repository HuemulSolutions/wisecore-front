import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { ExecutionLifecycleState } from "@/types/execution"

const LIFECYCLE_STATE_COLORS: Record<ExecutionLifecycleState, string> = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  in_approval: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  published: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200",
}

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
        LIFECYCLE_STATE_COLORS[state],
        className,
      )}
    >
      {t(`lifecycle.stateLabels.${state}`)}
    </span>
  )
}
