import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useRootElevation } from "@/hooks/useRootElevation"

interface HeaderAdminModeBadgeProps {
  /** Pista `is_root_admin` del token: sin ella no se muestra nunca. */
  isRootAdmin: boolean
}

/**
 * Indicador del modo administrador en el header (docs/sso-frontend.md §2.1): se ve
 * mientras hay un token de elevación vigente, muestra los minutos que quedan, desaparece
 * solo al vencer y al hacer clic sale del modo. El tooltip es el `title` nativo
 * (ia context/tooltip-guide.md).
 */
export function HeaderAdminModeBadge({ isRootAdmin }: HeaderAdminModeBadgeProps) {
  const { t } = useTranslation("layout")
  const { isElevated, remainingMinutes, exit } = useRootElevation()

  if (!isRootAdmin || !isElevated) return null

  return (
    <button
      type="button"
      onClick={exit}
      title={t("header.adminMode.badgeTitle", { minutes: remainingMinutes })}
      className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 hover:cursor-pointer transition-colors"
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="whitespace-nowrap">{t("header.adminMode.badge", { minutes: remainingMinutes })}</span>
    </button>
  )
}
