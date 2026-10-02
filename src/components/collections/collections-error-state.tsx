import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { cn } from "@/lib/utils"

export interface CollectionsErrorStateProps {
  error?: unknown
  onRetry?: () => void
  /** `compact` para sheets y paneles; el default ocupa el área de la página. */
  compact?: boolean
}

// Un error de carga nunca se muestra como "vacío": con `retryOnMount: false` el único
// camino de vuelta es el reintento.
export function CollectionsErrorState({ error, onRetry, compact = false }: CollectionsErrorStateProps) {
  const { t } = useTranslation(["collections", "common"])
  const message = error instanceof Error && error.message ? error.message : t("errorState.failedToLoad")

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 text-center",
        compact ? "gap-2 p-4" : "min-h-[400px] p-8",
      )}
    >
      <p className={cn("font-medium text-red-600", !compact && "mb-2")}>{message}</p>
      <p className={cn("text-sm text-muted-foreground", !compact && "mb-4")}>{t("errorState.errorDescription")}</p>
      {onRetry && <HuemulButton onClick={onRetry} variant="outline" icon={RefreshCw} label={t("common:tryAgain")} />}
    </div>
  )
}
