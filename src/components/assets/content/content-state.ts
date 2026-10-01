/**
 * Estado del área de contenido central del Asset. Único origen de verdad: se deriva acá
 * (`getContentState`) y no con flags sueltos en el render.
 */
export type ContentState =
  | 'ready'
  | 'loading'
  | 'error'
  | 'restricted'
  | 'generating'
  | 'runFailed'
  | 'importFailed'
  | 'emptyNoSections'
  | 'emptyWithSections'
  | 'noSelection';

export const CONTENT_STATE_VALUES: readonly ContentState[] = [
  'ready',
  'loading',
  'error',
  'restricted',
  'generating',
  'runFailed',
  'importFailed',
  'emptyNoSections',
  'emptyWithSections',
  'noSelection',
];

export function isContentState(value: unknown): value is ContentState {
  return typeof value === 'string' && (CONTENT_STATE_VALUES as readonly string[]).includes(value);
}

export interface ContentStateQuery {
  /** Carga inicial de /content o de la lista de secciones con `view` (sin ella no se sabe qué ocultar). */
  isLoading: boolean;
  isError: boolean;
}

export interface ContentStateVersion {
  /** `canViewContent`: permiso de ciclo de vida para ver el contenido en la etapa actual. */
  canView: boolean;
  /** Estado de la ejecución en pantalla (`running`, `failed`, `import_failed`, …). */
  status?: string | null;
  /** La versión en pantalla se está generando completa (full / full-single) y el aviso no fue descartado. */
  isGeneratingFull: boolean;
  /** Hay al menos una ejecución (versión) para el asset. */
  hasExecutions: boolean;
  /** /content trajo contenido (aunque sea una lista vacía de secciones renderizables). */
  hasContent: boolean;
  /** Cantidad de secciones definidas; `undefined` mientras no se sabe (se carga a demanda). */
  sectionCount?: number;
}

export interface ContentStateRun {
  /** Hay una corrida parcial (single / from) en curso: se informa en su banner, no reemplaza el contenido. */
  isSectionRun: boolean;
}

export function getContentState(
  query: ContentStateQuery,
  version: ContentStateVersion,
  run: ContentStateRun,
): ContentState {
  if (query.isLoading) return 'loading';
  if (query.isError) return 'error';
  if (!version.canView) return 'restricted';

  if (version.isGeneratingFull && version.status !== 'import_failed' && !run.isSectionRun) {
    return 'generating';
  }

  if (!version.hasExecutions || !version.hasContent) {
    if (version.status === 'import_failed') return 'importFailed';
    if (version.status === 'failed') return 'runFailed';
    return version.sectionCount && version.sectionCount > 0 ? 'emptyWithSections' : 'emptyNoSections';
  }

  return 'ready';
}
