import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { ReviewStatus } from "@/types/section-execution"

const REVIEW_STATUS_COLORS: Record<ReviewStatus, string> = {
  editing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  reviewing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  finished: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
}

interface HuemulReviewStatusBadgeProps {
  status?: ReviewStatus | null
  /** Secciones tipo 'form' usan labels propios (No respondido/Respondido) — el resto usa Editando/Revisando/Finalizado. */
  sectionType?: string | null
  className?: string
}

/** Pill de solo lectura del review_status de una sección, con color por estado y label traducido. */
export function HuemulReviewStatusBadge({ status, sectionType, className }: HuemulReviewStatusBadgeProps) {
  const { t } = useTranslation("assets")
  // Sección sin estado aún (recién creada) equivale a 'editing' — nunca queda sin badge.
  const resolvedStatus: ReviewStatus = status ?? "editing"

  const label =
    sectionType === "form"
      ? t(resolvedStatus === "finished" ? "section.reviewStatusFormAnswered" : "section.reviewStatusFormNotAnswered")
      : t(`section.reviewStatus${resolvedStatus.charAt(0).toUpperCase()}${resolvedStatus.slice(1)}`)

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        REVIEW_STATUS_COLORS[resolvedStatus],
        className,
      )}
    >
      {label}
    </span>
  )
}
