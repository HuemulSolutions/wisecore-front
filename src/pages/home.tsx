import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { FileUp, ClipboardList, Plus, GitBranch, ExternalLink, MessageCircle } from 'lucide-react';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulTable } from '@/huemul/components/huemul-table';
import type { HuemulTableColumn, HuemulTableAction } from '@/huemul/components/huemul-table';
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button';
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips';
import { HuemulFilterPanel } from '@/huemul/components/huemul-filter-panel';
import { HuemulFilterInline } from '@/huemul/components/huemul-filter-inline';
import { useHuemulFilters } from '@/hooks/useHuemulFilters';
import { ImportAssetFromFileDialog } from '@/components/assets/dialogs/assets-import-from-file-dialog';
import { CreateAssetDialog } from '@/components/assets/dialogs/assets-create-dialog';
import { ChangeHistoryPanel } from '@/components/execution/change-history-panel';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useOrganization } from '@/contexts/organization-context';
import { getUsers } from '@/services/users';
import { getDocumentTypes } from '@/services/document-types';
import type { FetchOptionsParams, FetchOptionsResult } from '@/huemul/components/huemul-field';
import type { HuemulFilterDef, HuemulFilterValue, HuemulDateRangeValue } from '@/types/huemul';
import type { Execution, ExecutionLifecycleState, ExecutionSearchType } from '@/types/execution';
import { ApiError } from '@/types/api-error';
import { formatRelativeTime, formatAbsoluteDate } from '@/lib/format-relative-time';

