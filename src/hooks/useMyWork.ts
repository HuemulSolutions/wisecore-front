import { useAllExecutions } from '@/hooks/useAllExecutions';
import type { Execution } from '@/types/execution';
import type { HomeWorkGroupCount, HomeWorkGroupRow, HomeWorkGroupTemporalKind } from '@/types/home';

/**
 * Los 3 grupos reales de "Mi trabajo" — fuente única, consumida tanto por
 * `home.tsx` (header, `isFirstTimeState`) como por `HomeMyWorkTab` (las 3
 * cards). Mismos parámetros de `useAllExecutions` por grupo en ambos lados,
 * así que comparten `queryKey`/cache y no se duplica ninguna request.
 *
 * `pageSize: VISIBLE_ROWS` — con `total` exacto en el envelope (backend
 * entregado, ver respuestas/spec-home-mi-trabajo-backend.md Punto 2) no hace
 * falta sobre-traer filas para aproximar un conteo: se pide solo lo que se
 * muestra y el resto del total alimenta el link "Ver las N restantes".
 */
const VISIBLE_ROWS = 2;

function resolveTemporal(
  execution: Execution,
  preferredKind: 'estimatedPublicationDate' | 'sinceLifecycleState',
): { date: string | null; kind: HomeWorkGroupTemporalKind | null } {
  if (preferredKind === 'estimatedPublicationDate' && execution.estimated_publication_date) {
    return { date: execution.estimated_publication_date, kind: 'estimatedPublicationDate' };
  }
  if (execution.lifecycle_state_since) {
    return { date: execution.lifecycle_state_since, kind: 'sinceLifecycleState' };
  }
  // Fallback si el backend no rellenó `lifecycle_state_since` (no debería
  // pasar salvo backfill parcial) — impreciso a propósito, ver el tipo.
  return { date: execution.updated_at, kind: 'sinceUpdated' };
}

function toWorkGroupRow(
  execution: Execution,
  preferredKind: 'estimatedPublicationDate' | 'sinceLifecycleState',
): HomeWorkGroupRow {
  const versionLabel =
    execution.version_major !== null && execution.version_minor !== null && execution.version_patch !== null
      ? `v${execution.version_major}.${execution.version_minor}.${execution.version_patch}`
      : execution.name;
  const temporal = resolveTemporal(execution, preferredKind);
  return {
    id: execution.id,
    documentId: execution.document_id,
    documentName: execution.document_name,
    versionLabel,
    ownerName: execution.created_by_user_name,
    lifecycleState: execution.lifecycle_state,
    stepName: execution.current_lifecycle_step?.step_name ?? null,
    temporalDate: temporal.date,
    temporalKind: temporal.kind,
  };
}

export interface UseMyWorkGroupResult {
  rows: HomeWorkGroupRow[];
  /** `null` mientras no se preguntó (query deshabilitada) — nunca se afirma un total sobre datos que no se pidieron. */
  count: HomeWorkGroupCount | null;
  /** `false` mientras no se preguntó — "no pregunté" nunca se lee como "vacío" (ver `enabled`). */
  isEmpty: boolean;
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

function useMyWorkGroup(
  organizationId: string,
  enabled: boolean,
  params: Parameters<typeof useAllExecutions>[1],
  preferredKind: 'estimatedPublicationDate' | 'sinceLifecycleState',
): UseMyWorkGroupResult {
  const { data, isLoading, isFetching, isPlaceholderData, error, refetch } = useAllExecutions(organizationId, {
    enabled,
    pageSize: VISIBLE_ROWS,
    ...params,
  });

  const rows = (data?.data ?? []).map((e) => toWorkGroupRow(e, preferredKind));
  const total = data?.total;
  // `total` viene siempre en estos 3 grupos (nunca envían `query`) — el `??`
  // es solo por si el backend todavía no lo entregó para este endpoint puntual.
  const count: HomeWorkGroupCount | null =
    enabled && data ? { exact: total != null, value: total ?? rows.length } : null;
  const isEmpty = enabled && !isLoading && !error && rows.length === 0;

  return {
    rows,
    count,
    isEmpty,
    isLoading,
    isFetching,
    isResolving: enabled && (isLoading || isPlaceholderData),
    error,
    refetch: () => void refetch(),
  };
}

export interface UseMyWorkResult {
  review: UseMyWorkGroupResult;
  approval: UseMyWorkGroupResult;
  approved: UseMyWorkGroupResult;
  /** Los 3 grupos resolvieron y ninguno tiene filas. */
  isEmpty: boolean;
  /** Alguno de los 3 grupos todavía no resolvió para sus parámetros actuales. */
  isResolving: boolean;
  refetchAll: () => void;
}

/**
 * Fuente única de los 3 grupos reales de "Mi trabajo": "Esperando tu
 * revisión", "Esperan tu aprobación" y "Aprobados, listos para publicar".
 * El cuarto grupo del diseño ("Comentarios que te mencionan") no tiene
 * backend todavía (Punto 5 del spec) y no se expone acá.
 */
export function useMyWork(organizationId: string, enabled: boolean): UseMyWorkResult {
  const review = useMyWorkGroup(
    organizationId,
    enabled,
    { pending_my_action: 'review', sort: 'lifecycle_state_since_asc' },
    'sinceLifecycleState',
  );
  const approval = useMyWorkGroup(
    organizationId,
    enabled,
    { pending_my_action: 'approve', sort: 'lifecycle_state_since_asc' },
    'sinceLifecycleState',
  );
  const approved = useMyWorkGroup(
    organizationId,
    enabled,
    { owner_scope: 'me', lifecycle_state: 'approved', sort: 'estimated_publication_date_asc' },
    'estimatedPublicationDate',
  );

  const isResolving = review.isResolving || approval.isResolving || approved.isResolving;
  const isEmpty = !isResolving && review.isEmpty && approval.isEmpty && approved.isEmpty;

  return {
    review,
    approval,
    approved,
    isEmpty,
    isResolving,
    refetchAll: () => {
      review.refetch();
      approval.refetch();
      approved.refetch();
    },
  };
}
