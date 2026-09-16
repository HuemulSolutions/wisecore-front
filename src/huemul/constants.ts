import { cn } from "@/lib/utils"
import type { HuemulContentAlign, HuemulContentWidth } from "@/types/huemul"

/** Page size por defecto para tablas y listas paginadas. */
export const DEFAULT_PAGE_SIZE = 100

/** Opciones del selector de "items por página". Mínimo 100. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [100, 250, 500, 1000]

/**
 * Tope de ancho del contenido en pantallas grandes.
 *
 * **Primero la estructura, después el tope.** Si el contenido son bloques que
 * deben convivir a lo ancho, eso es un grid de columnas con `full` — no un
 * ancho calculado. Un tope solo sirve para **texto largo**, donde pasada cierta
 * medida la lectura se vuelve incómoda.
 *
 * Los tabs de configuración de tipos de activo pasaron por tres topes
 * (`max-w-xl` encajonado, `max-w-4xl` centrado, `w-1/2` a la izquierda) antes
 * de que quedara claro que su problema era estructural: son grids de dos
 * columnas a ancho completo.
 *
 * Es la única fuente de estos valores: no escribir `max-w-*` a mano en una
 * superficie nueva. `HuemulDetailSurface` lo aplica por tab vía `contentWidth`;
 * para aplicarlo en otro sitio, usar `contentWidthClass`.
 */
export const HUEMUL_CONTENT_WIDTH = {
  /** Tope de lectura para texto largo. */
  reader: "max-w-3xl",
  /** Sin límite: grids de columnas, tablas, matrices, canvas. */
  full: "",
} as const

/**
 * Clase de ancho + alineación del contenido. Concentra el detalle de que un
 * ancho centrado necesita además `mx-auto w-full` (el trío que ya usaban a mano
 * las vistas fullscreen de workflow y de asset).
 */
export function contentWidthClass(
  width: HuemulContentWidth = "full",
  align: HuemulContentAlign = "start",
): string {
  const value = HUEMUL_CONTENT_WIDTH[width]
  if (!value) return ""
  return cn(align === "center" && "mx-auto w-full", value)
}

/**
 * Paleta por defecto para campos de selección de color (swatches) y para
 * asignar color round-robin a etiquetas creadas al vuelo (ver HuemulTagPicker).
 */
export const DEFAULT_SWATCH_COLORS = [
  "#DC2626", "#EA580C", "#92400E", "#0F766E", "#0891B2",
  "#2563EB", "#7C3AED", "#DB2777", "#334155", "#94A3B8",
]
