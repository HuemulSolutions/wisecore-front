/**
 * Estado del cuerpo del sheet de Fuentes. Único origen de verdad: se deriva acá
 * (`getSourcesState`) y no con condiciones sueltas en el render.
 *
 * - `uploading` y `locked` conviven con la lista: la lista sigue usable con subidas en curso
 *   y queda en solo lectura cuando hay una elaboración externa.
 */
export type SourcesState = 'ready' | 'loading' | 'empty' | 'error' | 'uploading' | 'locked';

export const SOURCES_STATE_VALUES: readonly SourcesState[] = [
  'ready',
  'loading',
  'empty',
  'error',
  'uploading',
  'locked',
];

export function isSourcesState(value: unknown): value is SourcesState {
  return typeof value === 'string' && (SOURCES_STATE_VALUES as readonly string[]).includes(value);
}

export interface SourcesStateInput {
  isLoading: boolean;
  isError: boolean;
  /** Reintento de una carga fallida en curso: vuelve a `loading` en vez de dejar el error a la vista. */
  isFetching: boolean;
  /** Hay fuentes (activos, archivos o textos) o subidas en curso. */
  hasAnySource: boolean;
  hasActiveUploads: boolean;
  /** Elaboración externa en curso: la lista es de solo lectura. */
  isLocked: boolean;
}

export function getSourcesState(input: SourcesStateInput): SourcesState {
  if (input.isLoading) return 'loading';
  if (input.isError) return input.isFetching ? 'loading' : 'error';
  if (!input.hasAnySource) return 'empty';
  if (input.isLocked) return 'locked';
  if (input.hasActiveUploads) return 'uploading';
  return 'ready';
}
