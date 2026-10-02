import { AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HuemulLoadErrorProps {
  /** Reintenta la carga (normalmente `refetch`). */
  onRetry: () => void
  /** Deshabilita el botón mientras se reintenta. */
  isRetrying?: boolean
  title?: string
  description?: string
  className?: string
}

/**
 * Bloque de error de carga para el cuerpo de un sheet/panel que consume datos del
 * backend: distingue el error del estado vacío y ofrece "Reintentar". Ver
 * ia context/sheet-instant-open-skeleton-guide.md §6 (excepción: error en el propio panel).
 */
export function HuemulLoadError({ onRetry, isRetrying = false, title, description, className }: HuemulLoadErrorProps) {
  const { t } = useTranslation("common")

  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title ?? t("loadErrorTitle")}</p>
        <p className="text-xs text-muted-foreground">{description ?? t("loadErrorText")}</p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={isRetrying} className="hover:cursor-pointer" onClick={onRetry}>
        {t("tryAgain")}
      </Button>
    </div>
  )
}
