import { Construction } from "lucide-react"
import { useTranslation } from "react-i18next"

/** Empty state para los desgloses que todavía no tienen endpoint en el backend. */
export function TokenUsagePlaceholderTab() {
  const { t } = useTranslation("token-usage")

  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-14 text-center px-6">
      <Construction className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{t("comingSoon.title")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("comingSoon.description")}</p>
    </div>
  )
}
