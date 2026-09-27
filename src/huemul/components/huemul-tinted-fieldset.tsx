import { cn } from "@/lib/utils";
import type { HuemulTintedFieldsetProps } from "@/types/huemul/tinted-fieldset";
export type { HuemulTintedFieldsetProps } from "@/types/huemul/tinted-fieldset";

/**
 * Caja de configuración tintada del color de una categoría — encabezado en
 * mayúsculas con letter-spacing, slot de acción a la derecha, y nota al pie
 * opcional. Usada para el bloque de configuración por tipo de sección.
 */
export function HuemulTintedFieldset({
  title,
  accent,
  borderColor,
  background,
  headerRight,
  footNote,
  children,
  className,
}: HuemulTintedFieldsetProps) {
  return (
    <div
      className={cn("flex flex-col gap-3 rounded-xl border p-4.5", className)}
      style={{ borderColor, backgroundColor: background }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ color: accent, letterSpacing: "0.06em" }}
        >
          {title}
        </span>
        {headerRight}
      </div>
      {children}
      {footNote && <p className="text-xs text-[#64748b]">{footNote}</p>}
    </div>
  );
}