export default function Home() {
  const { t } = useTranslation('home');
  const { t: tAssets } = useTranslation('assets');
  const { selectedOrganizationId } = useOrganization();
  const navigate = useOrgNavigate();

  const handleAssetCreated = ({ id }: { id: string; name: string; type: string }) => {
    navigate(`/asset/${id}`);
  };

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [reviewsSheetOpen, setReviewsSheetOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | null>(null);

  const fetchDocumentTypes = useCallback(
    async ({ search: s }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getDocumentTypes({ search: s || undefined });
      return {
        options: (res.data ?? []).map((dt) => ({ value: dt.id, label: dt.name, color: dt.color })),
        hasMore: false,
      };
    },
    [],
  );

  const fetchUsers = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(selectedOrganizationId ?? undefined, p, ps, s);
      return {
        options: (res.data ?? []).map((u) => ({
          value: u.id,
          label: [u.name, u.last_name].filter(Boolean).join(' '),
        })),
        hasMore: res.has_next ?? false,
      };
    },
    [selectedOrganizationId],
  );

  const PAGE_SIZE = 20;

  const { t: tFilters } = useTranslation('huemul-filters');

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const search = tFilters('groups.search');
    const classification = tFilters('groups.classification');
    const dates = tFilters('groups.dates');
    const other = tFilters('groups.other');
    return [
      {
        key: 'searchType',
        type: 'select',
        group: search,
        toolbar: true,
        label: t('filters.searchType'),
        allValue: 'semantic',
        inputClassName: 'w-36',
        options: [
          { value: 'semantic', label: t('filters.searchTypeSemantic') },
          { value: 'title', label: t('filters.searchTypeTitle') },
          { value: 'code', label: t('filters.searchTypeCode') },
          { value: 'content', label: t('filters.searchTypeContent') },
        ],
      },
      {
        key: 'query',
        type: 'text',
        group: search,
        toolbar: true,
        label: t('filters.search'),
        placeholder: t('filters.searchPlaceholder'),
        inputClassName: 'w-56',
      },
      {
        key: 'lifecycleState',
        type: 'select',
        group: classification,
        label: t('filters.lifecycleState'),
        allValue: '__all__',
        options: [
          { value: '__all__', label: t('filters.allLifecycleStates') },
          { value: 'draft', label: tAssets('lifecycle.stateLabels.draft') },
          { value: 'in_review', label: tAssets('lifecycle.stateLabels.in_review') },
          { value: 'in_approval', label: tAssets('lifecycle.stateLabels.in_approval') },
          { value: 'approved', label: tAssets('lifecycle.stateLabels.approved') },
          { value: 'published', label: tAssets('lifecycle.stateLabels.published') },
          { value: 'archived', label: tAssets('lifecycle.stateLabels.archived') },
        ],
      },
      {
        key: 'documentTypeId',
        type: 'async-select',
        group: classification,
        label: t('filters.documentType'),
        placeholder: t('filters.allDocumentTypes'),
        fetchOptions: fetchDocumentTypes,
        pageSize: 50,
        searchOnEnter: true,
      },
      {
        key: 'ownerValue',
        type: 'async-select',
        group: classification,
        label: t('filters.ownerScope'),
        placeholder: t('filters.allOwners'),
        fetchOptions: fetchUsers,
        pageSize: 20,
        searchOnEnter: true,
        staticOptions: [
          { value: '__me__', label: t('filters.ownerMe'), description: t('filters.ownerMeDescription') },
        ],
        staticOptionsLabel: t('filters.ownerScopeLabel'),
        asyncResultsLabel: t('filters.ownerUsersLabel'),
      },
      { key: 'expirationDate', type: 'date-range', group: dates, label: t('filters.expirationDate') },
      { key: 'estimatedPublicationDate', type: 'date-range', group: dates, label: t('filters.estimatedPublicationDate') },
      { key: 'reviewDate', type: 'date-range', group: dates, label: t('filters.reviewDate') },
      { key: 'auditDate', type: 'date-range', group: dates, label: t('filters.auditDate') },
      { key: 'hasUnresolvedComments', type: 'boolean', group: other, label: t('filters.unresolvedComments') },
    ];
  }, [t, tAssets, tFilters, fetchDocumentTypes, fetchUsers]);

  const {
    values,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    setValue,
    clearValue,
    clearAll,
    chips,
    activeCount,
    setSelectedLabel,
  } = useHuemulFilters({
    filters: filterDefs,
    defaultOpen: true,
    initialValues: { searchType: 'semantic' },
  });

  // Instant-apply: any filter change resets to the first page.
  const handleFilterChange = useCallback((key: string, value: HuemulFilterValue) => {
    setValue(key, value);
    setPage(1);
  }, [setValue]);

  const handleChipRemove = useCallback((key: string) => {
    clearValue(key);
    setPage(1);
  }, [clearValue]);

  const handleClearAll = useCallback(() => {
    clearAll();
    setPage(1);
  }, [clearAll]);

  const expiration = (values.expirationDate as HuemulDateRangeValue | undefined) ?? {};
  const estimatedPublication = (values.estimatedPublicationDate as HuemulDateRangeValue | undefined) ?? {};
  const review = (values.reviewDate as HuemulDateRangeValue | undefined) ?? {};
  const audit = (values.auditDate as HuemulDateRangeValue | undefined) ?? {};

  const { data, isLoading, isFetching, refetch, error } = useAllExecutions(selectedOrganizationId ?? '', {
    enabled: !!selectedOrganizationId,
    page,
    pageSize: PAGE_SIZE,
    query: (values.query as string) || undefined,
    search_type: ((values.searchType as string) || undefined) as ExecutionSearchType | undefined,
    lifecycle_state: (values.lifecycleState && values.lifecycleState !== '__all__'
      ? values.lifecycleState
      : undefined) as ExecutionLifecycleState | undefined,
    owner_scope: values.ownerValue === '__me__' ? 'me' : undefined,
    created_by: values.ownerValue && values.ownerValue !== '__me__' ? String(values.ownerValue) : undefined,
    has_unresolved_comments: (values.hasUnresolvedComments as boolean) || undefined,
    document_type_id: (values.documentTypeId as string) || undefined,
    expiration_date: expiration.date || undefined,
    expiration_date_from: expiration.from || undefined,
    expiration_date_to: expiration.to || undefined,
    estimated_publication_date: estimatedPublication.date || undefined,
    estimated_publication_date_from: estimatedPublication.from || undefined,
    estimated_publication_date_to: estimatedPublication.to || undefined,
    review_date: review.date || undefined,
    review_date_from: review.from || undefined,
    review_date_to: review.to || undefined,
    audit_date: audit.date || undefined,
    audit_date_from: audit.from || undefined,
    audit_date_to: audit.to || undefined,
    sort: sort || undefined,
  });

  const executions = data?.data ?? [];

  const tableActions: HuemulTableAction<Execution>[] = [
    {
      key: 'openAsset',
      label: t('executionsTable.actions.openAsset'),
      icon: ExternalLink,
      onClick: (item) => {
        const url = `${window.location.origin}/${selectedOrganizationId}/asset/${item.document_id}?execution=${item.id}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
  ];

  const columns: HuemulTableColumn<Execution>[] = [
    {
      key: 'documentName',
      label: t('executionsTable.columns.documentName'),
      sortKey: 'document_name',
      render: (item) => <span className="font-medium">{item.document_name}</span>,
    },
    {
      key: 'unresolvedComments',
      label: t('executionsTable.columns.unresolvedComments'),
      sortKey: 'unresolved_comments_count',
      render: (item) =>
        item.unresolved_comments_count > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
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
      render: (item) => (
        <span className="text-muted-foreground">
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
      render: (item) => (
        <span className="text-muted-foreground">{tAssets(`lifecycle.stateLabels.${item.lifecycle_state}`)}</span>
      ),
    },
    {
      key: 'taskStatus',
      label: t('executionsTable.columns.taskStatus'),
      sortKey: 'task_status',
      render: (item) => (
        <span className="text-muted-foreground">{item.task_status ?? '—'}</span>
      ),
    },
    {
      key: 'owner',
      label: t('executionsTable.columns.owner'),
      sortKey: 'created_by_user_name',
      render: (item) => (
        <span className="text-muted-foreground">{item.created_by_user_name ?? '—'}</span>
      ),
    },
    {
      key: 'updatedAt',
      label: t('executionsTable.columns.updatedAt'),
      sortKey: 'updated_at',
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
      render: (item) => (
        <span className="text-muted-foreground" title={item.audit_date ?? undefined}>
          {item.audit_date ? formatAbsoluteDate(item.audit_date) : '—'}
        </span>
      ),
    },
  ];

  const header = (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="flex items-center gap-2">
        <HuemulFilterButton
          count={activeCount}
          open={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
        <HuemulFilterInline
          filters={filterDefs}
          values={values}
          onChange={handleFilterChange}
          onSelectedLabel={setSelectedLabel}
        />
      </div>
      <div className="flex items-center gap-2">
        <HuemulButton
          variant="outline"
          icon={FileUp}
          label={t('actions.uploadDocument')}
          onClick={() => setImportDialogOpen(true)}
        />
        <HuemulButton
          variant="outline"
          icon={ClipboardList}
          label={t('actions.pendingReviews')}
          onClick={() => setReviewsSheetOpen(true)}
        />
        <HuemulButton
          icon={Plus}
          label={t('actions.createAsset')}
          onClick={() => setCreateDialogOpen(true)}
        />
      </div>
    </div>
  );

  return (
    <>
      <HuemulPageLayout
        header={header}
        columns={[
          {
            content: (
              <HuemulFilterPanel
                filters={filterDefs}
                values={values}
                onChange={handleFilterChange}
                onSelectedLabel={setSelectedLabel}
                onClose={() => setFiltersOpen(false)}
              />
            ),
            show: filtersOpen,
            defaultSize: 22,
            minSize: 16,
            maxSize: 35,
            collapsible: true,
          },
          {
            content: (
              <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4">
                <HuemulFilterChips
                  chips={chips}
                  onRemove={handleChipRemove}
                  onClearAll={handleClearAll}
                />

                {!isLoading && (
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {t('executionsTable.resultsCount', { count: executions.length })}
                  </p>
                )}

                <div className="flex-1 min-h-0">
                  <HuemulTable
                    data={executions}
                    columns={columns}
                    getRowKey={(item) => item.id}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    actions={tableActions}
                    actionsMode="inline"
                    className="h-full"
                    maxHeight=""
                    sort={sort}
                    onSortChange={(s) => { setSort(s); setPage(1); }}
                    error={error as Error | null}
                    onRetry={() => {
                      if (ApiError.isApiError(error) && error.code === 'INVALID_SORT') {
                        setSort(null);
                        setPage(1);
                      } else {
                        refetch();
                      }
                    }}
                    emptyState={{
                      icon: GitBranch,
                      title: t('executionsTable.empty.title'),
                      description: t('executionsTable.empty.description'),
                    }}
                    pagination={{
                      page,
                      pageSize: PAGE_SIZE,
                      hasNext: data?.has_next,
                      hasPrevious: page > 1,
                      onPageChange: setPage,
                    }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      <ImportAssetFromFileDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onAssetCreated={handleAssetCreated}
      />

      <HuemulSheet
        open={reviewsSheetOpen}
        onOpenChange={setReviewsSheetOpen}
        title={t('actions.pendingReviewsTitle')}
        description={t('actions.pendingReviewsDescription')}
        icon={ClipboardList}
        maxWidth="sm:max-w-2xl"
        showFooter={false}
      >
        <ChangeHistoryPanel />
      </HuemulSheet>

      <CreateAssetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAssetCreated={handleAssetCreated}
      />
    </>
  );
}