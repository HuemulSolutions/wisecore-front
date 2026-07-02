import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface HuemulExpandableTextProps {
  /** Texto a mostrar; respeta saltos de línea (`\n`). */
  text: string;
  /** Número de líneas visibles cuando está colapsado. Default 2. */
  collapsedLines?: number;
  /** Etiqueta del afordancia para expandir (desde i18n). */
  showMoreLabel: string;
  /** Etiqueta del afordancia para colapsar (desde i18n). */
  showLessLabel: string;
  /** Contenido opcional renderizado antes del texto, dentro del área clickeable. */
  leading?: React.ReactNode;
  /** Clases para el contenedor externo. */
  className?: string;
  /** Clases para el párrafo del texto. */
  textClassName?: string;
  /** Alto máximo (px) del contenido al expandir; con scroll interno si lo excede. Default 192. */
  expandedMaxHeight?: number;
  /**
   * Si es `true`, el componente arranca oculto detrás de un botón disparador
   * (muestra solo `leading` + chevron). Al pulsarlo se despliega el contenido;
   * al volver a pulsarlo se oculta (toggle). Default `false`.
   */
  collapsible?: boolean;
  /** Estado inicial del disclosure externo cuando `collapsible` es `true`. Default `false`. */
  defaultOpen?: boolean;
  /** Clases para el botón disparador (solo en modo `collapsible`). */
  triggerClassName?: string;
}

/**
 * Texto con recorte por líneas y expansión al hacer clic en toda el área.
 *
 * Colapsado muestra `collapsedLines` líneas (line-clamp). Detecta overflow real
 * con ResizeObserver, de modo que el afordancia "ver más" y la interacción de
 * clic solo aparecen cuando el contenido realmente se recorta.
 *
 * En modo `collapsible`, el bloque revelado por el disclosure externo siempre
 * muestra el texto completo dentro de `expandedMaxHeight` con scroll interno,
 * sin un segundo toggle "ver más" (no aplica `collapsedLines`).
 */
export function HuemulExpandableText({
  text,
  collapsedLines = 2,
  showMoreLabel,
  showLessLabel,
  leading,
  className,
  textClassName,
  expandedMaxHeight = 192,
  collapsible = false,
  defaultOpen = false,
  triggerClassName,
}: HuemulExpandableTextProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [revealed, setRevealed] = React.useState(defaultOpen);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  // Callback ref: al cambiar el render de `<div>` a `<Collapsible><button>`, el
  // `<p>` se remonta como nodo nuevo; con un ref de estado el efecto se vuelve a
  // ejecutar y el ResizeObserver se reengancha siempre al nodo vivo.
  const [textEl, setTextEl] = React.useState<HTMLParagraphElement | null>(null);

  React.useLayoutEffect(() => {
    const el = textEl;
    // En modo `collapsible` el texto siempre se muestra completo (ver `showFull`
    // más abajo), por lo que no hace falta detectar recorte por líneas.
    if (!el || collapsible) return;

    const measure = () => {
      // Altura objetivo del recorte: N líneas según el line-height computado.
      const cs = window.getComputedStyle(el);
      let lineHeight = parseFloat(cs.lineHeight);
      if (Number.isNaN(lineHeight)) {
        lineHeight = parseFloat(cs.fontSize) * 1.2;
      }
      const targetHeight = lineHeight * collapsedLines;

      // Altura real del contenido completo. Colapsado, el `<p>` tiene el clamp
      // inline; lo quitamos de forma temporal y síncrona para leer `scrollHeight`.
      const prev = {
        display: el.style.display,
        webkitLineClamp: el.style.webkitLineClamp,
        overflow: el.style.overflow,
      };
      el.style.display = "block";
      el.style.webkitLineClamp = "";
      el.style.overflow = "visible";

      const fullHeight = el.scrollHeight;

      el.style.display = prev.display;
      el.style.webkitLineClamp = prev.webkitLineClamp;
      el.style.overflow = prev.overflow;

      setIsOverflowing(fullHeight > targetHeight + 1);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [textEl, text, collapsedLines, collapsible]);

  // En modo `collapsible` no existe un segundo toggle interno: al revelar el
  // bloque se muestra siempre el texto completo (con scroll), sin "ver más".
  const canToggle = collapsible ? false : (isOverflowing || expanded);
  const showFull = collapsible || expanded;

  // Cuerpo de texto sin `leading`, para poder reutilizarlo dentro del modo colapsable
  // (donde `leading` se renderiza en el botón disparador, no junto al texto).
  const textBody = (
    <>
      {showFull ? (
        <ScrollArea
          className="flex-1 min-w-0"
          style={{ maxHeight: expandedMaxHeight }}
          viewportClassName="!h-auto max-h-[inherit]"
        >
          <p
            ref={setTextEl}
            className={cn(
              "text-sm text-gray-500 whitespace-pre-line break-words pr-3",
              textClassName
            )}
          >
            {text}
          </p>
        </ScrollArea>
      ) : (
        <p
          ref={setTextEl}
          className={cn(
            "flex-1 min-w-0 text-sm text-gray-500 whitespace-pre-line break-words",
            textClassName
          )}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: collapsedLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {text}
        </p>
      )}
      {canToggle && (
        <span className="flex items-center gap-0.5 shrink-0 self-start text-sm font-medium text-blue-600">
          {expanded ? showLessLabel : showMoreLabel}
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </span>
      )}
    </>
  );

  const containerClassName = cn("flex items-start gap-3 text-left w-full min-w-0", className);

  // Envuelve un nodo aplicando la lógica de "estático vs clickeable" del disclosure
  // interno (line-clamp + "Ver más/menos") según si el texto realmente se recorta.
  const wrapClickable = (node: React.ReactNode) => {
    if (!canToggle) {
      return <div className={containerClassName}>{node}</div>;
    }
    return (
      <Collapsible open={expanded} onOpenChange={setExpanded} className="w-full">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(containerClassName, "group hover:cursor-pointer")}
          >
            {node}
          </button>
        </CollapsibleTrigger>
      </Collapsible>
    );
  };

  // Modo colapsable: el contenido arranca oculto detrás de un botón disparador
  // que muestra `leading` + chevron. El cuerpo de texto se despliega/oculta (toggle).
  if (collapsible) {
    return (
      <Collapsible open={revealed} onOpenChange={setRevealed} className="w-full">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/reveal inline-flex w-fit items-center gap-1.5 hover:cursor-pointer",
              triggerClassName
            )}
          >
            {leading}
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform group-data-[state=open]/reveal:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          {wrapClickable(textBody)}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return wrapClickable(
    <>
      {leading}
      {textBody}
    </>
  );
}
