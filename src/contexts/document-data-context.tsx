import { createContext, useContext, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { getDataTableSource } from '@/lib/data-table-sources';
import type { DataTableContext as DataTableSourceContext, DataTableDocumentContent } from '@/lib/data-table-sources';
import type { DataTableElement, DataTableExecutionRow } from '@/types/data-table-node';
import type { ExecutionRelationshipWithDetails } from '@/types/execution-relationships';

interface DocumentDataContextValue {
  documentContent: DataTableDocumentContent | null | undefined;
  executions: DataTableExecutionRow[] | null | undefined;
  relationships: ExecutionRelationshipWithDetails[] | null | undefined;
  documentTypeNames: Map<string, string> | null | undefined;
  /** false hasta que el documento actual terminó de cargar — antes de eso el nodo debe caer
   * al snapshot congelado (mismo criterio que `MentionRefsProvider.isLoaded`). */
  isLoaded: boolean;
}

const DocumentDataContext = createContext<DocumentDataContextValue>({
  documentContent: null,
  executions: null,
  relationships: null,
  documentTypeNames: null,
  isLoaded: false,
});

/**
 * Expone al nodo `data_table` los datos del documento actual que `assets-content.tsx` ya
 * tiene en memoria (no hace fetch propio — mismo patrón que `MentionRefsProvider` en
 * `mention-refs-context.tsx`, pero sin batch: acá los datos ya están resueltos).
 */
export function DocumentDataProvider({
  documentContent,
  executions,
  relationships,
  documentTypeNames,
  isLoaded,
  children,
}: {
  documentContent: DataTableDocumentContent | null | undefined;
  executions: DataTableExecutionRow[] | null | undefined;
  relationships?: ExecutionRelationshipWithDetails[] | null | undefined;
  documentTypeNames?: Map<string, string> | null | undefined;
  isLoaded: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ documentContent, executions, relationships: relationships ?? null, documentTypeNames: documentTypeNames ?? null, isLoaded }),
    [documentContent, executions, relationships, documentTypeNames, isLoaded],
  );
  return <DocumentDataContext.Provider value={value}>{children}</DocumentDataContext.Provider>;
}

interface ResolvedTable {
  headers: string[];
  rows: string[][];
}

/** Resuelve columnas + filas para un nodo, ya sea para pintarlo en pantalla o para
 * congelar el snapshot antes de guardar. `null` cuando la fuente no existe en el catálogo
 * (ej. quedó de una versión anterior del nodo) o la fuente `keyValue` no tiene datos. */
function resolveTable(element: DataTableElement, ctx: DataTableSourceContext): ResolvedTable | null {
  const source = getDataTableSource(element.source);
  if (!source) return null;

  const columnIds = element.columns.length ? element.columns : source.defaultColumns;
  const fields = columnIds
    .map((id) => source.fields.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => !!f);

  if (source.layout === 'keyValue') {
    const row = source.getRows(ctx)[0];
    if (!row) return null;
    return {
      headers: [ctx.t('dataTable.fields.nameCol'), ctx.t('dataTable.fields.valueCol')],
      rows: fields.map((f) => [ctx.t(f.labelKey), f.accessor(row, ctx)]),
    };
  }

  let rows = source.getRows(ctx);
  rows = source.applyFilters?.(rows, element.filters) ?? rows;
  if (element.limit) rows = rows.slice(0, element.limit);

  return {
    headers: fields.map((f) => ctx.t(f.labelKey)),
    rows: rows.map((row) => fields.map((f) => f.accessor(row, ctx))),
  };
}

export interface ResolvedDataTable extends ResolvedTable {
  /** Sigue cargando el documento actual — mostrar el snapshot (si hay) en su lugar. */
  isLoading: boolean;
  isEmpty: boolean;
  /** La fuente configurada en el nodo ya no existe en el catálogo. */
  isUnavailable: boolean;
}

/** Resuelve un nodo `data_table` contra los datos frescos del documento, con fallback al
 * snapshot congelado del propio nodo mientras el documento no terminó de cargar. */
export function useResolvedDataTable(element: DataTableElement): ResolvedDataTable {
  const { documentContent, executions, relationships, documentTypeNames, isLoaded } = useContext(DocumentDataContext);
  const { t } = useTranslation(['editor', 'assets']);

  return useMemo(() => {
    if (!getDataTableSource(element.source)) {
      return { headers: [], rows: [], isLoading: false, isEmpty: true, isUnavailable: true };
    }

    if (!isLoaded) {
      return element.snapshot
        ? { headers: element.snapshot.headers, rows: element.snapshot.rows, isLoading: true, isEmpty: false, isUnavailable: false }
        : { headers: [], rows: [], isLoading: true, isEmpty: false, isUnavailable: false };
    }

    const resolved = resolveTable(element, { t, documentContent, executions, relationships, documentTypeNames });
    if (!resolved) return { headers: [], rows: [], isLoading: false, isEmpty: true, isUnavailable: false };
    return { ...resolved, isLoading: false, isEmpty: resolved.rows.length === 0, isUnavailable: false };
  }, [element, documentContent, executions, relationships, documentTypeNames, isLoaded, t]);
}

/** Devuelve el resolver puro que usa el pre-save (`ensureDataTableSnapshots`) para congelar
 * el snapshot de cada nodo justo antes de serializar a Markdown. `null` mientras el
 * documento no cargó — en ese caso el nodo conserva su snapshot anterior sin tocarlo. */
export function useDataTableSnapshotResolver() {
  const { documentContent, executions, relationships, documentTypeNames, isLoaded } = useContext(DocumentDataContext);
  const { t } = useTranslation(['editor', 'assets']);

  return useCallback(
    (element: DataTableElement) => {
      if (!isLoaded) return null;
      return resolveTable(element, { t, documentContent, executions, relationships, documentTypeNames });
    },
    [documentContent, executions, relationships, documentTypeNames, isLoaded, t],
  );
}
