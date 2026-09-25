/**
 * Adaptador puro del nodo `data_table` — sin React, sin i18n. Traduce cualquier generación del
 * nodo (legacy camelCase o el shape nuevo del backend) a un shape normalizado, y arma desde ahí
 * tanto el request de `/resolve` como lo que se persiste en `plate_content`. Vive fuera de React
 * porque `markdown-kit.tsx` y `plate-data-table-utils.ts` (serialización a Markdown, snapshot
 * antes de guardar) corren fuera del árbol de componentes.
 *
 * Ver plan: `ia context/plate-custom-node-guide.md` §6 y la guía de este cambio en
 * `respuestas/spec-data-table-backend.md`.
 */
import type { TElement } from 'platejs';
import type { DataTableColumnSpec, DataTableResolveTableRequest } from '@/types/data-table-resolve';
import type { DataTableElement, DataTableSnapshot } from '@/types/data-table-node';

/** Shape "ancho" que acepta cualquier generación del nodo — solo para leer. */
export type AnyDataTableElement = TElement & Record<string, unknown>;

export interface NormalizedDataTableNode {
  node_id: string | null;
  source: string;
  scope: { kind: 'current' };
  columns: DataTableColumnSpec[];
  filters: Record<string, string[]>;
  limit: number | null;
  title: string | null;
  refresh_on_approval: boolean;
  snapshot: DataTableSnapshot | null;
}

function normalizeColumns(raw: unknown): DataTableColumnSpec[] {
  if (!Array.isArray(raw)) return [];
  const out: DataTableColumnSpec[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      if (item) out.push({ id: item });
      continue;
    }
    if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string') {
      const id = (item as Record<string, unknown>).id as string;
      const labelRaw = (item as Record<string, unknown>).label;
      const label = typeof labelRaw === 'string' && labelRaw.trim() ? labelRaw.trim() : undefined;
      out.push(label ? { id, label } : { id });
    }
  }
  return out;
}

const RELATIONSHIP_DIRECTION_MAP: Record<string, string> = { source: 'outgoing', target: 'incoming' };

/** Acepta el shape nuevo (`lifecycle_states`, `relationship_directions`, snake_case genérico) y
 * el legacy (`lifecycleStates`, `relationshipDirections` con valores `source`/`target`). */
function normalizeFilters(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {};
  const src = raw as Record<string, unknown>;
  const result: Record<string, string[]> = {};

  const setIfNonEmpty = (key: string, values: unknown, mapValue?: (v: string) => string) => {
    if (!Array.isArray(values)) return;
    const strings = values
      .filter((v): v is string => typeof v === 'string')
      .map((v) => mapValue?.(v) ?? v);
    if (strings.length) result[key] = strings;
  };

  setIfNonEmpty('lifecycle_states', src.lifecycleStates);
  setIfNonEmpty('relationship_directions', src.relationshipDirections, (v) => RELATIONSHIP_DIRECTION_MAP[v] ?? v);

  for (const [key, value] of Object.entries(src)) {
    if (key === 'lifecycleStates' || key === 'relationshipDirections') continue;
    setIfNonEmpty(key, value);
  }

  return result;
}

/** Lee el snapshot tolerando `captured_at` (nuevo) y `capturedAt` (legacy). `null` si el nodo
 * nunca resolvió nada (recién insertado) o el shape es inválido. */
export function readDataTableSnapshot(el: AnyDataTableElement): DataTableSnapshot | null {
  const raw = el.snapshot;
  if (!raw || typeof raw !== 'object') return null;
  const snap = raw as Record<string, unknown>;
  const headers = Array.isArray(snap.headers) ? (snap.headers as string[]) : null;
  const rows = Array.isArray(snap.rows) ? (snap.rows as string[][]) : null;
  if (!headers || !rows) return null;
  const captured_at =
    typeof snap.captured_at === 'string'
      ? snap.captured_at
      : typeof snap.capturedAt === 'string'
        ? snap.capturedAt
        : new Date(0).toISOString();
  return { headers, rows, captured_at };
}

/** Traduce cualquier generación del nodo al shape normalizado. Nunca lanza. */
export function normalizeDataTableNode(el: AnyDataTableElement): NormalizedDataTableNode {
  const source = typeof el.source === 'string' ? el.source : '';

  const nodeIdRaw = el.node_id;
  const node_id = typeof nodeIdRaw === 'string' && nodeIdRaw.trim() ? nodeIdRaw : null;

  let limit: number | null = null;
  if (typeof el.limit === 'number' && Number.isFinite(el.limit)) {
    const truncated = Math.trunc(el.limit);
    limit = truncated >= 1 ? truncated : null;
  }

  const title = typeof el.title === 'string' && el.title.trim() ? el.title.trim() : null;

  return {
    node_id,
    source,
    scope: { kind: 'current' },
    columns: normalizeColumns(el.columns),
    filters: normalizeFilters(el.filters),
    limit,
    title,
    refresh_on_approval: el.refresh_on_approval === true,
    snapshot: readDataTableSnapshot(el),
  };
}

/** Arma la entrada `tables[i]` del request de `/resolve`. `opts.labelFor` inyecta el label i18n
 * local para columnas sin rename del usuario — nunca se persiste al nodo, solo viaja en el
 * request (ver `data-table-catalog-labels.ts`). */
export function buildResolveTable(
  n: NormalizedDataTableNode,
  opts: { labelFor?: (columnId: string) => string | undefined } = {},
): DataTableResolveTableRequest {
  return {
    node_id: n.node_id,
    source: n.source,
    scope: n.scope,
    columns: n.columns.map((c) => {
      const label = c.label ?? opts.labelFor?.(c.id);
      return label ? { id: c.id, label } : { id: c.id };
    }),
    filters: Object.keys(n.filters).length ? n.filters : undefined,
    limit: n.limit,
    title: n.title,
  };
}

/** Devuelve los campos a persistir en el nodo Plate (setNodes / pre-save). `snapshot` es
 * explícito para no confundir "no tocar el snapshot" con "borrarlo" — pasar siempre el valor
 * final (el nuevo si /resolve dio `ok`, o `n.snapshot` sin cambios si falló o no corrió). */
export function toPersistedDataTableNode(
  n: NormalizedDataTableNode,
  snapshot: DataTableSnapshot | null,
): Partial<DataTableElement> {
  return {
    node_id: n.node_id ?? undefined,
    source: n.source,
    scope: n.scope,
    columns: n.columns,
    filters: Object.keys(n.filters).length ? n.filters : null,
    limit: n.limit,
    title: n.title,
    refresh_on_approval: n.refresh_on_approval,
    snapshot,
  };
}

export function newDataTableNodeId(): string {
  return crypto.randomUUID();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** FNV-1a de 32 bits, suficiente para deduplicar/indexar — no es criptográfico. */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/** Hash estable de una lista de requests de `/resolve` — excluye `node_id` a propósito: dos
 * tablas con config idéntica deben colapsar en una sola entrada del batch. Insensible al orden
 * de las claves de cada objeto (ver `stableStringify`), sensible al orden del array. */
export function dataTableSpecHash(tables: DataTableResolveTableRequest[]): string {
  const withoutNodeId = tables.map((table) => {
    const rest: Record<string, unknown> = { ...table };
    delete rest.node_id;
    return rest;
  });
  return fnv1a(stableStringify(withoutNodeId));
}
