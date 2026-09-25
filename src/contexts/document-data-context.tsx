import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { logger } from '@/lib/logger';
import { resolveDataTables } from '@/services/data-tables';
import { dataTableQueryKeys } from '@/hooks/useDataTables';
import { labelForColumnId } from '@/lib/data-table-catalog-labels';
import {
  buildResolveTable,
  dataTableSpecHash,
  normalizeDataTableNode,
  type AnyDataTableElement,
} from '@/lib/data-table-node-utils';
import type { DataTableElement, DataTableSnapshot } from '@/types/data-table-node';
import type { DataTableResolveTableRequest, DataTableResolvedTable } from '@/types/data-table-resolve';

/**
 * Resuelve el nodo `data_table` contra `POST /documents/{id}/data-tables/resolve` (batch,
 * server-side) en vez de armar headers/filas en el frontend. Cada instancia del nodo se
 * *registra* acá con su config ya normalizada; un debounce corto junta todos los registros
 * montados en un único request. No se recolectan los nodos desde `plate_content` guardado
 * porque el usuario puede estar reconfigurando/insertando uno que todavía no está ahí — la
 * única fuente de verdad consistente es lo que hay montado en el editor en cada momento.
 *
 * El preview del sheet de configuración (`data-table-config-sheet.tsx`) NO se registra acá:
 * usa `useDataTablePreview`, una query propia debounceada, para que cada tecleo no invalide
 * el batch entero del documento.
 */

const FLUSH_DEBOUNCE_MS = 150;

interface DataTableRegistryContextValue {
  documentId: string | null;
  organizationId: string | null;
  executionId: string | null;
  /** Registra una tabla en el batch (por refcount). Devuelve el unregister. */
  register: (key: string, table: DataTableResolveTableRequest) => () => void;
  results: Map<string, DataTableResolvedTable>;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  /** `null` si no hay documento (editor de plantillas) — nunca llama a la red en ese caso. */
  resolveBatch: ((tables: DataTableResolveTableRequest[]) => Promise<DataTableResolvedTable[]>) | null;
}

const noop = () => {};

const DocumentDataContext = createContext<DataTableRegistryContextValue>({
  documentId: null,
  organizationId: null,
  executionId: null,
  register: () => noop,
  results: new Map(),
  isPending: false,
  isFetching: false,
  isError: false,
  resolveBatch: null,
});

