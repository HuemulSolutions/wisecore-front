import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import type { HuemulTagChipProps } from "@/types/huemul";
export type { HuemulTagChipProps };

const FALLBACK_COLOR = "#94a3b8";

const SIZE_CLASSES: Record<NonNullable<HuemulTagChipProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
};

/**
 * `HuemulTagChip` — pill genérica para representar una etiqueta (nombre + color)
 * en cualquier pantalla que consuma el módulo de etiquetas: sheet de asignación,
 * chips de solo lectura en un info sheet, vista previa del formulario de tags.
 *
 * Sin `onRemove` es de solo lectura. Con `onRemove` agrega una X — usar solo
 * cuando el caller ya validó permiso de escritura (`tag:u`).
 *
 * @example
 * ```tsx
 * <HuemulTagChip label={tag.name} color={tag.color} onRemove={() => unassign(tag.id)} />
 * ```
 */
export function HuemulTagChip({
  label,
  color,
  onRemove,
  disabled = false,
  size = "md",
  className,
}: HuemulTagChipProps) {
  const { t } = useTranslation("common");
  const resolvedColor = color || FALLBACK_COLOR;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        backgroundColor: `${resolvedColor}1a`,
        borderColor: resolvedColor,
        color: resolvedColor,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: resolvedColor }} />
      <span className="truncate max-w-[12rem]">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={t("close", "Close")}
          className="-mr-1 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:cursor-pointer hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
