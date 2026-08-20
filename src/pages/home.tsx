import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import {
  FileUp,
  ClipboardList,
  Plus,
  GitBranch,
  ExternalLink,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { HuemulButton } from '@/huemul/components/huemul-button';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants';
import { HuemulSheet } from '@/huemul/components/huemul-sheet';
import { HuemulTable } from '@/huemul/components/huemul-table';
import type { HuemulTableColumn, HuemulTableAction } from '@/huemul/components/huemul-table';
import { HuemulFilterButton } from '@/huemul/components/huemul-filter-button';
import { HuemulFilterChips } from '@/huemul/components/huemul-filter-chips';
import { HuemulFilterPanel } from '@/huemul/components/huemul-filter-panel';
import { HuemulFilterInline } from '@/huemul/components/huemul-filter-inline';
import { HuemulCustomFieldFilter } from '@/huemul/components/huemul-custom-field-filter';
import { HuemulStatCard } from '@/huemul/components/huemul-stat-card';
import { HuemulLifecycleBadge } from '@/huemul/components/huemul-lifecycle-badge';
import { HuemulAccessDenied } from '@/huemul/components/huemul-access-denied';
import type { HuemulStatCardColor } from '@/huemul/components/huemul-stat-card';
import { useHuemulFilters } from '@/hooks/useHuemulFilters';
import { ImportAssetFromFileSheet } from '@/components/assets/dialogs/assets-import-from-file-sheet';
import { CreateAssetSheet } from '@/components/assets/dialogs/assets-create-sheet';
import { ChangeHistoryPanel } from '@/components/execution/change-history-panel';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useDocumentStatistics } from '@/hooks/useDocumentStatistics';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { NotificationsSheet } from '@/components/notifications/notifications-sheet';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { usePageAccess } from '@/hooks/usePageAccess';
import { getUsers } from '@/services/users';
import { getDocumentTypes } from '@/services/document-types';
import type { FetchOptionsParams, FetchOptionsResult } from '@/huemul/components/huemul-field';
import type { HuemulFilterDef, HuemulFilterValue, HuemulDateRangeValue } from '@/types/huemul';
import type { Execution, ExecutionLifecycleState, ExecutionSearchType } from '@/types/execution';
import { ApiError } from '@/types/api-error';
import { formatRelativeTime, formatAbsoluteDate } from '@/lib/format-relative-time';
import { getBrowserDateLocale } from '@/lib/format-date-range';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Home() {
  const { t } = useTranslation('home');
  const { t: tAssets } = useTranslation('assets');
  const { t: tCommon } = useTranslation('common');
  const { selectedOrganizationId, organizationToken } = useOrganization();
  const { user } = useAuth();
  const navigate = useOrgNavigate();
  const queryClient = useQueryClient();
  // /home no tiene guard de ruta (es el destino de todo rebote), así que cada
  // panel se gatea a sí mismo. Ver ia context/rbac-audit-guide.md.
  const { can, isLoading: isLoadingPermissions } = usePageAccess('home');

  const canListExecutions = can('listExecutions');
  const canCreateAsset = can('createAsset');

  const unreadNotificationsCount = useUnreadNotificationsCount(selectedOrganizationId);

  const greetingPeriod = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 19) return 'afternoon';
    return 'evening';
  }, []);

  const formattedDate = useMemo(() => {
    const raw = format(new Date(), "EEEE d 'de' MMMM", { locale: getBrowserDateLocale() });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const handleAssetCreated = ({ id }: { id: string; name: string; type: string }) => {
    navigate(`/asset/${id}`);
  };

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [reviewsSheetOpen, setReviewsSheetOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [notificationsSheetOpen, setNotificationsSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | null>(null);

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useDocumentStatistics(
    selectedOrganizationId ?? '',
    !!selectedOrganizationId && !!organizationToken && can('readStatistics'),
  );

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

  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const { t: tFilters } = useTranslation('huemul-filters');

  const canListAssetTypes = can('listAssetTypes');
  const canListUsers = can('listUsers');
  const canListCustomFields = can('listCustomFields');

  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const search = tFilters('groups.search');
    const classification = tFilters('groups.classification');
    const dates = tFilters('groups.dates');
    const other = tFilters('groups.other');
    // Cada combobox asíncrono pega a su propio endpoint: se omite la entrada
    // completa cuando falta el permiso, lo que además elimina su chip sin
    // tocar useHuemulFilters (mismo mecanismo que /diagrams).
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
      ...(canListAssetTypes
        ? [
            {
              key: 'documentTypeId',
              type: 'async-combobox',
              group: classification,
              label: t('filters.documentType'),
              placeholder: t('filters.allDocumentTypes'),
              fetchOptions: fetchDocumentTypes,
              pageSize: 50,
              searchOnEnter: true,
            } as HuemulFilterDef,
          ]
        : []),
      // Sin `user:l|r` el filtro no se omite, se degrada: la opción "__me__"
      // manda `owner_scope=me` (no lista usuarios) y además es lo que escribe
      // el KPI "Propios". Omitir la entrada dejaría ese valor sin chip y fuera
      // del alcance de "Limpiar todo" — ambos derivan de `filterDefs`.
      canListUsers
        ? ({
            key: 'ownerValue',
            type: 'async-combobox',
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
          } as HuemulFilterDef)
        : ({
            key: 'ownerValue',
            type: 'select',
            group: classification,
            label: t('filters.ownerScope'),
            allValue: '',
            options: [
              { value: '', label: t('filters.allOwners') },
              { value: '__me__', label: t('filters.ownerMe') },
            ],
          } as HuemulFilterDef),
      { key: 'expirationDate', type: 'date-range', group: dates, label: t('filters.expirationDate') },
      { key: 'estimatedPublicationDate', type: 'date-range', group: dates, label: t('filters.estimatedPublicationDate') },
      { key: 'reviewDate', type: 'date-range', group: dates, label: t('filters.reviewDate') },
      { key: 'auditDate', type: 'date-range', group: dates, label: t('filters.auditDate') },
      ...(canListCustomFields
        ? [
            {
              key: 'customFieldFilter',
              type: 'custom',
              multiEntry: true,
              group: t('filters.customFieldsGroup'),
              label: t('filters.customFields'),
              render: ({ value, setValue }) => (
                <HuemulCustomFieldFilter
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onChange={(next) => setValue(next)}
                />
              ),
            } as HuemulFilterDef,
          ]
        : []),
      { key: 'hasUnresolvedComments', type: 'boolean', group: other, label: t('filters.unresolvedComments') },
      { key: 'expiringSoon', type: 'boolean', group: other, label: t('filters.expiringSoon') },
    ];
  }, [t, tAssets, tFilters, fetchDocumentTypes, fetchUsers, canListAssetTypes, canListUsers, canListCustomFields]);

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
    defaultOpen: false,
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
    enabled: !!selectedOrganizationId && !!organizationToken && canListExecutions,
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
    expiring_soon: (values.expiringSoon as boolean) || undefined,
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
    custom_field_filter: (values.customFieldFilter as string[] | undefined)?.filter(Boolean).length
      ? (values.customFieldFilter as string[]).filter(Boolean)
      : undefined,
  });

  const executions = data?.data ?? [];

  // Un solo botón agrupa las 3 queries de la página (regla de un botón por
  // contenedor, no por endpoint): ejecuciones, KPIs y contador de
  // notificaciones. Este último se invalida en vez de refetchearse porque
  // useUnreadNotificationsCount solo devuelve el número, no un refetch.
  const handleRefresh = useCallback(() => {
    void refetch();
    void refetchStats();
    void queryClient.invalidateQueries({
      queryKey: ['notifications', 'unread-count', selectedOrganizationId],
    });
  }, [refetch, refetchStats, queryClient, selectedOrganizationId]);

  // La acción abre /asset/{id}, cuya ruta exige asset:r|l: sin el permiso el
  // usuario aterrizaría en un rebote del guard en vez de en el asset.
  const tableActions: HuemulTableAction<Execution>[] = useMemo(
    () =>
      can('openAsset')
        ? [
            {
              key: 'openAsset',
              label: t('executionsTable.actions.openAsset'),
              icon: ExternalLink,
              onClick: (item) => {
                const url = `${window.location.origin}/${selectedOrganizationId}/asset/${item.document_id}?execution=${item.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              },
            },
          ]
        : [],
    [can, selectedOrganizationId, t],
  );

  const columns: HuemulTableColumn<Execution>[] = useMemo(() => [
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
      render: (item) => (
        <span className="text-muted-foreground">{item.task_status ?? '—'}</span>
      ),
    },
    {
      key: 'owner',
      label: t('executionsTable.columns.owner'),
      sortKey: 'created_by_user_name',
      defaultWidth: 180,
      render: (item) =>
        item.created_by_user_name ? (
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {getInitials(item.created_by_user_name)}
            </span>
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
  ], [t]);

  const toggleLifecycleState = useCallback((state: ExecutionLifecycleState) => {
    handleFilterChange('lifecycleState', values.lifecycleState === state ? '__all__' : state);
  }, [handleFilterChange, values.lifecycleState]);

  const kpiCards = useMemo(() => [
    {
      key: 'owned',
      color: 'blue' as HuemulStatCardColor,
      value: stats?.owned_count ?? 0,
      label: t('kpis.owned.label'),
      active: values.ownerValue === '__me__',
      onClick: () => {
        const next = values.ownerValue === '__me__' ? '' : '__me__';
        handleFilterChange('ownerValue', next);
        setSelectedLabel('ownerValue', next ? t('filters.ownerMe') : undefined);
      },
    },
    {
      key: 'draft',
      color: 'slate' as HuemulStatCardColor,
      value: stats?.draft_count ?? 0,
      label: t('kpis.draft.label'),
      active: values.lifecycleState === 'draft',
      onClick: () => toggleLifecycleState('draft'),
    },
    {
      key: 'inReview',
      color: 'amber' as HuemulStatCardColor,
      value: stats?.in_review_count ?? 0,
      label: t('kpis.inReview.label'),
      active: values.lifecycleState === 'in_review',
      onClick: () => toggleLifecycleState('in_review'),
    },
    {
      key: 'inApproval',
      color: 'sky' as HuemulStatCardColor,
      value: stats?.in_approval_count ?? 0,
      label: t('kpis.inApproval.label'),
      active: values.lifecycleState === 'in_approval',
      onClick: () => toggleLifecycleState('in_approval'),
    },
    {
      key: 'approved',
      color: 'emerald' as HuemulStatCardColor,
      value: stats?.approved_count ?? 0,
      label: t('kpis.approved.label'),
      active: values.lifecycleState === 'approved',
      onClick: () => toggleLifecycleState('approved'),
    },
    {
      key: 'published',
      color: 'teal' as HuemulStatCardColor,
      value: stats?.published_count ?? 0,
      label: t('kpis.published.label'),
      active: values.lifecycleState === 'published',
      onClick: () => toggleLifecycleState('published'),
    },
    {
      key: 'expiringSoon',
      color: 'red' as HuemulStatCardColor,
      value: stats?.expiring_soon_count ?? 0,
      label: t('kpis.expiringSoon.label'),
      active: !!values.expiringSoon,
      onClick: () => handleFilterChange('expiringSoon', !values.expiringSoon),
    },
    {
      key: 'unresolvedComments',
      color: 'violet' as HuemulStatCardColor,
      value: stats?.unresolved_comments_count ?? 0,
      label: t('kpis.unresolvedComments.label'),
      active: !!values.hasUnresolvedComments,
      onClick: () => handleFilterChange('hasUnresolvedComments', !values.hasUnresolvedComments),
    },
  ], [stats, t, values.ownerValue, values.lifecycleState, values.expiringSoon, values.hasUnresolvedComments, handleFilterChange, toggleLifecycleState, setSelectedLabel]);

  const visibleKpiCards = statsLoading
    ? kpiCards
    : kpiCards.filter((card) => card.value > 0 || card.active);

  const header = (
    <div className="flex flex-col gap-1 px-4 md:px-6 pt-4 pb-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">
          {t(`greeting.${greetingPeriod}`, { name: user?.name ?? '' })}
        </h1>
        <div className="flex items-center gap-2">
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            icon={RefreshCw}
            tooltip={tCommon('refresh')}
            loading={isFetching || statsFetching}
            onClick={handleRefresh}
          />
          {canCreateAsset && (
            <HuemulButton
              variant="outline"
              icon={FileUp}
              label={t('actions.uploadDocument')}
              onClick={() => setImportDialogOpen(true)}
            />
          )}
          {can('listAssets') && (
            <HuemulButton
              variant="outline"
              icon={ClipboardList}
              label={t('actions.pendingReviews')}
              onClick={() => setReviewsSheetOpen(true)}
            />
          )}
          {canCreateAsset && (
            <HuemulButton
              icon={Plus}
              label={t('actions.createAsset')}
              onClick={() => setCreateDialogOpen(true)}
            />
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {formattedDate}
        {can('listNotifications') && (
          <>
            {' · '}
            <button
              type="button"
              onClick={() => setNotificationsSheetOpen(true)}
              className="text-primary underline-offset-2 hover:underline transition-colors"
            >
              {t('greeting.unreadNotifications', { count: unreadNotificationsCount })}
            </button>
          </>
        )}
      </p>
    </div>
  );

  // Nunca un 403 de página completa: /home es el destino de todo rebote, así
  // que se degrada panel por panel y siempre queda algo alcanzable.
  if (isLoadingPermissions) {
    return <PageSkeleton />;
  }

  return (
    <>
      <HuemulPageLayout
        className="bg-gray-50"
        headerClassName="border-b-0 bg-gray-50"
        header={header}
        withHandle
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
            // Los filtros solo alimentan la query de ejecuciones: sin permiso
            // para listarlas no hay nada que filtrar.
            show: filtersOpen && canListExecutions,
            defaultSize: 22,
            minSize: 16,
            maxSize: 35,
            collapsible: true,
          },
          {
            content: (
              <div className="flex flex-col h-full overflow-hidden p-4 md:p-6 gap-4">
                {visibleKpiCards.length > 0 && (
                  <div className="shrink-0 flex flex-wrap gap-3">
                    {visibleKpiCards.map((card) => (
                      <HuemulStatCard
                        key={card.key}
                        color={card.color}
                        value={card.value}
                        label={card.label}
                        active={card.active}
                        loading={statsLoading}
                        onClick={card.onClick}
                        className="rounded-xl border bg-card"
                      />
                    ))}
                  </div>
                )}

                {canListExecutions && (
                  <>
                    <div className="shrink-0 flex items-center justify-between gap-2">
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
                      {!isLoading && (
                        <p className="shrink-0 text-sm text-muted-foreground">
                          {t('executionsTable.resultsCount', { count: executions.length })}
                        </p>
                      )}
                    </div>

                    <HuemulFilterChips
                      chips={chips}
                      onRemove={handleChipRemove}
                      onClearAll={handleClearAll}
                    />
                  </>
                )}

                <div className="flex-1 min-h-0">
                  {!canListExecutions ? (
                    <HuemulAccessDenied variant="inline" />
                  ) : (
                    <HuemulTable
                      data={executions}
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
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      <ImportAssetFromFileSheet
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onAssetCreated={handleAssetCreated}
        canCreate={canCreateAsset}
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

      <CreateAssetSheet
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAssetCreated={handleAssetCreated}
        canCreate={canCreateAsset}
      />

      {selectedOrganizationId && (
        <NotificationsSheet
          open={notificationsSheetOpen}
          onOpenChange={setNotificationsSheetOpen}
          organizationId={selectedOrganizationId}
        />
      )}
    </>
  );
}