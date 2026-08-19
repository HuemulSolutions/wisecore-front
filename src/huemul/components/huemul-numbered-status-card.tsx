import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Misma señal de color en toda tarjeta de "sección numerada con estado" (ver
// workflow-sections-summary.tsx / asset-form-section-reader.tsx): éxito = respondida/finalizada,
// advertencia = pendiente. No agregar un tercer tono sin revisar ambos consumidores.
const TONE_STYLES = {
  success: { accentClass: "bg-emerald-500", circleClass: "bg-emerald-100 text-emerald-700" },
  warning: { accentClass: "bg-amber-400", circleClass: "bg-amber-100 text-amber-700" },
} as const;

export interface HuemulNumberedStatusCardProps {
  /** Número mostrado en el círculo, ya 1-based. */
  number: number;
  title: string;
  tone: keyof typeof TONE_STYLES;
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
  className?: string;
}

/**
 * Tarjeta con círculo numerado + acento lateral de color por estado — extraída de
 * workflow-sections-summary.tsx (su segundo consumidor es asset-form-section-reader.tsx, que
 * usa la variante `collapsible`). Sin i18n interno: `title`/`subtitle` llegan traducidos.
 *
 * `collapsible` + `actions` pueden convivir: el header se parte en un bloque clicable
 * (CollapsibleTrigger, con círculo/título/chevron) y los `actions` como hermano fuera del
 * trigger, para que sus botones no queden anidados dentro del <button> del trigger.
 */
export function HuemulNumberedStatusCard({
  number,
  title,
  tone,
  headerExtra,
  subtitle,
  actions,
  collapsible,
  open,
  onOpenChange,
  children,
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
      {number}
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
    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
  );

  if (!collapsible) {
    return (
      <Card className={cn("relative flex-row items-start gap-3 overflow-hidden p-4", className)}>
        {accent}
        {circle}
        {titleBlock}
        {actionsBlock}
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card className={cn("relative overflow-hidden p-0", className)}>
        <div className="flex w-full flex-row items-start gap-3 p-4">
          {accent}
          <CollapsibleTrigger className="group flex min-w-0 flex-1 flex-row items-start gap-3 text-left">
            {circle}
            {titleBlock}
            {chevron}
          </CollapsibleTrigger>
          {actionsBlock}
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
