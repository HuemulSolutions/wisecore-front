import { useTranslation } from 'react-i18next';
import { GitBranch, ExternalLink, MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants';
import { HuemulTable } from '@/huemul/components/huemul-table';
import type { HuemulTableColumn, HuemulTableAction } from '@/huemul/components/huemul-table';
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button';
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips';
import { HuemulFilterInline } from '@/huemul/components/huemul-filter-inline';
import { HuemulLifecycleBadge } from '@/huemul/components/huemul-lifecycle-badge';
import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied';
import type { HuemulFilterDef, HuemulFilterValue, HuemulFilterChip } from '@/types/huemul';
import type { Execution } from '@/types/execution';
import { formatRelativeTime, formatAbsoluteDate } from '@/lib/format-relative-time';
import { HomeAvatar } from './home-avatar';

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
  sort: string | null;
  onSortChange: (sort: string | null) => void;
}

/**
 * Contenido de la pestaña "Todos los activos" — es el Home original completo
 * (filtros inline + chips + tabla de ejecuciones), movido tal cual sin
 * cambios de lógica. El panel lateral de filtros vive en la columna
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
  sort,
  onSortChange,
}: HomeAllAssetsTabProps) {
  const { t } = useTranslation('home');
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const tableActions: HuemulTableAction<Execution>[] = useMemo(
    () =>
      canOpenAsset
        ? [
            {
              key: 'openAsset',
              label: t('executionsTable.actions.openAsset'),
              icon: ExternalLink,
              onClick: (item) => {
                const url = `${window.location.origin}/${organizationId}/asset/${item.document_id}?execution=${item.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              },
            },
          ]
        : [],
    [canOpenAsset, organizationId, t],
  );

  const columns: HuemulTableColumn<Execution>[] = useMemo(
    () => [
      {
        key: 'documentName',
        label: t('executionsTable.columns.documentName'),
        sortKey: 'document_name',
        defaultWidth: 260,
        render: (item) => <span className="font-medium">{item.document_name}</span>,
      },
      {
        key: 'unresolvedComments',
        label: t('executionsTable.columns.unresolvedComments'),
        sortKey: 'unresolved_comments_count',
        defaultWidth: 150,
        render: (item) =>
          item.unresolved_comments_count > 0 ? (
            <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
              <MessageCircle className="h-3.5 w-3.5" />
              {item.unresolved_comments_count}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'version',
        label: t('executionsTable.columns.version'),
        defaultWidth: 120,
        render: (item) => (
          <span className="text-blue-600 dark:text-blue-400">
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
              <span className="truncate text-muted-foreground">{item.created_by_user_name}</span>
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
          <span className="text-muted-foreground" title={item.updated_at}>
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
          <span className="text-muted-foreground" title={item.expiration_date ?? undefined}>
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
          <span className="text-muted-foreground" title={item.estimated_publication_date ?? undefined}>
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
          <span className="text-muted-foreground" title={item.review_date ?? undefined}>
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
          <span className="text-muted-foreground" title={item.audit_date ?? undefined}>
            {item.audit_date ? formatAbsoluteDate(item.audit_date) : '—'}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      {canListExecutions && (
        <>
          <div className="shrink-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HuemulFilterButton count={activeCount} open={filtersOpen} onToggle={() => onFiltersOpenChange(!filtersOpen)} />
              <HuemulFilterInline filters={filterDefs} values={values} onChange={onFilterChange} onSelectedLabel={onSelectedLabel} />
            </div>
            {!isLoading && total != null && (
              <p className="shrink-0 text-sm text-muted-foreground">{t('executionsTable.resultsCount', { count: total })}</p>
            )}
          </div>
          <HuemulFilterChips chips={chips} onRemove={onChipRemove} onClearAll={onClearAll} />
        </>
      )}

      <div className="flex-1 min-h-0">
        {!canListExecutions ? (
          <HuemulAccessDenied variant="inline" />
        ) : (
          <HuemulTable
            data={data}
            columns={columns}
            getRowKey={(item) => item.id}
            isLoading={isLoading}
            isFetching={isFetching}
            actions={tableActions}
            actionsMode="inline"
            resizable
            columnsStorageKey="wisecore:home-executions-col-widths"
            className="h-full"
            maxHeight=""
            sort={sort}
            onSortChange={(s) => {
              onSortChange(s);
              onPageChange(1);
            }}
            error={error as Error | null}
            onRetry={onRetry}
            emptyState={{ icon: GitBranch, title: t('executionsTable.empty.title'), description: t('executionsTable.empty.description') }}
            pagination={{ page, pageSize: PAGE_SIZE, hasNext, hasPrevious: page > 1, onPageChange }}
          />
        )}
      </div>
    </div>
  );
}
