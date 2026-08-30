import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { executionStatusColor } from "@/lib/lifecycle-colors"

interface HuemulExecutionStatusBadgeProps {
  /** `ExecutionStatus` del backend (pending/queued/running/completed/failed/…). */
  status: string
  className?: string
}

/**
 * Pill de estado de ejecución, con color y label centralizados
 * (`lib/lifecycle-colors.ts` / `common.executionStatus.*`). Reemplaza los
 * `StatusBadge` locales que existían por sheet (assets-info-sheet,
 * assets-version-management-sheet, execution-info-sheet), cada uno con su
 * propia paleta y, en un caso, labels en inglés hardcodeados.
 */
export function HuemulExecutionStatusBadge({ status, className }: HuemulExecutionStatusBadgeProps) {
  const { t } = useTranslation("common")

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        executionStatusColor(status),
        className,
      )}
    >
      {t(`executionStatus.${status}`, { defaultValue: status })}
    </span>
  )
}
