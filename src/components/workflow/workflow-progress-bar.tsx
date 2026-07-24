import { cn } from "@/lib/utils"

interface WorkflowProgressBarProps {
  percentage: number
  className?: string
}

/** Barra de progreso simple (0-100%) para la columna "progress" de la tabla de workflow. */
export function WorkflowProgressBar({ percentage, className }: WorkflowProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  )
}
