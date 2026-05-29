import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { FileUp, ClipboardList, Plus, GitBranch, ExternalLink, MessageCircle } from 'lucide-react';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulTable } from '@/huemul/components/huemul-table';
import type { HuemulTableColumn, HuemulTableAction } from '@/huemul/components/huemul-table';
import { HuemulFilters } from '@/huemul/components/huemul-filters';
import { HuemulField } from '@/huemul/components/huemul-field';
import { ImportAssetFromFileDialog } from '@/components/assets/dialogs/assets-import-from-file-dialog';
import { CreateAssetDialog } from '@/components/assets/dialogs/assets-create-dialog';
import { ChangeHistoryPanel } from '@/components/execution/change-history-panel';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useOrganization } from '@/contexts/organization-context';
import { getUsers } from '@/services/users';
import { getDocumentTypes } from '@/services/document-types';
import type { FetchOptionsParams, FetchOptionsResult } from '@/huemul/components/huemul-field';
import type { Execution, ExecutionLifecycleState } from '@/types/execution';
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
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filters — pending (UI fields) / applied (drives the query)
  const defaultFilters = {
    search: '',
    lifecycleState: '',
    ownerValue: '',
    hasUnresolvedComments: false,
    documentTypeId: '',
    expirationDate: '',
    expirationDateFrom: '',
    expirationDateTo: '',
    estimatedPublicationDate: '',
    estimatedPublicationDateFrom: '',
    estimatedPublicationDateTo: '',
    reviewDate: '',
    reviewDateFrom: '',
    reviewDateTo: '',
    auditDate: '',
    auditDateFrom: '',
    auditDateTo: '',
  };

  const [pendingFilters, setPendingFilters] = useState({ ...defaultFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...defaultFilters });
  const [sort, setSort] = useState<string | null>(null);

  const hasActiveFilters =
    !!appliedFilters.search ||
    !!appliedFilters.lifecycleState ||
    !!appliedFilters.ownerValue ||
    appliedFilters.hasUnresolvedComments ||
    !!appliedFilters.documentTypeId ||
    !!appliedFilters.expirationDate ||
    !!appliedFilters.expirationDateFrom ||
    !!appliedFilters.expirationDateTo ||
    !!appliedFilters.estimatedPublicationDate ||
    !!appliedFilters.estimatedPublicationDateFrom ||
    !!appliedFilters.estimatedPublicationDateTo ||
    !!appliedFilters.reviewDate ||
    !!appliedFilters.reviewDateFrom ||
    !!appliedFilters.reviewDateTo ||
    !!appliedFilters.auditDate ||
    !!appliedFilters.auditDateFrom ||
    !!appliedFilters.auditDateTo;

  function handleApply() {
    setAppliedFilters({ ...pendingFilters });
    setPage(1);
  }

  function handleClear() {
    setPendingFilters({ ...defaultFilters });
    setAppliedFilters({ ...defaultFilters });
    setPage(1);
  }

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

  const ALL_VALUE = '__all__';

  const { data, isLoading, isFetching, refetch, error } = useAllExecutions(selectedOrganizationId ?? '', {
    enabled: !!selectedOrganizationId,
    page,
    pageSize: PAGE_SIZE,
    search: appliedFilters.search || undefined,
    lifecycle_state: (appliedFilters.lifecycleState || undefined) as ExecutionLifecycleState | undefined,
    owner_scope: appliedFilters.ownerValue === '__me__' ? 'me' : undefined,
    created_by: appliedFilters.ownerValue && appliedFilters.ownerValue !== '__me__' ? appliedFilters.ownerValue : undefined,
    has_unresolved_comments: appliedFilters.hasUnresolvedComments || undefined,
    document_type_id: appliedFilters.documentTypeId || undefined,
    expiration_date: appliedFilters.expirationDate || undefined,
    expiration_date_from: appliedFilters.expirationDateFrom || undefined,
    expiration_date_to: appliedFilters.expirationDateTo || undefined,
    estimated_publication_date: appliedFilters.estimatedPublicationDate || undefined,
    estimated_publication_date_from: appliedFilters.estimatedPublicationDateFrom || undefined,
    estimated_publication_date_to: appliedFilters.estimatedPublicationDateTo || undefined,
    review_date: appliedFilters.reviewDate || undefined,
    review_date_from: appliedFilters.reviewDateFrom || undefined,
    review_date_to: appliedFilters.reviewDateTo || undefined,
    audit_date: appliedFilters.auditDate || undefined,
    audit_date_from: appliedFilters.auditDateFrom || undefined,
    audit_date_to: appliedFilters.auditDateTo || undefined,
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
    <div className="flex items-center justify-end gap-2 px-4 py-3">
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
  );

  return (
    <>
      <HuemulPageLayout
        header={header}
        columns={[{
          content: (
            <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4">
              {/* Filters */}
              <HuemulFilters
                title={t('filters.title')}
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                onRefresh={() => refetch()}
                isRefreshing={isFetching}
                onApply={handleApply}
                onClear={handleClear}
                hasActiveFilters={hasActiveFilters}
              >
                <HuemulField
                  type="text"
                  label={t('filters.search')}
                  value={pendingFilters.search}
                  onChange={(v) => setPendingFilters((p) => ({ ...p, search: String(v ?? '') }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                  placeholder={t('filters.searchPlaceholder')}
                  className="w-auto"
                  inputClassName="w-48 h-8 text-xs"
                />

                <HuemulField
                  type="select"
                  label={t('filters.lifecycleState')}
                  value={pendingFilters.lifecycleState || ALL_VALUE}
                  onChange={(v) => setPendingFilters((p) => ({ ...p, lifecycleState: v === ALL_VALUE ? '' : String(v) }))}
                  options={[
                    { value: ALL_VALUE, label: t('filters.allLifecycleStates') },
                    { value: 'draft', label: tAssets('lifecycle.stateLabels.draft') },
                    { value: 'in_review', label: tAssets('lifecycle.stateLabels.in_review') },
                    { value: 'in_approval', label: tAssets('lifecycle.stateLabels.in_approval') },
                    { value: 'approved', label: tAssets('lifecycle.stateLabels.approved') },
                    { value: 'published', label: tAssets('lifecycle.stateLabels.published') },
                    { value: 'archived', label: tAssets('lifecycle.stateLabels.archived') },
                  ]}
                  selectSize="xs"
                  className="w-auto"
                  inputClassName="w-44 h-8 text-xs"
                />

                <HuemulField
                  type="async-select"
                  label={t('filters.documentType')}
                  placeholder={t('filters.allDocumentTypes')}
                  value={pendingFilters.documentTypeId}
                  onChange={(v) => setPendingFilters((p) => ({ ...p, documentTypeId: v ? String(v) : '' }))}
                  fetchOptions={fetchDocumentTypes}
                  pageSize={50}
                  searchOnEnter
                  className="w-auto"
                  inputClassName="w-44 h-8 text-xs"
                />

                <HuemulField
                  type="async-select"
                  label={t('filters.ownerScope')}
                  placeholder={t('filters.allOwners')}
                  value={pendingFilters.ownerValue}
                  onChange={(v) => setPendingFilters((p) => ({ ...p, ownerValue: v ? String(v) : '' }))}
                  asyncStaticOptions={[{ value: '__me__', label: t('filters.ownerMe'), description: t('filters.ownerMeDescription') }]}
                  asyncStaticOptionsLabel={t('filters.ownerScopeLabel')}
                  asyncResultsLabel={t('filters.ownerUsersLabel')}
                  fetchOptions={fetchUsers}
                  pageSize={20}
                  searchOnEnter
                  className="w-auto"
                  inputClassName="w-44 h-8 text-xs"
                />

                <div className="w-px h-8 bg-border self-end" />

                <HuemulField
                  type="date-range"
                  label={t('filters.expirationDate')}
                  dateValue={pendingFilters.expirationDate}
                  dateRangeFrom={pendingFilters.expirationDateFrom}
                  dateRangeTo={pendingFilters.expirationDateTo}
                  onDateChange={(v) => setPendingFilters((p) => ({ ...p, expirationDate: v, expirationDateFrom: '', expirationDateTo: '' }))}
                  onDateRangeChange={(from, to) => setPendingFilters((p) => ({ ...p, expirationDate: '', expirationDateFrom: from, expirationDateTo: to }))}
                  className="w-auto"
                  inputClassName="w-52 h-8 text-xs"
                />

                <HuemulField
                  type="date-range"
                  label={t('filters.estimatedPublicationDate')}
                  dateValue={pendingFilters.estimatedPublicationDate}
                  dateRangeFrom={pendingFilters.estimatedPublicationDateFrom}
                  dateRangeTo={pendingFilters.estimatedPublicationDateTo}
                  onDateChange={(v) => setPendingFilters((p) => ({ ...p, estimatedPublicationDate: v, estimatedPublicationDateFrom: '', estimatedPublicationDateTo: '' }))}
                  onDateRangeChange={(from, to) => setPendingFilters((p) => ({ ...p, estimatedPublicationDate: '', estimatedPublicationDateFrom: from, estimatedPublicationDateTo: to }))}
                  className="w-auto"
                  inputClassName="w-52 h-8 text-xs"
                />

                <HuemulField
                  type="date-range"
                  label={t('filters.reviewDate')}
                  dateValue={pendingFilters.reviewDate}
                  dateRangeFrom={pendingFilters.reviewDateFrom}
                  dateRangeTo={pendingFilters.reviewDateTo}
                  onDateChange={(v) => setPendingFilters((p) => ({ ...p, reviewDate: v, reviewDateFrom: '', reviewDateTo: '' }))}
                  onDateRangeChange={(from, to) => setPendingFilters((p) => ({ ...p, reviewDate: '', reviewDateFrom: from, reviewDateTo: to }))}
                  className="w-auto"
                  inputClassName="w-52 h-8 text-xs"
                />

                <HuemulField
                  type="date-range"
                  label={t('filters.auditDate')}
                  dateValue={pendingFilters.auditDate}
                  dateRangeFrom={pendingFilters.auditDateFrom}
                  dateRangeTo={pendingFilters.auditDateTo}
                  onDateChange={(v) => setPendingFilters((p) => ({ ...p, auditDate: v, auditDateFrom: '', auditDateTo: '' }))}
                  onDateRangeChange={(from, to) => setPendingFilters((p) => ({ ...p, auditDate: '', auditDateFrom: from, auditDateTo: to }))}
                  className="w-auto"
                  inputClassName="w-52 h-8 text-xs"
                />

                <div className="w-px h-8 bg-border self-end" />

                <HuemulField
                  type="switch"
                  label={t('filters.unresolvedComments')}
                  inline={false}
                  value={pendingFilters.hasUnresolvedComments}
                  onChange={(v) => setPendingFilters((p) => ({ ...p, hasUnresolvedComments: Boolean(v) }))}
                  className="w-auto"
                  controlClassName="h-8 flex items-center"
                />
              </HuemulFilters>

              {!isLoading && (
                <p className="shrink-0 text-sm text-muted-foreground -mt-2">
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
        }]}
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