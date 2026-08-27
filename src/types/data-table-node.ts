import type { TElement } from 'platejs';
import type { ExecutionInfo } from '@/types/assets';
import type { ExecutionLifecycleState } from '@/types/execution';

/** Fuentes de datos soportadas por el nodo `data_table` — ver `src/lib/data-table-sources.ts`. */
export type DataTableSourceId = 'document_versions' | 'document_metadata';

/**
 * `documentContent.executions` / `useExecutionsByDocumentId` traen en runtime más campos de
 * los que `ExecutionInfo` declara (el backend no está completamente tipado acá — mismo caso
 * documentado en `services/executions.ts` sobre `getExecutionById`). Estos son los que ya leen
 * `assets-version-management-sheet.tsx` y `mention-refs-context.tsx`.
 */
export interface DataTableExecutionRow extends ExecutionInfo {
  lifecycle_state?: string;
  created_by_user?: { name: string; last_name: string } | null;
  updated_by_user?: { name: string; last_name: string } | null;
  updated_at?: string;
  /** Solo viene en `GET /execution/{id}` (detalle), no en el listado — ver plan de backend. */
  change_summary?: string | null;
}

/** Snapshot congelado en el propio nodo — lo usa la serialización a Markdown (corre fuera de
 * React, sin acceso al caché de datos frescos) y el primer paint antes de resolver en vivo.
 * Mismo criterio que `pinnedVersionLabel` en `AssetReferenceElement` y `snapshotCode` en el
 * nodo mermaid. */
export interface DataTableSnapshot {
  headers: string[];
  rows: string[][];
  capturedAt: string;
}

export interface DataTableFilters {
  lifecycleStates?: ExecutionLifecycleState[];
}

/** Nodo void que renderiza una tabla resuelta en vivo contra el caché del documento actual. */
export interface DataTableElement extends TElement {
  source: DataTableSourceId;
  /** Alcance de la fuente — hoy solo el documento actual; deja lugar a `{ kind: 'asset', assetId }`. */
  scope: { kind: 'current' };
  /** Ids de columna del catálogo de la fuente, en orden de despliegue. */
  columns: string[];
  filters?: DataTableFilters | null;
  limit?: number | null;
  title?: string | null;
  snapshot?: DataTableSnapshot | null;
}
