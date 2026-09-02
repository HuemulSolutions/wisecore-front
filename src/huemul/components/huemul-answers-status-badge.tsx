import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { toneColor } from "@/lib/lifecycle-colors"
import type { SectionAnswersStatus } from "@/types/section-execution"

/** Hue de `lib/lifecycle-colors.ts` por `SectionAnswersStatus` — no declarar la clase acá, es la fuente única. */
const ANSWERS_STATUS_HUE: Record<SectionAnswersStatus, Parameters<typeof toneColor>[0]> = {
  pending: "amber",
  completed: "green",
}

interface HuemulAnswersStatusBadgeProps {
  status?: SectionAnswersStatus | null
  className?: string
}

/**
 * Pill de solo lectura de la completitud de obligatorios de una sección form —
 * lee `ContentSection.answers_status` (GET /documents/{id}/content), calculado
 * por el backend. Reemplaza a HuemulReviewStatusBadge para secciones form: ver
 * "ia context" del cambio que introdujo answers_status.
 */
export function HuemulAnswersStatusBadge({ status, className }: HuemulAnswersStatusBadgeProps) {
  const { t } = useTranslation("assets")
  // Sin valor aún (caché desactualizada, respuesta vieja de /content) equivale a
  // 'pending' — nunca queda sin badge.
  const resolvedStatus: SectionAnswersStatus = status ?? "pending"

  const label = t(resolvedStatus === "completed" ? "section.answersStatusCompleted" : "section.answersStatusPending")

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneColor(ANSWERS_STATUS_HUE[resolvedStatus]),
        className,
      )}
    >
      {label}
    </span>
  )
}
