import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { toneColor } from "@/lib/lifecycle-colors"
import type { ReviewStatus } from "@/types/section-execution"

/** Hue de `lib/lifecycle-colors.ts` por `ReviewStatus` — no declarar la clase acá, es la fuente única. */
const REVIEW_STATUS_HUE: Record<ReviewStatus, Parameters<typeof toneColor>[0]> = {
  editing: "amber",
  reviewing: "amber",
  finished: "green",
}

interface HuemulReviewStatusBadgeProps {
  status?: ReviewStatus | null
  className?: string
}

/**
 * Pill de solo lectura del review_status de una sección NO form (Editando/Revisando/
 * Finalizado). Las secciones form usan HuemulAnswersStatusBadge (answers_status).
 */
export function HuemulReviewStatusBadge({ status, className }: HuemulReviewStatusBadgeProps) {
  const { t } = useTranslation("assets")
  // Sección sin estado aún (recién creada) equivale a 'editing' — nunca queda sin badge.
  const resolvedStatus: ReviewStatus = status ?? "editing"

  const label = t(`section.reviewStatus${resolvedStatus.charAt(0).toUpperCase()}${resolvedStatus.slice(1)}`)

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneColor(REVIEW_STATUS_HUE[resolvedStatus]),
        className,
      )}
    >
      {label}
    </span>
  )
}
