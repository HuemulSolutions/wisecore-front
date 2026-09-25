import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { HuemulPanelEmptyStateProps } from "@/types/huemul"
export type { HuemulPanelEmptyStateProps } from "@/types/huemul"

/**
 * Estado vacío estándar para un tab de un panel de detalle: caja de borde punteado,
 * ícono, título, frase explicativa, CTA azul primario y línea gris de ayuda secundaria.
 *
 * Usado por los cuatro tabs de `AssetsDetailPanel` (Índice/Campos/Archivos/Vínculos) — ver
 * ia context/list-detail-panel-guide.md. El CTA se omite cuando el usuario no tiene permiso
 * de crear en esa sección.
 */
export function HuemulPanelEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  hint,
  className,
}: HuemulPanelEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center",
        className,
      )}
      style={{ borderColor: "var(--adp-border, var(--border))" }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--adp-accent-bg, var(--accent))" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--adp-accent-fg, var(--primary))" }} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button
              size="sm"
              onClick={action.onClick}
              className="hover:cursor-pointer"
              style={{ backgroundColor: "var(--adp-accent-fg, var(--primary))" }}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={secondaryAction.onClick}
              className="hover:cursor-pointer"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
