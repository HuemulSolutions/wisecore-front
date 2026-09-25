/**
 * Nodo `data_table`: tabla que resuelve sus filas server-side contra
 * `POST /documents/{id}/data-tables/resolve`, en vez de contenido tecleado a mano como una
 * tabla Plate normal. Mismo molde de constante + snapshot-antes-de-guardar que `MERMAID_KEY` /
 * `ensureMermaidSnapshots` en `plate-mermaid-utils.ts` — acá no hay nada que subir (el
 * "snapshot" es texto), pero el punto del pipeline y la firma async son los mismos para que
 * ambos calcen en el mismo paso de `handleSave`.
 */
import {
  buildResolveTable,
  dataTableSpecHash,
  newDataTableNodeId,
  normalizeDataTableNode,
  readDataTableSnapshot,
  toPersistedDataTableNode,
  type AnyDataTableElement,
} from '@/lib/data-table-node-utils';
import type { DataTableResolveTableRequest, DataTableResolvedTable } from '@/types/data-table-resolve';
import type { DataTableSnapshot } from '@/types/data-table-node';

export const DATA_TABLE_KEY = 'data_table';

export type DataTableBatchResolver = (
  tables: DataTableResolveTableRequest[],
) => Promise<DataTableResolvedTable[]>;

export interface EnsureDataTableSnapshotsResult {
  value: unknown[];
  /** Nodos cuyo snapshot no se pudo actualizar en esta pasada (batch caído, o `status != 'ok'`). */
  failed: number;
  /** Nodos `data_table` encontrados en el árbol. */
  total: number;
}

