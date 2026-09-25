import { useTranslation } from 'react-i18next';
import { Info, Search } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/huemul/constants';
import { HuemulTable } from '@/huemul/components/huemul-table';
import type { HuemulTableColumn } from '@/huemul/components/huemul-table';
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button';
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips';
import { HuemulFilterInline } from '@/huemul/components/huemul-filter-inline';
import { HuemulLifecycleBadge } from '@/huemul/components/huemul-lifecycle-badge';
import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied';
import { HuemulButton } from '@/huemul/components/huemul-button';
import type { HuemulFilterDef, HuemulFilterValue, HuemulFilterChip } from '@/types/huemul';
import type { Execution } from '@/types/execution';
import { formatRelativeTime, formatAbsoluteDate } from '@/lib/format-relative-time';
import { cn } from '@/lib/utils';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { HomeAvatar } from './home-avatar';
import { HomeCommentsPopover } from './home-comments-popover';
import { HOME_CARD } from './home-surface';

/** Aviso cuando `home.tsx` descartó un filtro incompatible (`pending_my_action` vs `query`). */
export type HomeFilterNotice =
  | { kind: 'droppedPending'; label: string }
  | { kind: 'droppedQuery'; label: string; query: string };

export interface HomeAllAssetsTabProps {
  organizationId: string;
  canListExecutions: boolean;
  canOpenAsset: boolean;
  filterDefs: HuemulFilterDef[];
  values: Record<string, HuemulFilterValue>;
  chips: HuemulFilterChip[];
  activeCount: number;
  onFilterChange: (key: string, value: HuemulFilterValue) => void;
  onChipRemove: (key: string) => void;
  onClearAll: () => void;
  onSelectedLabel: (key: string, label: string | undefined) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  data: Execution[];
  /** Conteo exacto de filas que matchean los filtros actuales. `null`/`undefined` cuando hay búsqueda de texto libre (`query`) activa — el backend no calcula un total exacto barato en ese caso; se omite el número en vez de mostrar `0` o el largo de la página. */
  total?: number | null;
  hasNext?: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  sort: string | null;
  onSortChange: (sort: string | null) => void;
  /** Aviso de filtro descartado — barra bajo los chips hasta que el usuario lo cierra. */
  notice?: HomeFilterNotice | null;
  onDismissNotice?: () => void;
  /** Usuario actual — la columna Propietario muestra "Tú" para sus propios activos. */
  currentUserId?: string;
  canCreateAsset?: boolean;
  onCreateAsset?: () => void;
  onUploadAsset?: () => void;
}

/**
 * Contenido de la pestaña "Todos los activos" — el Home original completo
 * (filtros inline + chips + tabla de ejecuciones) en una sola card: toolbar,
 * chips y aviso son franjas de la misma superficie que la tabla. El panel lateral de filtros vive en la columna
 * colapsable de `HuemulPageLayout` (en `home.tsx`), no acá — por eso el
 * estado de filtros llega como props en vez de construirse en este archivo.
 * Los 8 KPIs que antes vivían arriba de esta tabla ahora viven exclusivamente
 * en el Panorama del rail derecho.
 */
