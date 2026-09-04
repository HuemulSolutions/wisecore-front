import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useMyWorkApproved } from '@/hooks/useMyWorkApproved';
import { advanceExecutionLifecycle } from '@/services/executions';
import { HomeWorkGroupCard, type HomeWorkGroupAccent } from './home-work-group-card';
import { HomeApprovedRow } from './home-approved-row';
import { HomeEmptyState } from './home-empty-state';
import type { HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

const APPROVED_ACCENT: HomeWorkGroupAccent = {
  headerBg: 'bg-[#f6fdfa]',
  headerBorder: 'border-[#e2f2ea]',
  accentText: 'text-[#059669]',
  pillBg: 'bg-[#d9f5e8]',
};

const VISIBLE_ROWS = 3;

export interface HomeMyWorkTabProps {
  organizationId: string;
  canListExecutions: boolean;
  canTransitionAsset: boolean;
  /** `firstTime` mientras el checklist de onboarding no esté completo; `noPending` si la organización ya opera pero el usuario no tiene nada propio. Decide `home.tsx`, que es quien conoce el estado del checklist. */
  emptyVariant: 'firstTime' | 'noPending';
  onViewApprovedInAllAssets: () => void;
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
}: HomeMyWorkTabProps) {
  const { t } = useTranslation('home');
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [bulkState, setBulkState] = useState<{ done: number; total: number } | null>(null);

  // Misma fuente que consume `home.tsx` para decidir `isFirstTimeState` y
  // pintar el header — mismos parámetros de `useAllExecutions` por debajo,
  // así que comparten `queryKey`/cache y no se duplica ninguna request.
  const { rows: allRows, visibleRows, hasNext, count, isEmpty, isLoading, isFetching, error, refetch } = useMyWorkApproved(
    organizationId,
    canListExecutions && !!organizationId,
  );

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
        isLoading={isLoading || (isFetching && allRows.length === 0)}
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
