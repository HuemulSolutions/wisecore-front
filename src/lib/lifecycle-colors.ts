/**
 * Colores por estado/etapa del ciclo de vida y por estado de ejecución —
 * fuente única. Antes cada badge/sheet declaraba su propio mapa
 * (`STAGE_COLORS` en huemul-lifecycle-stage-badge.tsx y en
 * assets-info-sheet.tsx, `getStatusColor` en execution-info-sheet.tsx, etc.) y
 * divergían entre sí: el mismo estado se veía con un color en assets y otro
 * en workflow. Ver "ia context/" — un cambio de paleta ahora se hace en un
 * solo sitio.
 *
 * Dos dominios, no confundir:
 * - Lifecycle (`ExecutionLifecycleState` / `LifecycleStep["type"]`): la fase
 *   del documento dentro de su ciclo de vida (borrador → revisión →
 *   aprobación → publicado…).
 * - Ejecución (`ExecutionStatus`): progreso técnico de un job en curso
 *   (pendiente → generando → completado/fallido), ver `lib/execution-status.ts`.
 *
 * El estado (`state`) manda sobre la etapa (`stage`): son dos vistas del
 * mismo momento del documento, así que comparten hue — la etapa "approve" se
 * pinta igual que el estado "in_approval".
 */
export type ColorHue = "slate" | "blue" | "amber" | "sky" | "emerald" | "teal" | "gray" | "indigo" | "red"

/** Clases de badge (pill) por hue. Todas con variante dark explícita. */
const BADGE_CLASSES: Record<ColorHue, string> = {
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
}

export interface BannerToneClasses {
  bg: string
  border: string
  text: string
}

export interface StageToneClasses {
  /** Relleno sólido: círculo de fase hecha/actual, conector recorrido. */
  solid: string
  /** Texto del label de la fase. */
  text: string
  /** Borde del círculo de la fase actual sin relleno. */
  border: string
  /** Fondo suave + texto para bloques destacados ("Próximo paso"). */
  soft: string
}

/** Clases de tono por hue para el stepper de fases y bloques destacados del progreso de ciclo de vida. */
const STAGE_TONE_CLASSES: Record<ColorHue, StageToneClasses> = {
  slate: {
    solid: "bg-slate-600 dark:bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-600 dark:border-slate-500",
    soft: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300",
  },
  blue: {
    solid: "bg-blue-600 dark:bg-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-600 dark:border-blue-500",
    soft: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  amber: {
    solid: "bg-amber-600 dark:bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-600 dark:border-amber-500",
    soft: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  sky: {
    solid: "bg-sky-600 dark:bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-600 dark:border-sky-500",
    soft: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  emerald: {
    solid: "bg-emerald-600 dark:bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-600 dark:border-emerald-500",
    soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  teal: {
    solid: "bg-teal-600 dark:bg-teal-500",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-600 dark:border-teal-500",
    soft: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  gray: {
    solid: "bg-gray-600 dark:bg-gray-500",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-600 dark:border-gray-500",
    soft: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
  },
  indigo: {
    solid: "bg-indigo-600 dark:bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-600 dark:border-indigo-500",
    soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  red: {
    solid: "bg-red-600 dark:bg-red-500",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-600 dark:border-red-500",
    soft: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
}

/** Solo los hues que usa `ExecutionStatusBanner` (fondo/borde suaves + texto, sin dark aún — el banner no lo tenía). */
const BANNER_CLASSES: Partial<Record<ColorHue, BannerToneClasses>> = {
  slate: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
  gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800" },
}

/** Hue por `state` de ejecución de lifecycle (`ExecutionLifecycleState`). */
const LIFECYCLE_STATE_HUE: Record<string, ColorHue> = {
  draft: "blue",
  in_review: "amber",
  in_approval: "sky",
  approved: "emerald",
  published: "teal",
  archived: "gray",
  finalized: "indigo",
}

/** Hue por `stage` (`LifecycleStatus.stage` / `LifecycleStep.type`). Alineado a `LIFECYCLE_STATE_HUE` para el mismo concepto. */
const LIFECYCLE_STAGE_HUE: Record<string, ColorHue> = {
  create: "slate",
  edit: "blue",
  review: "amber",
  approve: "sky",
  approved: "emerald",
  publish: "teal",
  published: "teal",
  archive: "gray",
  archived: "gray",
  view: "slate",
}

/** Hue por `status` de ejecución (`ExecutionStatus`) — eje de progreso técnico, no de fase. */
const EXECUTION_STATUS_HUE: Record<string, ColorHue> = {
  pending: "slate",
  queued: "slate",
  importing: "blue",
  running: "blue",
  generating: "blue",
  approving: "blue",
  paused: "amber",
  completed: "emerald",
  done: "emerald",
  approved: "emerald",
  failed: "red",
  import_failed: "red",
  cancelled: "gray",
}

const FALLBACK_HUE: ColorHue = "gray"

export function lifecycleStateColor(state: string | null | undefined): string {
  return BADGE_CLASSES[(state && LIFECYCLE_STATE_HUE[state]) || FALLBACK_HUE]
}

export function lifecycleStageColor(stage: string | null | undefined): string {
  return BADGE_CLASSES[(stage && LIFECYCLE_STAGE_HUE[stage]) || FALLBACK_HUE]
}

export function executionStatusColor(status: string | null | undefined): string {
  return BADGE_CLASSES[(status && EXECUTION_STATUS_HUE[status]) || FALLBACK_HUE]
}

/** Estilo del banner (bg-50/border-200/text-800) para el mismo hue que `executionStatusColor`. */
export function executionStatusBannerStyle(status: string | null | undefined): BannerToneClasses {
  const hue = (status && EXECUTION_STATUS_HUE[status]) || FALLBACK_HUE
  return BANNER_CLASSES[hue] ?? (BANNER_CLASSES[FALLBACK_HUE] as BannerToneClasses)
}

/** Tono genérico (para pills booleanos: `can_advance`, `version_required`, etc.) sin pasar por un estado del dominio. */
export function toneColor(hue: ColorHue): string {
  return BADGE_CLASSES[hue]
}

/** Tono de etapa (`LifecycleStatus.stage` / `LifecyclePhase.key`) para el stepper y bloques destacados del progreso. */
export function lifecycleStageTone(stage: string | null | undefined): StageToneClasses {
  return STAGE_TONE_CLASSES[(stage && LIFECYCLE_STAGE_HUE[stage]) || FALLBACK_HUE]
}

/** Tono genérico (para casos como "Devolver a", que es advertencia y no una etapa del dominio). */
export function toneStyle(hue: ColorHue): StageToneClasses {
  return STAGE_TONE_CLASSES[hue]
}
