import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export interface HuemulMetricCardProps {
  /** Etiqueta corta (sentence case, sin dos puntos). */
  label: string
  /** Valor ya formateado (p. ej. "4.2M", "$38.40") — este componente no formatea. */
  value: string
  subtitle?: string
  icon?: LucideIcon
  loading?: boolean
  className?: string
}

/**
 * `HuemulMetricCard` — tarjeta de KPI de solo lectura (label + valor grande +
 * subtítulo opcional). A diferencia de `HuemulStatCard`, no es un toggle de
 * filtro: no hay `onClick`/`active`, y admite subtítulo y valores no numéricos.
 *
 * @example
 * ```tsx
 * <HuemulMetricCard label={t('metrics.tokens')} value={formatTokens(total)} subtitle={period} />
 * ```
 */
export function HuemulMetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  loading = false,
  className,
}: HuemulMetricCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 rounded-xl border bg-card px-4 py-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <span className="text-2xl font-bold leading-none text-foreground tabular-nums">{value}</span>
      )}
      {subtitle && !loading && (
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  )
}