export function HomeAllAssetsTab({
  organizationId,
  canListExecutions,
  canOpenAsset,
  filterDefs,
  values,
  chips,
  activeCount,
  onFilterChange,
  onChipRemove,
  onClearAll,
  onSelectedLabel,
  filtersOpen,
  onFiltersOpenChange,
  data,
  total,
  hasNext,
  isLoading,
  isFetching,
  error,
  onRetry,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  sort,
  onSortChange,
  notice,
  onDismissNotice,
  currentUserId,
  canCreateAsset = false,
  onCreateAsset,
  onUploadAsset,
}: HomeAllAssetsTabProps) {
  const { t } = useTranslation('home');
  const { canList } = useUserPermissions();
  const canListDiscussions = canList('discussion');

  // Clic en la fila abre el activo — mismo patrón que el resto de las tablas
  // `variant="detailed"` del repo (users/roles/organizations/global-admin):
  // ninguna usa un menú de acciones por fila, todas abren/seleccionan al
  // clickear la fila entera.
  const handleOpenAsset = useCallback(
    (item: Execution) => {
      const url = `${window.location.origin}/${organizationId}/asset/${item.document_id}?execution=${item.id}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [organizationId],
  );

  const columns: HuemulTableColumn<Execution>[] = useMemo(
    () => [
      {
        key: 'documentName',
        label: t('executionsTable.columns.documentName'),
        sortKey: 'document_name',
        defaultWidth: 260,
        render: (item) => <span className="font-medium text-foreground">{item.document_name}</span>,
      },
      {
        key: 'unresolvedComments',
        label: t('executionsTable.columns.unresolvedComments'),
        sortKey: 'unresolved_comments_count',
        defaultWidth: 150,
        render: (item) =>
          item.unresolved_comments_count > 0 ? (
            // fuchsia, no violet: violet ya es `in_approval` en el badge de estado
            // de esta misma fila. Mismo hue que el KPI "Comentarios sin resolver"
            // del Panorama de home.
            <HomeCommentsPopover
              organizationId={organizationId}
              documentId={item.document_id}
              executionId={item.id}
              documentName={item.document_name}
              count={item.unresolved_comments_count}
              canList={canListDiscussions}
              onOpenAsset={() => handleOpenAsset(item)}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'version',
        label: t('executionsTable.columns.version'),
        defaultWidth: 120,
        // Metadato, no estado: en azul competía con el badge `draft` de la
        // columna de estado, dos azules distintos en la misma fila.
        render: (item) => (
          <span className="tabular-nums text-muted-foreground">
            {item.version_major !== null && item.version_minor !== null && item.version_patch !== null
              ? `v${item.version_major}.${item.version_minor}.${item.version_patch}`
              : item.name}
          </span>
        ),
      },
      {
        key: 'lifecycleState',
        label: t('executionsTable.columns.lifecycleState'),
        sortKey: 'lifecycle_state',
        defaultWidth: 150,
        render: (item) => <HuemulLifecycleBadge state={item.lifecycle_state} />,
      },
      {
        key: 'taskStatus',
        label: t('executionsTable.columns.taskStatus'),
        sortKey: 'task_status',
        defaultWidth: 140,
        render: (item) => <span className="text-muted-foreground">{item.task_status ?? '—'}</span>,
      },
      {
        key: 'owner',
        label: t('executionsTable.columns.owner'),
        sortKey: 'created_by_user_name',
        defaultWidth: 180,
        render: (item) =>
          item.created_by_user_name ? (
            <span className="inline-flex min-w-0 items-center gap-2">
              <HomeAvatar name={item.created_by_user_name} />
              <span className="truncate text-muted-foreground">
                {currentUserId && item.created_by === currentUserId ? t('executionsTable.you') : item.created_by_user_name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'updatedAt',
        label: t('executionsTable.columns.updatedAt'),
        sortKey: 'updated_at',
        defaultWidth: 150,
        render: (item) => (
          <span className="tabular-nums text-muted-foreground" title={item.updated_at}>
            {formatRelativeTime(item.updated_at)}
          </span>
        ),
      },
      {
        key: 'expirationDate',
        label: t('executionsTable.columns.expirationDate'),
        sortKey: 'expiration_date',
        defaultWidth: 150,
        render: (item) => (
          <span className="tabular-nums text-muted-foreground" title={item.expiration_date ?? undefined}>
            {item.expiration_date ? formatAbsoluteDate(item.expiration_date) : '—'}
          </span>
        ),
      },
      {
        key: 'estimatedPublicationDate',
        label: t('executionsTable.columns.estimatedPublicationDate'),
        sortKey: 'estimated_publication_date',
        defaultWidth: 180,
        render: (item) => (
          <span className="tabular-nums text-muted-foreground" title={item.estimated_publication_date ?? undefined}>
            {item.estimated_publication_date ? formatAbsoluteDate(item.estimated_publication_date) : '—'}
          </span>
        ),
      },
      {
        key: 'reviewDate',
        label: t('executionsTable.columns.reviewDate'),
        sortKey: 'review_date',
        defaultWidth: 150,
        render: (item) => (
          <span className="tabular-nums text-muted-foreground" title={item.review_date ?? undefined}>
            {item.review_date ? formatAbsoluteDate(item.review_date) : '—'}
          </span>
        ),
      },
      {
        key: 'auditDate',
        label: t('executionsTable.columns.auditDate'),
        sortKey: 'audit_date',
        defaultWidth: 150,
        render: (item) => (
          <span className="tabular-nums text-muted-foreground" title={item.audit_date ?? undefined}>
            {item.audit_date ? formatAbsoluteDate(item.audit_date) : '—'}
          </span>
        ),
      },
    ],
    [t, currentUserId, organizationId, canListDiscussions, handleOpenAsset],
  );

  const query = typeof values.query === 'string' ? values.query.trim() : '';
  const isEmptyResult = !isLoading && !isFetching && !error && data.length === 0 && page === 1;
  const searchType = values.searchType;

  const emptyContent = !isEmptyResult ? null : activeCount > 0 ? (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-9 text-center">
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        {activeCount === 1 ? t('noResults.titleOne') : t('noResults.titleMany', { count: activeCount })}
      </p>
      <p className="max-w-[420px] text-xs text-muted-foreground">{t('noResults.description')}</p>
      <div className="flex items-center gap-2 pt-1">
        {query && searchType !== 'content' && (
          <HuemulButton variant="outline" label={t('noResults.searchInContent', { query })} onClick={() => onFilterChange('searchType', 'content')} />
        )}
        <HuemulButton label={t('noResults.clearFilters')} onClick={onClearAll} />
      </div>
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-9 text-center">
      <p className="text-sm font-semibold text-foreground">{t('orgEmpty.title')}</p>
      <p className="max-w-[420px] text-xs text-muted-foreground">
        {canCreateAsset ? t('orgEmpty.descriptionCreate') : t('orgEmpty.descriptionReadOnly')}
      </p>
      {canCreateAsset && (
        <div className="flex items-center gap-2 pt-1">
          {onUploadAsset && <HuemulButton variant="outline" label={t('orgEmpty.upload')} onClick={onUploadAsset} />}
          {onCreateAsset && <HuemulButton label={t('orgEmpty.create')} onClick={onCreateAsset} />}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn(HOME_CARD, 'flex h-full flex-col overflow-hidden')}>
      {canListExecutions && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-divider px-3 py-2">
            <div className="flex items-center gap-2">
              <HuemulFilterButton count={activeCount} open={filtersOpen} onToggle={() => onFiltersOpenChange(!filtersOpen)} />
              <HuemulFilterInline filters={filterDefs} values={values} onChange={onFilterChange} onSelectedLabel={onSelectedLabel} />
            </div>
            {!isLoading && total != null && (
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">{t('executionsTable.resultsCount', { count: total })}</p>
            )}
          </div>
          <HuemulFilterChips chips={chips} onRemove={onChipRemove} onClearAll={onClearAll} className="shrink-0 border-b border-divider px-3 py-2" />
          {notice && (
            <div className="flex shrink-0 items-start gap-2 border-b border-divider bg-primary/5 px-3 py-2 text-xs text-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="flex-1">
                {notice.kind === 'droppedPending'
                  ? t('filterNotice.droppedPending', { label: notice.label })
                  : t('filterNotice.droppedQuery', { label: notice.label, query: notice.query })}
              </p>
              {onDismissNotice && <HuemulButton variant="ghost" size="sm" label={t('filterNotice.dismiss')} onClick={onDismissNotice} />}
            </div>
          )}
        </>
      )}

      <div className="flex-1 min-h-0">
        {!canListExecutions ? (
          <HuemulAccessDenied variant="inline" />
        ) : emptyContent ? (
          emptyContent
        ) : (
          <HuemulTable
            variant="detailed"
            data={data}
            columns={columns}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            isFetching={isFetching}
            onRowClick={canOpenAsset ? handleOpenAsset : undefined}
            resizable
            columnsStorageKey="wisecore:home-executions-col-widths"
            className="h-full"
            sort={sort}
            onSortChange={(s) => {
              onSortChange(s);
              onPageChange(1);
            }}
            error={error as Error | null}
            onRetry={onRetry}
            pagination={{ page, pageSize, hasNext, hasPrevious: page > 1, onPageChange, onPageSizeChange, pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS }}
          />
        )}
      </div>
    </div>
  );
}
