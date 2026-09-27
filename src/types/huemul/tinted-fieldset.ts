import type { ReactNode } from "react";

// Caja de configuración tintada del color de una categoría (ej. el bloque
// por tipo de sección) — encabezado en mayúsculas + slot de acción a la
// derecha + nota al pie opcional.
export interface HuemulTintedFieldsetProps {
  title: string;
  /** Color del encabezado y (por defecto) de acentos internos. */
  accent: string;
  borderColor: string;
  background: string;
  headerRight?: ReactNode;
  footNote?: ReactNode;
  children: ReactNode;
  className?: string;
}
