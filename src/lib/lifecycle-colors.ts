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
 *
 * Criterio de paleta: etapas consecutivas del ciclo de vida deben quedar
 * separadas en la rueda de color, no ser vecinas. Separación resultante en
 * oklch: blue 264°, violet 303°, amber 63°, green 146°, teal 184°, stone
 * neutro — unos 38° o más entre estados consecutivos. Al asignar un hue
 * nuevo, contrastarlo contra toda la paleta de lifecycle, no solo contra el
 * vecino.
 *
 * Los dos ejes (lifecycle y ejecución) no comparten hue, salvo `green`, que
 * en ambos significa lo mismo: "salió bien". `published` (lifecycle) y
 * `completed`/`done`/`approved` (ejecución) son los únicos verdes.
 */
export type ColorHue =
  | "slate"
  | "blue"
  | "sky"
  | "amber"
  | "yellow"
  | "violet"
  | "teal"
  | "green"
  | "cyan"
  | "gray"
  | "stone"
  | "indigo"
  | "red"

/** Clases de badge (pill) por hue. Todas con variante dark explícita. */
const BADGE_CLASSES: Record<ColorHue, string> = {
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  green: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200",
  stone: "bg-stone-100 text-stone-800 dark:bg-stone-950 dark:text-stone-200",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
}

/** Clase del punto de color (6px) que acompaña el texto del badge de estado — segunda señal cuando dos estados caen en filas contiguas. */
const DOT_CLASSES: Record<ColorHue, string> = {
  slate: "bg-slate-600 dark:bg-slate-500",
  blue: "bg-blue-600 dark:bg-blue-500",
  sky: "bg-sky-600 dark:bg-sky-500",
  amber: "bg-amber-600 dark:bg-amber-500",
  yellow: "bg-yellow-600 dark:bg-yellow-500",
  violet: "bg-violet-600 dark:bg-violet-500",
  teal: "bg-teal-600 dark:bg-teal-500",
  green: "bg-green-600 dark:bg-green-500",
  cyan: "bg-cyan-600 dark:bg-cyan-500",
  gray: "bg-gray-600 dark:bg-gray-500",
  stone: "bg-stone-600 dark:bg-stone-500",
  indigo: "bg-indigo-600 dark:bg-indigo-500",
  red: "bg-red-600 dark:bg-red-500",
}

/** Clase del badge sólido (fondo -600, texto blanco) para el estado del activo abierto (header, selector de versión) y siempre para "published". */
const SOLID_BADGE_CLASSES: Record<ColorHue, string> = {
  slate: "bg-slate-600 text-white",
  blue: "bg-blue-600 text-white",
  sky: "bg-sky-600 text-white",
  amber: "bg-amber-600 text-white",
  yellow: "bg-yellow-600 text-white",
  violet: "bg-violet-600 text-white",
  teal: "bg-teal-600 text-white",
  green: "bg-green-600 text-white",
  cyan: "bg-cyan-600 text-white",
  gray: "bg-gray-600 text-white",
  stone: "bg-stone-600 text-white",
  indigo: "bg-indigo-600 text-white",
  red: "bg-red-600 text-white",
}

