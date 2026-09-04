import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useQueryClient } from '@tanstack/react-query';
import { advanceExecutionLifecycle } from '@/services/executions';
import { HomeWorkGroupCard, type HomeWorkGroupAccent } from './home-work-group-card';
import { HomeApprovedRow } from './home-approved-row';
import { HomeEmptyState } from './home-empty-state';
import type { Execution } from '@/types/execution';
import type { HomeWorkGroupCount, HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

const APPROVED_ACCENT: HomeWorkGroupAccent = {
  headerBg: 'bg-[#f6fdfa]',
  headerBorder: 'border-[#e2f2ea]',
  accentText: 'text-[#059669]',
  pillBg: 'bg-[#d9f5e8]',
};

/** Cuántas filas se traen por debajo (acotado) para aproximar un conteo sin `total` en la respuesta (spec Punto 2). */
const BOUNDED_PAGE_SIZE = 50;
const VISIBLE_ROWS = 3;

function toWorkGroupRow(execution: Execution): HomeWorkGroupRowData {
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

export interface HomeMyWorkTabSummary {
  count: HomeWorkGroupCount | null;
  isEmpty: boolean;
  /** Cuántas de las filas ya traídas publican dentro de 7 días — `null` si el conteo del grupo es indeterminado (no se puede afirmar "M vencen esta semana" sobre un total que no se conoce del todo). */
  dueSoonCount: number | null;
}

const DUE_SOON_DAYS = 7;

export interface HomeMyWorkTabProps {
  organizationId: string;
  canListExecutions: boolean;
  canTransitionAsset: boolean;
  /** `firstTime` mientras el checklist de onboarding no esté completo; `noPending` si la organización ya opera pero el usuario no tiene nada propio. Decide `home.tsx`, que es quien conoce el estado del checklist. */
  emptyVariant: 'firstTime' | 'noPending';
  onViewApprovedInAllAssets: () => void;
  onSummaryChange: (summary: HomeMyWorkTabSummary) => void;
}

/**
 * Pestaña "Mi trabajo". Hoy solo monta el grupo "Aprobados, listos para
 * publicar" con datos reales — los otros 3 grupos del diseño (revisión,
 * aprobación, menciones) dependen de los Puntos 1 y 5 de
 * `respuestas/spec-home-mi-trabajo-backend.md` y quedan sin renderizar hasta
 * que ese backend entregue: activarlos es agregar su query y su
 * `HomeWorkGroupCard`, reusando el mismo componente genérico.
 */
export function HomeMyWorkTab({
  organizationId,
  canListExecutions,
  canTransitionAsset,
  emptyVariant,
  onViewApprovedInAllAssets,
  onSummaryChange,
}: HomeMyWorkTabProps) {
  const { t } = useTranslation('home');
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [bulkState, setBulkState] = useState<{ done: number; total: number } | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useAllExecutions(organizationId, {
    enabled: canListExecutions && !!organizationId,
    owner_scope: 'me',
    lifecycle_state: 'approved',
    pageSize: BOUNDED_PAGE_SIZE,
    sort: 'estimated_publication_date_asc',
  });

  const allRows = (data?.data ?? []).map(toWorkGroupRow);
  const visibleRows = allRows.slice(0, VISIBLE_ROWS);
  const hasNext = data?.has_next ?? false;
  // Conteo interino (nunca exacto si `hasNext`) — ver spec Punto 2, `HomeWorkGroupCount`.
  const count: HomeWorkGroupCount | null = data ? { exact: !hasNext, value: allRows.length } : null;
  const isEmpty = !isLoading && !error && allRows.length === 0;

  // Solo se afirma "M vencen esta semana" cuando el conteo del grupo es
  // exacto — sobre un "50+" indeterminado no se puede asegurar cuántas de
  // las que no se llegaron a traer vencen esta semana.
  const dueSoonCount = count?.exact
    ? allRows.filter((r) => {
        if (r.temporalKind !== 'estimatedPublicationDate' || !r.temporalDate) return false;
        const days = (new Date(r.temporalDate).getTime() - Date.now()) / 86_400_000;
        return days >= 0 && days <= DUE_SOON_DAYS;
      }).length
    : null;

  useEffect(() => {
    onSummaryChange({ count, isEmpty, dueSoonCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count?.exact, count?.value, isEmpty, dueSoonCount]);

  // Limpia el fade-out de una fila en cuanto el refetch (disparado por
  // `extraRefreshKeys` de `useLifecycleActions` al publicar) la saca de
  // `allRows` — no hace falta un setTimeout manual, el propio dato ya
  // resuelve cuándo la fila deja de existir.
  useEffect(() => {
    setExitingIds((prev) => {
      const stillPresent = new Set([...prev].filter((id) => allRows.some((r) => r.id === id)));
      return stillPresent.size === prev.size ? prev : stillPresent;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows.map((r) => r.id).join(',')]);

  const handleOpen = useCallback(
    (row: HomeWorkGroupRowData) => {
      const url = `${window.location.origin}/${organizationId}/asset/${row.documentId}?execution=${row.id}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [organizationId],
  );

  // Spec Punto 8 (semántica de "deshacer" una transición) sigue "a confirmar"
  // con backend — un botón Deshacer que no revierte de verdad sería peor que
  // no tenerlo, así que el toast queda sin acción hasta que se resuelva.
  const handlePublished = useCallback(
    (rowId: string) => {
      setExitingIds((prev) => new Set(prev).add(rowId));
      toast.success(t('workGroups.common.undoUnavailable'));
    },
    [t],
  );

  const handleBulkPublish = useCallback(async () => {
    const rows = allRows;
    setBulkState({ done: 0, total: rows.length });
    let failed = 0;
    for (const row of rows) {
      try {
        await advanceExecutionLifecycle(row.id, organizationId, {});
      } catch {
        failed += 1;
      }
      setBulkState((s) => (s ? { ...s, done: s.done + 1 } : s));
    }
    setBulkState(null);
    if (failed === 0) {
      toast.success(t('workGroups.approved.bulkPublishSuccess', { count: rows.length }));
    } else {
      toast.warning(t('workGroups.approved.bulkPublishPartial', { done: rows.length - failed, total: rows.length }));
    }
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ['document-statistics'] });
  }, [allRows, organizationId, refetch, queryClient, t]);

  if (isEmpty) {
    return <HomeEmptyState variant={emptyVariant} onViewAllAssets={emptyVariant === 'noPending' ? onViewApprovedInAllAssets : undefined} />;
  }

  const remaining = allRows.length - VISIBLE_ROWS;
  const footer =
    allRows.length > VISIBLE_ROWS
      ? hasNext
        ? { label: t('workGroups.common.viewAll'), onClick: onViewApprovedInAllAssets }
        : { label: t('workGroups.common.viewRemaining', { count: remaining }), onClick: onViewApprovedInAllAssets }
      : undefined;

  const bulkAction =
    count?.exact && allRows.length > 0 && canTransitionAsset
      ? {
          label: bulkState
            ? t('workGroups.approved.bulkPublishing', { done: bulkState.done, total: bulkState.total })
            : t('workGroups.approved.bulkPublish', { count: allRows.length }),
          onClick: () => void handleBulkPublish(),
          loading: !!bulkState,
        }
      : undefined;

  // `flex flex-col gap-3.5` ya anticipa los 3 grupos que se sumarán acá
  // cuando el spec de backend entregue — hoy solo hay un `HomeWorkGroupCard`.
  return (
    <div className="flex flex-col gap-3.5">
      <HomeWorkGroupCard
        accent={APPROVED_ACCENT}
        title={t('workGroups.approved.title')}
        meta={t('workGroups.approved.meta')}
        count={count}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        rows={visibleRows}
        isLoading={isLoading || (isFetching && !data)}
        error={error}
        onRetry={() => refetch()}
        footer={footer}
        bulkAction={bulkAction}
        renderRow={(row) => (
          <HomeApprovedRow
            key={row.id}
            row={row}
            organizationId={organizationId}
            canTransition={canTransitionAsset}
            onOpen={() => handleOpen(row)}
            isExiting={exitingIds.has(row.id)}
            onPublished={handlePublished}
          />
        )}
      />
    </div>
  );
}