export function DocumentDataProvider({
  documentId,
  organizationId,
  executionId,
  children,
}: {
  documentId: string | null | undefined;
  organizationId: string | null | undefined;
  /** `null`/`undefined` = execution por defecto del documento (la aprobada, o la más reciente). */
  executionId?: string | null;
  children: React.ReactNode;
}) {
  const resolvedDocumentId = documentId ?? null;
  const resolvedOrganizationId = organizationId ?? null;
  const resolvedExecutionId = executionId ?? null;

  const registryRef = useRef(new Map<string, { table: DataTableResolveTableRequest; refCount: number }>());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [specs, setSpecs] = useState<{ key: string; table: DataTableResolveTableRequest }[]>([]);

  const flush = useCallback(() => {
    flushTimerRef.current = null;
    // Orden estable por key — el orden de montaje/desmontaje de los nodos no debe afectar el hash.
    const next = Array.from(registryRef.current.entries())
      .map(([key, entry]) => ({ key, table: entry.table }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    setSpecs(next);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(flush, FLUSH_DEBOUNCE_MS);
  }, [flush]);

  useEffect(
    () => () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    },
    [],
  );

  const register = useCallback(
    (key: string, table: DataTableResolveTableRequest) => {
      const existing = registryRef.current.get(key);
      if (existing) {
        existing.refCount += 1;
      } else {
        registryRef.current.set(key, { table, refCount: 1 });
      }
      scheduleFlush();

      return () => {
        const entry = registryRef.current.get(key);
        if (!entry) return;
        entry.refCount -= 1;
        if (entry.refCount <= 0) registryRef.current.delete(key);
        scheduleFlush();
      };
    },
    [scheduleFlush],
  );

  const batchHash = useMemo(() => dataTableSpecHash(specs.map((s) => s.table)), [specs]);
  const enabled = !!resolvedDocumentId && !!resolvedOrganizationId && specs.length > 0;

  const query = useQuery({
    queryKey: dataTableQueryKeys.resolve(resolvedDocumentId ?? '', resolvedExecutionId, batchHash),
    queryFn: () =>
      resolveDataTables(resolvedDocumentId!, resolvedOrganizationId!, {
        execution_id: resolvedExecutionId,
        tables: specs.map((s) => s.table),
      }),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
    placeholderData: (prev) => prev,
  });

  const results = useMemo(() => {
    const map = new Map<string, DataTableResolvedTable>();
    const tables = query.data?.tables;
    if (!tables) return map;

    if (tables.length === specs.length) {
      specs.forEach((spec, i) => map.set(spec.key, tables[i]));
      return map;
    }

    // No debería pasar (el contrato garantiza mismo orden/largo) — fallback defensivo por node_id.
    logger.warn('[data-table] /resolve devolvió un largo distinto al pedido, matcheando por node_id', {
      requested: specs.length,
      received: tables.length,
    });
    const byNodeId = new Map(tables.filter((t) => t.node_id).map((t) => [t.node_id as string, t]));
    specs.forEach((spec) => {
      const nodeId = spec.table.node_id;
      const match = nodeId ? byNodeId.get(nodeId) : undefined;
      if (match) map.set(spec.key, match);
    });
    return map;
  }, [query.data, specs]);

  const resolveBatch = useCallback(
    async (tables: DataTableResolveTableRequest[]): Promise<DataTableResolvedTable[]> => {
      if (!resolvedDocumentId || !resolvedOrganizationId) return [];
      const result = await resolveDataTables(resolvedDocumentId, resolvedOrganizationId, {
        execution_id: resolvedExecutionId,
        tables,
      });
      return result.tables;
    },
    [resolvedDocumentId, resolvedOrganizationId, resolvedExecutionId],
  );

  const value = useMemo<DataTableRegistryContextValue>(
    () => ({
      documentId: resolvedDocumentId,
      organizationId: resolvedOrganizationId,
      executionId: resolvedExecutionId,
      register,
      results,
      isPending: enabled && query.isPending,
      isFetching: query.isFetching,
      isError: query.isError,
      resolveBatch: resolvedDocumentId ? resolveBatch : null,
    }),
    [
      resolvedDocumentId,
      resolvedOrganizationId,
      resolvedExecutionId,
      register,
      results,
      enabled,
      query.isPending,
      query.isFetching,
      query.isError,
      resolveBatch,
    ],
  );

  return <DocumentDataContext.Provider value={value}>{children}</DocumentDataContext.Provider>;
}

// ─── Estado resuelto para pintar el nodo ───────────────────────────────────────

export type DataTableRenderState =
  | 'ok'
  | 'loading'
  | 'empty'
  | 'no-context'
  | 'unavailable-source'
  | 'forbidden'
  | 'error';

export interface ResolvedDataTable {
  headers: string[];
  aligns: ('left' | 'right')[];
  rows: string[][];
  state: DataTableRenderState;
  /** Se está pintando el snapshot congelado (o el último resultado bueno) mientras llega,
   * falla, o no hay contexto para pedir el dato fresco. */
  isStale: boolean;
  totalRows: number;
  truncated: boolean;
  omittedColumns: string[];
  /** Texto del backend (ya en español) para `forbidden`/`error`. */
  message: string | null;
}

function emptyResolved(state: DataTableRenderState): ResolvedDataTable {
  return {
    headers: [],
    aligns: [],
    rows: [],
    state,
    isStale: false,
    totalRows: 0,
    truncated: false,
    omittedColumns: [],
    message: null,
  };
}

function fromSnapshot(snapshot: DataTableSnapshot): ResolvedDataTable {
  return {
    headers: snapshot.headers,
    aligns: snapshot.headers.map(() => 'left' as const),
    rows: snapshot.rows,
    state: snapshot.rows.length === 0 ? 'empty' : 'ok',
    isStale: true,
    totalRows: snapshot.rows.length,
    truncated: false,
    omittedColumns: [],
    message: null,
  };
}

function fromResolved(resolved: DataTableResolvedTable, isStale: boolean): ResolvedDataTable {
  const state: DataTableRenderState =
    resolved.status === 'ok'
      ? resolved.rows.length === 0
        ? 'empty'
        : 'ok'
      : resolved.status === 'unavailable_source'
        ? 'unavailable-source'
        : resolved.status === 'forbidden'
          ? 'forbidden'
          : 'error';

  return {
    headers: resolved.headers,
    aligns: resolved.aligns,
    rows: resolved.rows,
    state,
    isStale,
    totalRows: resolved.total_rows,
    truncated: resolved.truncated,
    omittedColumns: resolved.omitted_columns,
    message: resolved.message,
  };
}

/** Resuelve un nodo `data_table` insertado en el documento — se registra en el batch del
 * `DocumentDataProvider` más cercano. Fuera de un documento (editor de plantillas, campo
 * richtext de formulario) cae directo al snapshot, sin llamar a la red. */
export function useResolvedDataTable(element: DataTableElement): ResolvedDataTable {
  const { t } = useTranslation(['editor', 'assets']);
  const { documentId, register, results, isFetching, isError } = useContext(DocumentDataContext);

  const normalized = useMemo(() => normalizeDataTableNode(element as AnyDataTableElement), [element]);
  const requestTable = useMemo(
    () => buildResolveTable(normalized, { labelFor: (id) => labelForColumnId(t, id) }),
    [normalized, t],
  );
  const key = useMemo(() => dataTableSpecHash([requestTable]), [requestTable]);

  useEffect(() => {
    if (!documentId) return undefined;
    return register(key, requestTable);
    // `requestTable` se omite a propósito: su contenido está representado por `key` (el hash
    // lo incluye entero salvo `node_id`), así que un cambio real de contenido siempre cambia
    // `key` y dispara el efecto. Incluirlo generaría un unregister/register de más en cada
    // render donde Slate reconstruye el objeto del nodo sin cambiar su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, key, register]);

  return useMemo(() => {
    const snapshot = normalized.snapshot;

    if (!documentId) {
      return snapshot ? fromSnapshot(snapshot) : emptyResolved('no-context');
    }

    const resolved = results.get(key);
    if (resolved) return fromResolved(resolved, isFetching);

    if (isError) return snapshot ? fromSnapshot(snapshot) : emptyResolved('error');
    if (snapshot) return fromSnapshot(snapshot);
    return emptyResolved('loading');
  }, [documentId, results, key, isFetching, isError, normalized.snapshot]);
}

/** Preview de una sola tabla para `DataTableConfigSheet` — query propia, debounceada, que NO
 * se une al batch del documento (cada tecleo del usuario no debe invalidar las demás tablas). */
export function useDataTablePreview(element: DataTableElement): ResolvedDataTable {
  const { t } = useTranslation(['editor', 'assets']);
  const { documentId, organizationId, executionId } = useContext(DocumentDataContext);

  const normalized = useMemo(() => normalizeDataTableNode(element as AnyDataTableElement), [element]);
  const requestTable = useMemo(
    () => buildResolveTable(normalized, { labelFor: (id) => labelForColumnId(t, id) }),
    [normalized, t],
  );

  const [debounced, setDebounced] = useState(requestTable);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(requestTable), 400);
    return () => clearTimeout(timer);
  }, [requestTable]);

  const specHash = useMemo(() => dataTableSpecHash([debounced]), [debounced]);
  const enabled = !!documentId && !!organizationId && normalized.source.length > 0 && normalized.columns.length > 0;

  const query = useQuery({
    queryKey: dataTableQueryKeys.preview(documentId, executionId, specHash),
    queryFn: async () => {
      const result = await resolveDataTables(documentId!, organizationId!, {
        execution_id: executionId,
        tables: [debounced],
      });
      return result.tables[0] ?? null;
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
    placeholderData: (prev) => prev,
  });

  return useMemo(() => {
    const snapshot = normalized.snapshot;
    if (!documentId) return snapshot ? fromSnapshot(snapshot) : emptyResolved('no-context');
    if (!enabled) return emptyResolved('empty');
    if (query.data) return fromResolved(query.data, query.isFetching);
    if (query.isError) return emptyResolved('error');
    return emptyResolved('loading');
  }, [documentId, enabled, query.data, query.isError, query.isFetching, normalized.snapshot]);
}

/** Resolver de batch para congelar snapshots antes de guardar (`ensureDataTableSnapshots`).
 * `null` cuando no hay documento — el pre-save lo saltea sin tocar la red. Llama directo al
 * servicio (no pasa por `queryClient`): al guardar se quiere el dato más fresco posible, sin
 * contaminar la caché del batch en pantalla. */
export function useDataTableBatchResolver() {
  const { resolveBatch } = useContext(DocumentDataContext);
  return resolveBatch;
}
