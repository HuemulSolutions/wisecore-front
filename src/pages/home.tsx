import { useState } from 'react';
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
import type { Execution, ExecutionLifecycleState } from '@/types/executions';
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

  // Filters
  const [lifecycleState, setLifecycleState] = useState<string>('');
  const [ownerScope, setOwnerScope] = useState<string>('');
  const [hasUnresolvedComments, setHasUnresolvedComments] = useState(false);

  const PAGE_SIZE = 20;

  const ALL_VALUE = '__all__';

  const { data, isLoading, isFetching, refetch } = useAllExecutions(selectedOrganizationId ?? '', {
    enabled: !!selectedOrganizationId,
    page,
    pageSize: PAGE_SIZE,
    lifecycle_state: (lifecycleState || undefined) as ExecutionLifecycleState | undefined,
    owner_scope: (ownerScope || undefined) as 'all' | 'me' | undefined,
    has_unresolved_comments: hasUnresolvedComments || undefined,
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
      render: (item) => <span className="font-medium">{item.document_name}</span>,
    },
    {
      key: 'unresolvedComments',
      label: t('executionsTable.columns.unresolvedComments'),
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
      render: (item) => (
        <span className="text-muted-foreground">{tAssets(`lifecycle.stateLabels.${item.lifecycle_state}`)}</span>
      ),
    },
    {
      key: 'taskStatus',
      label: t('executionsTable.columns.taskStatus'),
      render: (item) => (
        <span className="text-muted-foreground">{item.task_status ?? '—'}</span>
      ),
    },
    {
      key: 'owner',
      label: t('executionsTable.columns.owner'),
      render: (item) => (
        <span className="text-muted-foreground">{item.created_by_user_name ?? '—'}</span>
      ),
    },
    {
      key: 'updatedAt',
      label: t('executionsTable.columns.updatedAt'),
      render: (item) => (
        <span className="text-muted-foreground" title={item.updated_at}>
          {formatRelativeTime(item.updated_at)}
        </span>
      ),
    },
    {
      key: 'expirationDate',
      label: t('executionsTable.columns.expirationDate'),
      render: (item) => (
        <span className="text-muted-foreground" title={item.expiration_date ?? undefined}>
          {item.expiration_date ? formatAbsoluteDate(item.expiration_date) : '—'}
        </span>
      ),
    },
    {
      key: 'estimatedPublicationDate',
      label: t('executionsTable.columns.estimatedPublicationDate'),
      render: (item) => (
        <span className="text-muted-foreground" title={item.estimated_publication_date ?? undefined}>
          {item.estimated_publication_date ? formatAbsoluteDate(item.estimated_publication_date) : '—'}
        </span>
      ),
    },
    {
      key: 'reviewDate',
      label: t('executionsTable.columns.reviewDate'),
      render: (item) => (
        <span className="text-muted-foreground" title={item.review_date ?? undefined}>
          {item.review_date ? formatAbsoluteDate(item.review_date) : '—'}
        </span>
      ),
    },
    {
      key: 'auditDate',
      label: t('executionsTable.columns.auditDate'),
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
              >
                <HuemulField
                  type="select"
                  label={t('filters.lifecycleState')}
                  value={lifecycleState || ALL_VALUE}
                  onChange={(v) => { setLifecycleState(v === ALL_VALUE ? '' : String(v)); setPage(1); }}
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
                  type="select"
                  label={t('filters.ownerScope')}
                  value={ownerScope || ALL_VALUE}
                  onChange={(v) => { setOwnerScope(v === ALL_VALUE ? '' : String(v)); setPage(1); }}
                  options={[
                    { value: ALL_VALUE, label: t('filters.allOwners') },
                    { value: 'me', label: t('filters.ownerMe') },
                  ]}
                  selectSize="xs"
                  className="w-auto"
                  inputClassName="w-36 h-8 text-xs"
                />

                <HuemulField
                  type="switch"
                  label={t('filters.unresolvedComments')}
                  inline={false}
                  value={hasUnresolvedComments}
                  onChange={(v) => { setHasUnresolvedComments(Boolean(v)); setPage(1); }}
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