export interface BannerToneClasses {
  bg: string
  border: string
  text: string
  /** Color del icono del banner — debe compartir hue con `bg`/`border`/`text` para no desincronizarse. */
  icon: string
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
  yellow: {
    solid: "bg-yellow-600 dark:bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-600 dark:border-yellow-500",
    soft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  },
  sky: {
    solid: "bg-sky-600 dark:bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-600 dark:border-sky-500",
    soft: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  violet: {
    solid: "bg-violet-600 dark:bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-600 dark:border-violet-500",
    soft: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  green: {
    solid: "bg-green-600 dark:bg-green-500",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-600 dark:border-green-500",
    soft: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  teal: {
    solid: "bg-teal-600 dark:bg-teal-500",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-600 dark:border-teal-500",
    soft: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  cyan: {
    solid: "bg-cyan-600 dark:bg-cyan-500",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-600 dark:border-cyan-500",
    soft: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  },
  gray: {
    solid: "bg-gray-600 dark:bg-gray-500",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-600 dark:border-gray-500",
    soft: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
  },
  stone: {
    solid: "bg-stone-600 dark:bg-stone-500",
    text: "text-stone-700 dark:text-stone-300",
    border: "border-stone-600 dark:border-stone-500",
    soft: "bg-stone-50 text-stone-700 dark:bg-stone-950 dark:text-stone-300",
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

/** Hues que puede devolver `EXECUTION_STATUS_HUE` — el dominio de `ExecutionStatusBanner` y los otros banners de ejecución. */
type BannerHue = "slate" | "blue" | "sky" | "amber" | "yellow" | "green" | "red" | "gray"

/** Clases de banner (fondo/borde/texto/icono suaves) por hue, con variante dark — cubre los 8 hues del eje de ejecución. */
const BANNER_CLASSES: Record<BannerHue, BannerToneClasses> = {
  slate: {
    bg: "bg-slate-50 dark:bg-slate-950/40",
    border: "border-slate-200 dark:border-slate-900",
    text: "text-slate-800 dark:text-slate-200",
    icon: "text-slate-600 dark:text-slate-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900",
    text: "text-blue-800 dark:text-blue-200",
    icon: "text-blue-600 dark:text-blue-400",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-900",
    text: "text-sky-800 dark:text-sky-200",
    icon: "text-sky-600 dark:text-sky-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-800 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-200 dark:border-yellow-900",
    text: "text-yellow-800 dark:text-yellow-200",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-800 dark:text-green-200",
    icon: "text-green-600 dark:text-green-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900",
    text: "text-red-800 dark:text-red-200",
    icon: "text-red-600 dark:text-red-400",
  },
  gray: {
    bg: "bg-gray-50 dark:bg-gray-950/40",
    border: "border-gray-200 dark:border-gray-900",
    text: "text-gray-800 dark:text-gray-200",
    icon: "text-gray-600 dark:text-gray-400",
  },
}

/** Hue por `state` de ejecución de lifecycle (`ExecutionLifecycleState`). */
const LIFECYCLE_STATE_HUE: Record<string, ColorHue> = {
  draft: "blue",
  in_review: "amber",
  in_approval: "violet",
  approved: "teal",
  published: "green",
  archived: "stone",
  finalized: "indigo",
}

/** Hue por `stage` (`LifecycleStatus.stage` / `LifecycleStep.type`). Alineado a `LIFECYCLE_STATE_HUE` para el mismo concepto. */
const LIFECYCLE_STAGE_HUE: Record<string, ColorHue> = {
  create: "slate",
  edit: "blue",
  review: "amber",
  approve: "violet",
  approved: "teal",
  publish: "green",
  published: "green",
  archive: "stone",
  archived: "stone",
  view: "slate",
}

/** Hue por `status` de ejecución (`ExecutionStatus`) — eje de progreso técnico, no de fase. No comparte hue con el eje de lifecycle salvo `green` ("salió bien" en ambos ejes). */
const EXECUTION_STATUS_HUE: Record<string, BannerHue> = {
  pending: "slate",
  queued: "slate",
  importing: "sky",
  running: "sky",
  generating: "sky",
  approving: "sky",
  paused: "yellow",
  completed: "green",
  done: "green",
  approved: "green",
  failed: "red",
  import_failed: "red",
  cancelled: "gray",
}

const FALLBACK_HUE: ColorHue = "gray"
const FALLBACK_BANNER_HUE: BannerHue = "gray"

export function lifecycleStateColor(state: string | null | undefined): string {
  return BADGE_CLASSES[(state && LIFECYCLE_STATE_HUE[state]) || FALLBACK_HUE]
}

/**
 * Hue crudo por `state` de lifecycle, para superficies que resuelven sus
 * propias clases a partir del hue (p. ej. los KPI cards de home) en vez de
 * usar las clases de badge de `lifecycleStateColor`.
 */
export function lifecycleStateHue(state: string | null | undefined): ColorHue {
  return (state && LIFECYCLE_STATE_HUE[state]) || FALLBACK_HUE
}

export function lifecycleStageColor(stage: string | null | undefined): string {
  return BADGE_CLASSES[(stage && LIFECYCLE_STAGE_HUE[stage]) || FALLBACK_HUE]
}

/** Clase del punto de color (6px, `bg-{hue}-600`) para el `state` de lifecycle. Segunda señal junto al texto del badge. */
export function lifecycleStateDot(state: string | null | undefined): string {
  return DOT_CLASSES[(state && LIFECYCLE_STATE_HUE[state]) || FALLBACK_HUE]
}

/** Badge sólido (`bg-{hue}-600 text-white`) para el `state` de lifecycle — solo para el estado del activo abierto (header, selector de versión) o para "published", que se muestra sólido siempre. */
export function lifecycleStateSolidColor(state: string | null | undefined): string {
  return SOLID_BADGE_CLASSES[(state && LIFECYCLE_STATE_HUE[state]) || FALLBACK_HUE]
}

/** Clase del punto de color (6px) para el `stage` de lifecycle. Ver `lifecycleStateDot`. */
export function lifecycleStageDot(stage: string | null | undefined): string {
  return DOT_CLASSES[(stage && LIFECYCLE_STAGE_HUE[stage]) || FALLBACK_HUE]
}

export function executionStatusColor(status: string | null | undefined): string {
  return BADGE_CLASSES[(status && EXECUTION_STATUS_HUE[status]) || FALLBACK_HUE]
}

/** Clase de relleno sólido (`bg-{hue}-600`) para el `status` de ejecución — barras de progreso. */
export function executionStatusDot(status: string | null | undefined): string {
  return DOT_CLASSES[(status && EXECUTION_STATUS_HUE[status]) || FALLBACK_BANNER_HUE]
}

/** Botón sólido (`bg-{hue}-600 text-white`) para el `status` de ejecución — p. ej. "Ver sugerencia" en el banner de éxito de IA. */
export function executionStatusSolidColor(status: string | null | undefined): string {
  return SOLID_BADGE_CLASSES[(status && EXECUTION_STATUS_HUE[status]) || FALLBACK_BANNER_HUE]
}

/** Estilo del banner (bg-50/border-200/text-800/icon) para el mismo hue que `executionStatusColor`. */
export function executionStatusBannerStyle(status: string | null | undefined): BannerToneClasses {
  const hue = (status && EXECUTION_STATUS_HUE[status]) || FALLBACK_BANNER_HUE
  return BANNER_CLASSES[hue] ?? BANNER_CLASSES[FALLBACK_BANNER_HUE]
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
