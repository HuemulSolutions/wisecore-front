import type { TElement } from 'platejs';
import type { DataTableColumnSpec } from '@/types/data-table-resolve';

/** Fuente del catálogo `/data-table/sources` — ids dinámicos, ya no hardcodeados en el front. */
export type DataTableSourceId = string;

/** Snapshot congelado en el propio nodo — lo usa la serialización a Markdown (corre fuera de
 * React, sin acceso al caché de datos frescos) y el primer paint antes de resolver contra el
 * backend. Shape snake_case (contrato de `/documents/{id}/data-tables/resolve`); nodos legacy
 * traen `capturedAt` (camelCase) — ver `readDataTableSnapshot` en `data-table-node-utils.ts`,
 * que es quien tolera ambos. Mismo criterio que `pinnedVersionLabel` en `AssetReferenceElement`
 * y `snapshotCode` en el nodo mermaid. */
export interface DataTableSnapshot {
  headers: string[];
  rows: string[][];
  captured_at: string;
}

/** Nodo void que renderiza una tabla resuelta server-side. `filters` es un mapa genérico
 * `filter_id -> string[]` (shape del catálogo); nodos legacy traían `lifecycleStates`/
 * `relationshipDirections` camelCase — ver `normalizeDataTableNode`. */
export interface DataTableElement extends TElement {
  /** Id estable generado por el front al insertar — ancla del batch de `/resolve`, de los
   * marcadores de Markdown y del refresco automático al aprobar. Ausente en nodos legacy
   * hasta el próximo guardado (ver `ensureDataTableSnapshots`). */
  node_id?: string;
  source: DataTableSourceId;
  /** Alcance de la fuente — hoy solo el documento actual; deja lugar a `{ kind: 'asset', assetId }`. */
  scope: { kind: 'current' };
  columns: DataTableColumnSpec[];
  filters?: Record<string, string[]> | null;
  limit?: number | null;
  title?: string | null;
  /** Recalcula el snapshot solo, sin abrir el editor, al completar la aprobación o al publicar. */
  refresh_on_approval?: boolean;
  snapshot?: DataTableSnapshot | null;
}

/** Config editable del nodo — lo que arma/consume `DataTableConfigSheet` al insertar o reconfigurar. */
export type DataTableConfig = Pick<
  DataTableElement,
  'source' | 'columns' | 'filters' | 'limit' | 'title' | 'refresh_on_approval'
>;