const RESOLVE_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('data-table resolve timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Recorre el árbol y recalcula `snapshot` de cada nodo `data_table` contra un único request de
 * `/resolve` (batch) — no un request por nodo. Nodos con la misma configuración (mismo hash,
 * sin contar `node_id`) comparten una sola entrada del batch. `resolveBatch === null` (editor
 * de plantillas, sin documento) saltea la red entera: cada nodo conserva su snapshot actual.
 *
 * Dos pasadas porque hay un `await` en el medio (el walk de una sola pasada de la versión
 * anterior era síncrono): primero se recolectan los nodos y se arma el request, después se
 * escribe el resultado. Un fallo del batch nunca hace perder el snapshot anterior — se
 * conserva y se cuenta en `failed`, mismo criterio que ya tiene mermaid (no perder el trabajo
 * del usuario por un servicio auxiliar caído).
 */
export async function ensureDataTableSnapshots(
  nodes: unknown[],
  resolveBatch: DataTableBatchResolver | null,
  /** Label i18n local para columnas sin rename del usuario (ver `data-table-catalog-labels.ts`)
   * — así el snapshot congelado (primer paint, export a Markdown) sale en el idioma de la UI
   * en vez del español fijo del backend. Opcional: sin él, el backend elige su propio label. */
  labelFor?: (columnId: string) => string | undefined,
): Promise<EnsureDataTableSnapshotsResult> {
  interface Collected {
    normalized: ReturnType<typeof normalizeDataTableNode>;
    requestTable: DataTableResolveTableRequest;
    hash: string;
  }
  // Índice por orden de recorrido — el `write` de abajo visita el árbol en el mismo orden
  // depth-first, así que `collected[i]` es siempre el mismo nodo lógico en ambas pasadas.
  // Importante: el `node_id` (nuevo o generado acá para un nodo legacy) se calcula UNA sola
  // vez en esta pasada y viaja dentro de `normalized` — recalcularlo de nuevo en `write`
  // generaría un UUID distinto y el snapshot resuelto nunca encontraría su nodo.
  const collected: Collected[] = [];

  const collect = (node: unknown): void => {
    if (typeof node !== 'object' || node === null || 'text' in node) return;
    const el = node as Record<string, unknown>;
    if (Array.isArray(el.children)) el.children.forEach(collect);
    if (el.type !== DATA_TABLE_KEY) return;

    const raw = normalizeDataTableNode(el as AnyDataTableElement);
    const normalized = raw.node_id ? raw : { ...raw, node_id: newDataTableNodeId() };
    const requestTable = buildResolveTable(normalized, { labelFor });
    collected.push({ normalized, requestTable, hash: dataTableSpecHash([requestTable]) });
  };
  nodes.forEach(collect);

  const total = collected.length;
  let failed = 0;

  // Dedupe por hash (sin node_id) — varias tablas con la misma config comparten un resultado.
  const uniqueHashes: string[] = [];
  const uniqueTables: DataTableResolveTableRequest[] = [];
  const seenHashes = new Set<string>();
  for (const c of collected) {
    if (!seenHashes.has(c.hash)) {
      seenHashes.add(c.hash);
      uniqueHashes.push(c.hash);
      uniqueTables.push(c.requestTable);
    }
  }

  let resultByHash: Map<string, DataTableResolvedTable> | null = null;
  if (resolveBatch && uniqueTables.length > 0) {
    try {
      const resolved = await withTimeout(resolveBatch(uniqueTables), RESOLVE_TIMEOUT_MS);
      resultByHash = new Map();
      uniqueHashes.forEach((hash, i) => {
        if (resolved[i]) resultByHash!.set(hash, resolved[i]);
      });
    } catch {
      resultByHash = null; // batch caído entero — todos conservan su snapshot anterior.
    }
  }

  // Snapshot final por índice de recorrido, en el mismo orden que `collected`.
  const snapshots: (DataTableSnapshot | null)[] = collected.map((c) => {
    const resolved = resultByHash?.get(c.hash);
    if (resolved && resolved.status === 'ok') {
      return { headers: resolved.headers, rows: resolved.rows, captured_at: new Date().toISOString() };
    }
    if (resolveBatch) failed += 1; // no cuenta como "fallo" cuando ni se intentó (sin documento).
    return c.normalized.snapshot;
  });

  let cursor = 0;
  const write = (node: unknown): unknown => {
    if (typeof node !== 'object' || node === null) return node;
    if ('text' in node) return node;

    const el = node as Record<string, unknown>;
    const children = Array.isArray(el.children) ? (el.children as unknown[]).map(write) : el.children;

    if (el.type !== DATA_TABLE_KEY) {
      return children === el.children ? el : { ...el, children };
    }

    const { normalized } = collected[cursor];
    const snapshot = snapshots[cursor];
    cursor += 1;
    return { ...el, children, ...toPersistedDataTableNode(normalized, snapshot) };
  };

  const value = nodes.map(write);
  return { value, failed, total };
}

/**
 * Pasada síncrona, sin red — normaliza la estructura (`columns`/`filters` al shape nuevo) y
 * asigna `node_id` a los nodos que no lo tengan, sin tocar `snapshot`. La ruta de autosave no
 * pasa por `ensureDataTableSnapshots` (no congela snapshots en cada autosave), pero igual debe
 * backfillear `node_id` para que un documento que solo se autoguarda (nunca pasa por "Guardar")
 * termine teniendo el ancla que necesitan los marcadores de Markdown y el refresco automático.
 */
export function normalizeDataTableNodesInTree(nodes: unknown[]): unknown[] {
  const walk = (node: unknown): unknown => {
    if (typeof node !== 'object' || node === null || 'text' in node) return node;
    const el = node as Record<string, unknown>;
    const children = Array.isArray(el.children) ? (el.children as unknown[]).map(walk) : el.children;

    if (el.type !== DATA_TABLE_KEY) {
      return children === el.children ? el : { ...el, children };
    }

    const normalized = normalizeDataTableNode(el as AnyDataTableElement);
    const node_id = normalized.node_id ?? newDataTableNodeId();
    return { ...el, children, ...toPersistedDataTableNode({ ...normalized, node_id }, normalized.snapshot) };
  };
  return nodes.map(walk);
}

/** Escapa `|` y saltos de línea — una celda de tabla GFM no puede tener ninguno de los dos. */
function escapeGfmCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Arma una tabla en Markdown GFM (`remarkGfm` ya registrado en `markdown-kit.ts`) a partir del
 * snapshot congelado del nodo, envuelta en marcadores HTML `<!-- data_table:{node_id} -->` /
 * `<!-- /data_table -->` para que el backend pueda ubicar y reemplazar el bloque al refrescar
 * automáticamente (`refresh_on_approval`). Sin `node_id` (nodo legacy que nunca pasó por un
 * guardado nuevo) se omiten los marcadores — el refresco automático no falla, solo deja ese
 * bloque desincronizado hasta el próximo guardado manual.
 */
export function buildGfmTableMarkdown(element: AnyDataTableElement): string {
  const nodeId = typeof element.node_id === 'string' && element.node_id.trim() ? element.node_id : null;
  const snapshot = readDataTableSnapshot(element);
  const title = typeof element.title === 'string' ? element.title : null;
  const heading = title?.trim() ? `**${title.trim()}**\n\n` : '';

  const body =
    !snapshot || snapshot.headers.length === 0
      ? heading.trim()
      : [
          heading,
          `| ${snapshot.headers.map(escapeGfmCell).join(' | ')} |`,
          `| ${snapshot.headers.map(() => '---').join(' | ')} |`,
          ...snapshot.rows.map((row) => `| ${row.map(escapeGfmCell).join(' | ')} |`),
        ].join('\n');

  if (!nodeId) return body;

  // Con cuerpo vacío igual se emiten los marcadores: un nodo sin snapshot todavía necesita el
  // ancla en el Markdown para que un refresco posterior pueda inyectar la tabla ahí.
  return `<!-- data_table:${nodeId} -->\n\n${body}\n\n<!-- /data_table -->`;
}
