import { cn } from "@/lib/utils"

interface WorkflowProgressBarProps {
  percentage: number
  className?: string
  /** Clases del track (ancho/alto). Default: "h-1.5 w-16" — pasar "w-full" para ocuparlo todo. */
  trackClassName?: string
  /** Clases del relleno. Default: "bg-primary" — pasar un hex literal para superficies con paleta propia. */
  fillClassName?: string
  /** Muestra el "NN%" a la derecha. Default: true. */
  showLabel?: boolean
}

/** Barra de progreso simple (0-100%). Usada en la columna "progress" de la tabla de workflow
 *  y en el header del panel de detalle (workflow-panel-header.tsx), ahí full-width y sin label. */
export function WorkflowProgressBar({
  percentage,
  className,
  trackClassName,
  fillClassName,
  showLabel = true,
}: WorkflowProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-2 w-16 rounded-full bg-foreground/10 overflow-hidden", trackClassName)}>
        <div
          className={cn("h-full rounded-full bg-primary transition-all", fillClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>}
    </div>
  )
}
