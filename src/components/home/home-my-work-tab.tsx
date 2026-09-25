import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useMyWork, type UseMyWorkGroupResult } from '@/hooks/useMyWork';
import { lifecycleStateSectionTone } from '@/lib/lifecycle-colors';
import { HomeWorkGroupCard } from './home-work-group-card';
import { HomeWorkGroupRow } from './home-work-group-row';
import { HomeApprovedRow } from './home-approved-row';
import { HomeEmptyState } from './home-empty-state';
import type { HomeWorkGroupRow as HomeWorkGroupRowData } from '@/types/home';

// Tono derivado de la fuente única de color de estado (`lifecycle-colors.ts`)
// — antes eran 3 objetos con hex propios y "Aprobados" quedaba verde
// (`#059669`), colisionando con `published`. `approved` es `teal`.
const REVIEW_ACCENT = lifecycleStateSectionTone('in_review');
const APPROVAL_ACCENT = lifecycleStateSectionTone('in_approval');
const APPROVED_ACCENT = lifecycleStateSectionTone('approved');

const VISIBLE_ROWS = 2;

type WorkGroupKind = 'review' | 'approval' | 'approved';

export interface HomeMyWorkTabProps {
  organizationId: string;
  canListExecutions: boolean;
  canTransitionAsset: boolean;
  /** `firstTime` mientras el checklist de onboarding no esté completo; `noPending` si la organización ya opera pero el usuario no tiene nada propio. Decide `home.tsx`, que es quien conoce el estado del checklist. */
  emptyVariant: 'firstTime' | 'noPending';
  /** Pie "Ver las N restantes" de un grupo puntual — salta a "Todos los activos" ya filtrado por ese grupo. */
  onViewGroupInAllAssets: (group: WorkGroupKind) => void;
  /** CTA del estado vacío "noPending" — salta a "Todos los activos" sin filtro. */
  onViewAllAssets: () => void;
}

/**
 * Pestaña "Mi trabajo": los 3 grupos reales — "Esperando tu revisión",
 * "Esperan tu aprobación" y "Aprobados, listos para publicar" — alimentados
 * por `useMyWork` (spec Puntos 1, 2 y 6 de
 * respuestas/spec-home-mi-trabajo-backend.md, ya entregados). El cuarto grupo
 * del diseño ("Comentarios que te mencionan") sigue sin backend (Punto 5) y
 * no se monta.
 *
 * Las filas de revisión/aprobación no llevan botones de acción inline: el
 * backend entregó `lifecycle_permissions` por fila pero no `lifecycle_status`
 * (`can_advance`/`can_rollback`/`advance_blockers`), que es lo que
 * `resolveLifecycleActionsVisibility` necesita para decidir qué botón pintar
 * — quedan navegables. Solo "Aprobados" tiene botón real (`HomeApprovedRow`,
 * que resuelve su propio `lifecycle_status` con un `GET
 * /documents/{id}/content` acotado a 3 filas). Ver pedido de seguimiento en
 * `respuestas/spec-home-lifecycle-status-por-fila.md`.
 */
export function HomeMyWorkTab({
  organizationId,
  canListExecutions,
  canTransitionAsset,
  emptyVariant,
  onViewGroupInAllAssets,
  onViewAllAssets,
}: HomeMyWorkTabProps) {
  const { t } = useTranslation('home');
  const [collapsedReview, setCollapsedReview] = useState(false);
  const [collapsedApproval, setCollapsedApproval] = useState(false);
  const [collapsedApproved, setCollapsedApproved] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  // Misma fuente que consume `home.tsx` para decidir `isFirstTimeState` y
  // pintar el header — mismos parámetros de `useAllExecutions` por debajo,
  // así que comparten `queryKey`/cache y no se duplica ninguna request.
  const myWork = useMyWork(organizationId, canListExecutions && !!organizationId);
  const { review, approval, approved, isEmpty } = myWork;

  // Limpia el fade-out de una fila en cuanto el refetch (disparado por
  // `extraRefreshKeys` de `useLifecycleActions` al publicar) la saca de
  // `approved.rows` — no hace falta un setTimeout manual, el propio dato ya
  // resuelve cuándo la fila deja de existir.
  useEffect(() => {
    setExitingIds((prev) => {
      const stillPresent = new Set([...prev].filter((id) => approved.rows.some((r) => r.id === id)));
      return stillPresent.size === prev.size ? prev : stillPresent;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved.rows.map((r) => r.id).join(',')]);

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

  if (isEmpty) {
    return <HomeEmptyState variant={emptyVariant} onViewAllAssets={emptyVariant === 'noPending' ? onViewAllAssets : undefined} />;
  }

  function footerFor(group: WorkGroupKind, result: UseMyWorkGroupResult) {
    if (!result.count || result.count.value <= VISIBLE_ROWS) return undefined;
    const remaining = result.count.value - VISIBLE_ROWS;
    return { label: t('workGroups.common.viewRemaining', { count: remaining }), onClick: () => onViewGroupInAllAssets(group) };
  }

  return (
    <div className="flex flex-col gap-3.5">
      <HomeWorkGroupCard
        accent={REVIEW_ACCENT}
        title={t('workGroups.review.title')}
        meta={t('workGroups.review.meta')}
        count={review.count}
        collapsed={collapsedReview}
        onToggleCollapse={() => setCollapsedReview((c) => !c)}
        rows={review.rows}
        isLoading={review.isLoading || (review.isFetching && review.rows.length === 0)}
        error={review.error}
        onRetry={() => review.refetch()}
        footer={footerFor('review', review)}
        emptyCollapsedLabel={t('workGroups.review.empty')}
        renderRow={(row) => <HomeWorkGroupRow key={row.id} row={row} onOpen={() => handleOpen(row)} />}
      />
      <HomeWorkGroupCard
        accent={APPROVAL_ACCENT}
        title={t('workGroups.approval.title')}
        meta={t('workGroups.approval.meta')}
        count={approval.count}
        collapsed={collapsedApproval}
        onToggleCollapse={() => setCollapsedApproval((c) => !c)}
        rows={approval.rows}
        isLoading={approval.isLoading || (approval.isFetching && approval.rows.length === 0)}
        error={approval.error}
        onRetry={() => approval.refetch()}
        footer={footerFor('approval', approval)}
        emptyCollapsedLabel={t('workGroups.approval.empty')}
        renderRow={(row) => <HomeWorkGroupRow key={row.id} row={row} onOpen={() => handleOpen(row)} />}
      />
      <HomeWorkGroupCard
        accent={APPROVED_ACCENT}
        title={t('workGroups.approved.title')}
        meta={t('workGroups.approved.meta')}
        count={approved.count}
        collapsed={collapsedApproved}
        onToggleCollapse={() => setCollapsedApproved((c) => !c)}
        rows={approved.rows}
        isLoading={approved.isLoading || (approved.isFetching && approved.rows.length === 0)}
        error={approved.error}
        onRetry={() => approved.refetch()}
        footer={footerFor('approved', approved)}
        emptyCollapsedLabel={t('workGroups.approved.empty')}
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
