import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { FileUp, ClipboardList, Plus, GitBranch, MessageSquare, ChevronDown, RefreshCw } from 'lucide-react';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulTable } from '@/huemul/components/huemul-table';
import type { HuemulTableColumn } from '@/huemul/components/huemul-table';
import { ImportAssetFromFileDialog } from '@/components/assets/dialogs/assets-import-from-file-dialog';
import { CreateAssetDialog } from '@/components/assets/dialogs/assets-create-dialog';
import { ChangeHistoryPanel } from '@/components/execution/change-history-panel';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useOrganization } from '@/contexts/organization-context';
import type { Execution, ExecutionLifecycleState } from '@/types/executions';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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

  const columns: HuemulTableColumn<Execution>[] = [
    {
      key: 'documentName',
      label: t('executionsTable.columns.documentName'),
      render: (item) => <span className="font-medium">{item.document_name}</span>,
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
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-foreground hover:cursor-pointer">
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform duration-200', !filtersOpen && '-rotate-90')}
                    />
                    {t('filters.title')}
                  </CollapsibleTrigger>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent hover:cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                    {t('actions.refresh')}
                  </button>
                </div>
                <CollapsibleContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={lifecycleState || ALL_VALUE}
                      onValueChange={(v) => { setLifecycleState(v === ALL_VALUE ? '' : v); setPage(1); }}
                    >
                      <SelectTrigger className="h-8 w-auto gap-1 rounded-md border-border bg-background px-3 text-sm shadow-none hover:cursor-pointer hover:bg-accent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_VALUE}>{t('filters.allLifecycleStates')}</SelectItem>
                        <SelectItem value="draft">{tAssets('lifecycle.stateLabels.draft')}</SelectItem>
                        <SelectItem value="in_review">{tAssets('lifecycle.stateLabels.in_review')}</SelectItem>
                        <SelectItem value="in_approval">{tAssets('lifecycle.stateLabels.in_approval')}</SelectItem>
                        <SelectItem value="approved">{tAssets('lifecycle.stateLabels.approved')}</SelectItem>
                        <SelectItem value="published">{tAssets('lifecycle.stateLabels.published')}</SelectItem>
                        <SelectItem value="archived">{tAssets('lifecycle.stateLabels.archived')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={ownerScope || ALL_VALUE}
                      onValueChange={(v) => { setOwnerScope(v === ALL_VALUE ? '' : v); setPage(1); }}
                    >
                      <SelectTrigger className="h-8 w-auto gap-1 rounded-md border-border bg-background px-3 text-sm shadow-none hover:cursor-pointer hover:bg-accent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_VALUE}>{t('filters.allOwners')}</SelectItem>
                        <SelectItem value="me">{t('filters.ownerMe')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => { setHasUnresolvedComments((v) => !v); setPage(1); }}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:cursor-pointer transition-colors',
                        hasUnresolvedComments
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-800 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-200'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent',
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t('filters.unresolvedComments')}
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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