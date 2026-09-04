import { useAllExecutions } from '@/hooks/useAllExecutions';
import type { Execution } from '@/types/execution';
import type { HomeWorkGroupCount, HomeWorkGroupRow } from '@/types/home';

/** Cuántas filas se traen por debajo (acotado) para aproximar un conteo sin `total` en la respuesta (spec Punto 2). */
const BOUNDED_PAGE_SIZE = 50;
const VISIBLE_ROWS = 3;
const DUE_SOON_DAYS = 7;

function toWorkGroupRow(execution: Execution): HomeWorkGroupRow {
  const versionLabel =
    execution.version_major !== null && execution.version_minor !== null && execution.version_patch !== null
      ? `v${execution.version_major}.${execution.version_minor}.${execution.version_patch}`
      : execution.name;
  return {
    id: execution.id,
    documentId: execution.document_id,
    documentName: execution.document_name,
    versionLabel,
    ownerName: execution.created_by_user_name,
    lifecycleState: execution.lifecycle_state,
    temporalDate: execution.estimated_publication_date ?? execution.updated_at,
    temporalKind: execution.estimated_publication_date ? 'estimatedPublicationDate' : 'sinceUpdated',
  };
}

export interface UseMyWorkApprovedResult {
  rows: HomeWorkGroupRow[];
  visibleRows: HomeWorkGroupRow[];
  hasNext: boolean;
  /** `null` mientras no se preguntó (query deshabilitada) — nunca se afirma un total sobre datos que no se pidieron. */
  count: HomeWorkGroupCount | null;
  /** `false` mientras no se preguntó — "no pregunté" nunca se lee como "vacío" (ver `enabled`). */
  isEmpty: boolean;
  /** Solo distinto de `null` cuando `count.exact` — sobre un conteo indeterminado no se puede afirmar cuántas vencen esta semana. */
  dueSoonCount: number | null;
  isLoading: boolean;
  isFetching: boolean;
  /**
   * `true` mientras la query todavía no resolvió para los parámetros
   * actuales — incluye `isLoading` y el caso `placeholderData` (datos de la
   * organización/consulta anterior servidos con `isLoading: false` mientras
   * llega la nueva). Gate para no leer `isEmpty`/`count` de un estado stale.
   */
  isResolving: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Fuente única del grupo "Aprobados, listos para publicar" de "Mi trabajo".
 * La consumen tanto `home.tsx` (para decidir `isFirstTimeState` y pintar el
 * header) como `HomeMyWorkTab` (para la card) — mismos parámetros de
 * `useAllExecutions`, mismo `queryKey`, así que comparten cache y no se
 * duplica ninguna request.
 */
export function useMyWorkApproved(organizationId: string, enabled: boolean): UseMyWorkApprovedResult {
  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } = useAllExecutions(organizationId, {
    enabled,
    owner_scope: 'me',
    lifecycle_state: 'approved',
    pageSize: BOUNDED_PAGE_SIZE,
    sort: 'estimated_publication_date_asc',
  });

  const rows = (data?.data ?? []).map(toWorkGroupRow);
  const visibleRows = rows.slice(0, VISIBLE_ROWS);
  const hasNext = data?.has_next ?? false;
  // Conteo interino (nunca exacto si `hasNext`) — ver spec Punto 2, `HomeWorkGroupCount`.
  const count: HomeWorkGroupCount | null = enabled && data ? { exact: !hasNext, value: rows.length } : null;
  const isEmpty = enabled && !isLoading && !error && rows.length === 0;

  const dueSoonCount = count?.exact
    ? rows.filter((r) => {
        if (r.temporalKind !== 'estimatedPublicationDate' || !r.temporalDate) return false;
        const days = (new Date(r.temporalDate).getTime() - Date.now()) / 86_400_000;
        return days >= 0 && days <= DUE_SOON_DAYS;
      }).length
    : null;

  return {
    rows,
    visibleRows,
    hasNext,
    count,
    isEmpty,
    dueSoonCount,
    isLoading,
    isFetching,
    isResolving: enabled && (isLoading || isPlaceholderData),
    error,
    refetch: () => void refetch(),
  };
}
