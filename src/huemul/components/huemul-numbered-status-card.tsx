import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toneColor, toneDot } from "@/lib/lifecycle-colors";

// Señal de color de toda tarjeta de "sección numerada con estado". Único consumidor:
// asset-form-section-reader.tsx (solo success/warning, sin tocar). workflow-summary-section-card.tsx
// dejó de usar este componente (la vista de resumen de workflow pide un pie inset y un cuerpo sin
// borde superior, que este shell no ofrece — dibuja su propio Collapsible, ver
// workflow-summary-styles.ts para su paleta). `warning` conserva sus clases literales originales
// para que el consumidor que queda no cambie ni un pixel; el resto sale de lifecycle-colors.ts
// (fuente única de paleta) para no inventar una segunda escala de color en el repo.
type Tone = "success" | "warning" | "danger" | "info" | "muted";

const TONE_STYLES: Record<Tone, { accentClass: string; circleClass: string }> = {
  success: { accentClass: toneDot("green"), circleClass: toneColor("green") },
  warning: { accentClass: "bg-amber-400", circleClass: "bg-amber-100 text-amber-700" },
  danger: { accentClass: toneDot("red"), circleClass: toneColor("red") },
  info: { accentClass: toneDot("blue"), circleClass: toneColor("blue") },
  muted: { accentClass: toneDot("gray"), circleClass: toneColor("gray") },
};

export interface HuemulNumberedStatusCardProps {
  /** Número mostrado en el círculo, ya 1-based. Se oculta si se pasa `circleIcon`. */
  number: number;
  title: string;
  tone: Tone;
  /** Reemplaza el número dentro del círculo (ej. Check para una sección completa). */
  circleIcon?: LucideIcon;
  /** Badge u otro nodo junto al título. */
  headerExtra?: React.ReactNode;
  /** Subtítulo (ej. "3/7 respondidas"). */
  subtitle?: string;
  /** Botones a la derecha del header. */
  actions?: React.ReactNode;
  /**
   * Header clicable como CollapsibleTrigger; requiere `children` y `open`/`onOpenChange`.
   * `actions` queda fuera del trigger (no anidar <button> dentro de <button>).
   */
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  /**
   * Pie SIEMPRE visible, fuera del CollapsibleContent — se ve también con la tarjeta
   * colapsada. Pensado para "estado + acción" (ver workflow-summary-section-card.tsx).
   */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Tarjeta con círculo numerado + acento lateral de color por estado — su único consumidor hoy
 * es asset-form-section-reader.tsx, que usa la variante `collapsible`. Sin i18n interno:
 * `title`/`subtitle` llegan traducidos.
 *
 * `collapsible` + `actions` pueden convivir: el header se parte en dos CollapsibleTrigger
 * hermanos (círculo/título por un lado, chevron al final por el otro) con los `actions` en
 * el medio, para que ese chevron cierre la fila y sus botones no queden anidados dentro de
 * un <button>.
 */
export function HuemulNumberedStatusCard({
  number,
  title,
  tone,
  circleIcon: CircleIcon,
  headerExtra,
  subtitle,
  actions,
  collapsible,
  open,
  onOpenChange,
  children,
  footer,
  className,
}: HuemulNumberedStatusCardProps) {
  const styles = TONE_STYLES[tone];

  const accent = <div className={cn("absolute inset-y-0 left-0 w-1", styles.accentClass)} />;

  const circle = (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        styles.circleClass,
      )}
    >
      {CircleIcon ? <CircleIcon className="h-3.5 w-3.5" /> : number}
    </div>
  );

  const titleBlock = (
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {headerExtra}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );

  const actionsBlock = actions && <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">{actions}</div>;

  const chevron = (
    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
  );

  const footerBlock = footer && (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface-sunken px-4 py-2">
      {footer}
    </div>
  );

  if (!collapsible) {
    return (
      <Card className={cn("relative flex-col overflow-hidden p-0", className)}>
        {accent}
        <div className="flex w-full flex-row items-start gap-3 p-4">
          {circle}
          {titleBlock}
          {actionsBlock}
        </div>
        {footerBlock}
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card className={cn("relative overflow-hidden p-0", className)}>
        {accent}
        <div className="flex w-full flex-row items-start gap-3 p-4">
          <CollapsibleTrigger className="flex min-w-0 flex-1 flex-row items-start gap-3 text-left">
            {circle}
            {titleBlock}
          </CollapsibleTrigger>
          {actionsBlock}
          <CollapsibleTrigger className="group flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            {chevron}
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3">{children}</div>
        </CollapsibleContent>
        {footerBlock}
      </Card>
    </Collapsible>
  );
}
