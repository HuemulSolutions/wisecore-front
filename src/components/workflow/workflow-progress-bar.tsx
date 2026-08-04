import { cn } from "@/lib/utils"

interface WorkflowProgressBarProps {
  percentage: number
  className?: string
  /** Clases del track (ancho/alto). Default: "h-1.5 w-16" — pasar "w-full" para ocuparlo todo. */
  trackClassName?: string
  /** Muestra el "NN%" a la derecha. Default: true. */
  showLabel?: boolean
}

/** Barra de progreso simple (0-100%). Usada en la columna "progress" de la tabla de workflow
 *  y en el resumen de secciones (workflow-sections-summary.tsx), ahí full-width y sin label. */
export function WorkflowProgressBar({
  percentage,
  className,
  trackClassName,
  showLabel = true,
}: WorkflowProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-1.5 w-16 rounded-full bg-muted overflow-hidden", trackClassName)}>
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>}
    </div>
  )
}
