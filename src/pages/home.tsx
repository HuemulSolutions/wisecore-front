import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { HuemulFilterPanel } from '@/huemul/components/huemul-filter-panel';
import { HuemulCustomFieldFilter } from '@/huemul/components/huemul-custom-field-filter';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useHuemulFilters } from '@/hooks/useHuemulFilters';
import { ImportAssetFromFileSheet } from '@/components/assets/dialogs/assets-import-from-file-sheet';
import { CreateAssetSheet } from '@/components/assets/dialogs/assets-create-sheet';
import CreateDocumentType from '@/components/assets-types/assets-types-create';
import CreateUserSheet from '@/components/users/users-create-sheet';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useDocumentStatistics } from '@/hooks/useDocumentStatistics';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist';
import { useRecentAssets } from '@/hooks/useRecentAssets';
import { NotificationsSheet } from '@/components/notifications/notifications-sheet';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { usePageAccess } from '@/hooks/usePageAccess';
import { getUsers } from '@/services/users';
import { getDocumentTypes } from '@/services/document-types';
import type { FetchOptionsParams, FetchOptionsResult } from '@/huemul/components/huemul-field';
import type { HuemulFilterDef, HuemulFilterValue, HuemulDateRangeValue } from '@/types/huemul';
import type { ExecutionLifecycleState, ExecutionSearchType } from '@/types/execution';
import type { OnboardingStepId } from '@/types/home';
import { ApiError } from '@/types/api-error';
import { getBrowserDateLocale } from '@/lib/format-date-range';
import {
  HomeHeader,
  HomeTabsList,
  HomeAllAssetsTab,
  HomeTeamActivityTab,
  HomeMyWorkTab,
  HomeRail,
  HomeGettingStartedCard,
  type HomeOverviewRow,
  type HomeMyWorkTabSummary,
} from '@/components/home';

type HomeTabKey = 'mine' | 'all' | 'team';

export default function Home() {
  const { t } = useTranslation('home');
  const { t: tAssets } = useTranslation('assets');
  const { selectedOrganizationId, organizationToken } = useOrganization();
  const { user } = useAuth();
  const navigate = useOrgNavigate();
  const queryClient = useQueryClient();
  // /home no tiene guard de ruta (es el destino de todo rebote), así que cada
  // panel se gatea a sí mismo. Ver ia context/rbac-audit-guide.md.
  const { can, isLoading: isLoadingPermissions } = usePageAccess('home');
  const orgId = selectedOrganizationId ?? '';

  const canListExecutions = can('listExecutions');
  const canCreateAsset = can('createAsset');
  const canListAssetTypes = can('listAssetTypes');
  const canListUsers = can('listUsers');
  const canListCustomFields = can('listCustomFields');
  const canReadStatistics = can('readStatistics');

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [notificationsSheetOpen, setNotificationsSheetOpen] = useState(false);
  // Pasos 1 y 3 del checklist de onboarding — resueltos inline, sin salir de Home.
  const [assetTypeDialogOpen, setAssetTypeDialogOpen] = useState(false);
  const [inviteUserDialogOpen, setInviteUserDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTabKey>('mine');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | null>(null);

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useDocumentStatistics(orgId, !!orgId && !!organizationToken && canReadStatistics);

  // ── Checklist "Puesta en marcha" (estado de primera vez) ──
  const onboarding = useOnboardingChecklist({
    organizationId: orgId,
    canCheckAiConfig: can('listModels'),
    canCheckAssetType: canListAssetTypes,
    canCheckFirstAsset: canListExecutions,
    canCheckInviteTeam: canListUsers,
  });

  // ── "Continuar donde quedaste" ──
  const { recentAssets } = useRecentAssets(selectedOrganizationId, user?.id);

  // ── Resumen que reporta la pestaña "Mi trabajo" (único grupo real hoy) ──
  const [myWorkSummary, setMyWorkSummary] = useState<HomeMyWorkTabSummary>({ count: null, isEmpty: false, dueSoonCount: null });
  const isFirstTimeState = !onboarding.allDone && myWorkSummary.isEmpty && !onboarding.isLoading;

  const fetchDocumentTypes = useCallback(async ({ search: s }: FetchOptionsParams): Promise<FetchOptionsResult> => {
    const res = await getDocumentTypes({ search: s || undefined });
    return { options: (res.data ?? []).map((dt) => ({ value: dt.id, label: dt.name, color: dt.color })), hasMore: false };
  }, []);

  const fetchUsers = useCallback(
    async ({ search: s, page: p, pageSize: ps }: FetchOptionsParams): Promise<FetchOptionsResult> => {
      const res = await getUsers(orgId || undefined, p, ps, s);
      return {
        options: (res.data ?? []).map((u) => ({ value: u.id, label: [u.name, u.last_name].filter(Boolean).join(' ') })),
        hasMore: res.has_next ?? false,
      };
    },
    [orgId],
  );

  const { t: tFilters } = useTranslation('huemul-filters');

  // Filtros de "Todos los activos" — viven acá (no en el componente de la
  // pestaña) porque el panel lateral es una columna hermana del layout, y
  // los KPIs del rail necesitan poder escribirlos para saltar de pestaña con
  // el filtro ya aplicado.
  const filterDefs = useMemo<HuemulFilterDef[]>(() => {
    const search = tFilters('groups.search');
    const classification = tFilters('groups.classification');
    const dates = tFilters('groups.dates');
    const other = tFilters('groups.other');
    return [
      {
        key: 'searchType', type: 'select', group: search, toolbar: true, label: t('filters.searchType'),
        allValue: 'semantic', inputClassName: 'w-36',
        options: [
          { value: 'semantic', label: t('filters.searchTypeSemantic') },
          { value: 'title', label: t('filters.searchTypeTitle') },
          { value: 'code', label: t('filters.searchTypeCode') },
          { value: 'content', label: t('filters.searchTypeContent') },
        ],
      },
      { key: 'query', type: 'text', group: search, toolbar: true, label: t('filters.search'), placeholder: t('filters.searchPlaceholder'), inputClassName: 'w-56' },
      {
        key: 'lifecycleState', type: 'select', group: classification, label: t('filters.lifecycleState'), allValue: '__all__',
        options: [
          { value: '__all__', label: t('filters.allLifecycleStates') },
          { value: 'draft', label: tAssets('lifecycle.stateLabels.draft') },
          { value: 'in_review', label: tAssets('lifecycle.stateLabels.in_review') },
          { value: 'in_approval', label: tAssets('lifecycle.stateLabels.in_approval') },
          { value: 'approved', label: tAssets('lifecycle.stateLabels.approved') },
          { value: 'published', label: tAssets('lifecycle.stateLabels.published') },
          { value: 'archived', label: tAssets('lifecycle.stateLabels.archived') },
          { value: 'finalized', label: tAssets('lifecycle.stateLabels.finalized') },
        ],
      },
      ...(canListAssetTypes
        ? [{ key: 'documentTypeId', type: 'async-combobox', group: classification, label: t('filters.documentType'), placeholder: t('filters.allDocumentTypes'), fetchOptions: fetchDocumentTypes, pageSize: 50, searchOnEnter: true } as HuemulFilterDef]
        : []),
      canListUsers
        ? ({
            key: 'ownerValue', type: 'async-combobox', group: classification, label: t('filters.ownerScope'), placeholder: t('filters.allOwners'),
            fetchOptions: fetchUsers, pageSize: 20, searchOnEnter: true,
            staticOptions: [{ value: '__me__', label: t('filters.ownerMe'), description: t('filters.ownerMeDescription') }],
            staticOptionsLabel: t('filters.ownerScopeLabel'), asyncResultsLabel: t('filters.ownerUsersLabel'),
          } as HuemulFilterDef)
        : ({
            key: 'ownerValue', type: 'select', group: classification, label: t('filters.ownerScope'), allValue: '',
            options: [{ value: '', label: t('filters.allOwners') }, { value: '__me__', label: t('filters.ownerMe') }],
          } as HuemulFilterDef),
      { key: 'expirationDate', type: 'date-range', group: dates, label: t('filters.expirationDate') },
      { key: 'estimatedPublicationDate', type: 'date-range', group: dates, label: t('filters.estimatedPublicationDate') },
      { key: 'reviewDate', type: 'date-range', group: dates, label: t('filters.reviewDate') },
      { key: 'auditDate', type: 'date-range', group: dates, label: t('filters.auditDate') },
      ...(canListCustomFields
        ? [{
            key: 'customFieldFilter', type: 'custom', multiEntry: true, group: t('filters.customFieldsGroup'), label: t('filters.customFields'),
            render: ({ value, setValue }) => (
              <HuemulCustomFieldFilter value={Array.isArray(value) ? (value as string[]) : []} onChange={(next) => setValue(next)} />
            ),
          } as HuemulFilterDef]
        : []),
      { key: 'hasUnresolvedComments', type: 'boolean', group: other, label: t('filters.unresolvedComments') },
      { key: 'expiringSoon', type: 'boolean', group: other, label: t('filters.expiringSoon') },
    ];
  }, [t, tAssets, tFilters, fetchDocumentTypes, fetchUsers, canListAssetTypes, canListUsers, canListCustomFields]);

  const {
    values, open: filtersOpen, setOpen: setFiltersOpen, setValue, clearValue, clearAll, chips, activeCount, setSelectedLabel,
  } = useHuemulFilters({ filters: filterDefs, defaultOpen: false, initialValues: { searchType: 'semantic' } });

  const handleFilterChange = useCallback((key: string, value: HuemulFilterValue) => { setValue(key, value); setPage(1); }, [setValue]);
  const handleChipRemove = useCallback((key: string) => { clearValue(key); setPage(1); }, [clearValue]);
  const handleClearAll = useCallback(() => { clearAll(); setPage(1); }, [clearAll]);

  // Abrir el panel de filtros desde "Mi trabajo" cambia a "Todos los
  // activos" — filtrar es explorar (ver respuestas/promp-diseno-home.md §2).
  const handleToggleFilters = useCallback(() => {
    if (!filtersOpen) setActiveTab('all');
    setFiltersOpen(!filtersOpen);
  }, [filtersOpen, setFiltersOpen]);

  const jumpToAllAssets = useCallback(
    (overrides: Record<string, HuemulFilterValue>, labels?: Record<string, string | undefined>) => {
      Object.entries(overrides).forEach(([key, value]) => setValue(key, value));
      Object.entries(labels ?? {}).forEach(([key, label]) => setSelectedLabel(key, label));
      setPage(1);
      setActiveTab('all');
    },
    [setValue, setSelectedLabel],
  );

  // ── Panorama: qué KPI está aplicado ahora mismo (para resaltarlo) y
  // mecanismo de selección excluyente (clickear otro reemplaza, no combina) ──
  const activeOverviewKey = useMemo(() => {
    if (values.ownerValue === '__me__') return 'owned';
    if (values.lifecycleState === 'draft') return 'draft';
    if (values.lifecycleState === 'in_review') return 'inReview';
    if (values.lifecycleState === 'in_approval') return 'inApproval';
    if (values.lifecycleState === 'approved') return 'approved';
    if (values.lifecycleState === 'published') return 'published';
    if (values.expiringSoon) return 'expiringSoon';
    if (values.hasUnresolvedComments) return 'unresolvedComments';
    return null;
  }, [values.ownerValue, values.lifecycleState, values.expiringSoon, values.hasUnresolvedComments]);

  // Limpia los 4 ejes que puede tocar el Panorama, sin pisar otros filtros
  // que el usuario haya puesto a mano en el panel (fechas, tipo de activo,
  // custom fields siguen intactos).
  const clearOverviewFilters = useCallback(() => {
    setValue('ownerValue', '');
    setSelectedLabel('ownerValue', undefined);
    setValue('lifecycleState', '__all__');
    setValue('expiringSoon', false);
    setValue('hasUnresolvedComments', false);
  }, [setValue, setSelectedLabel]);

  const selectOverviewKpi = useCallback(
    (key: string, apply: () => void) => {
      const wasActive = activeOverviewKey === key;
      clearOverviewFilters();
      if (!wasActive) apply();
      setPage(1);
      setActiveTab('all');
    },
    [activeOverviewKey, clearOverviewFilters],
  );

  const expiration = (values.expirationDate as HuemulDateRangeValue | undefined) ?? {};
  const estimatedPublication = (values.estimatedPublicationDate as HuemulDateRangeValue | undefined) ?? {};
  const review = (values.reviewDate as HuemulDateRangeValue | undefined) ?? {};
  const audit = (values.auditDate as HuemulDateRangeValue | undefined) ?? {};

  const { data, isLoading, isFetching, refetch, error } = useAllExecutions(orgId, {
    enabled: !!orgId && !!organizationToken && canListExecutions,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    query: (values.query as string) || undefined,
    search_type: ((values.searchType as string) || undefined) as ExecutionSearchType | undefined,
    lifecycle_state: (values.lifecycleState && values.lifecycleState !== '__all__' ? values.lifecycleState : undefined) as ExecutionLifecycleState | undefined,
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
    custom_field_filter: (values.customFieldFilter as string[] | undefined)?.filter(Boolean).length ? (values.customFieldFilter as string[]).filter(Boolean) : undefined,
  });

  const handleRefresh = useCallback(() => {
    void refetch();
    void refetchStats();
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', orgId] });
  }, [refetch, refetchStats, queryClient, orgId]);

  // ── Panorama (rail): 8 KPIs fijos, un solo filtro activo a la vez —
  // clickear otro reemplaza al anterior en vez de combinarse (ver
  // `selectOverviewKpi`). `active` resalta cuál está aplicado ahora mismo.
  const overviewRows: HomeOverviewRow[] = useMemo(
    () => [
      {
        key: 'owned', label: t('kpis.owned.label'), value: stats?.owned_count ?? 0, dotClassName: 'bg-[#2563eb]',
        active: activeOverviewKey === 'owned',
        onClick: () => selectOverviewKpi('owned', () => { setValue('ownerValue', '__me__'); setSelectedLabel('ownerValue', t('filters.ownerMe')); }),
      },
      {
        key: 'draft', label: t('kpis.draft.label'), value: stats?.draft_count ?? 0, dotClassName: 'bg-[#2563eb]',
        active: activeOverviewKey === 'draft',
        onClick: () => selectOverviewKpi('draft', () => setValue('lifecycleState', 'draft')),
      },
      {
        key: 'inReview', label: t('kpis.inReview.label'), value: stats?.in_review_count ?? 0, dotClassName: 'bg-[#f59e0b]',
        active: activeOverviewKey === 'inReview',
        onClick: () => selectOverviewKpi('inReview', () => setValue('lifecycleState', 'in_review')),
      },
      {
        key: 'inApproval', label: t('kpis.inApproval.label'), value: stats?.in_approval_count ?? 0, dotClassName: 'bg-[#7c3aed]',
        active: activeOverviewKey === 'inApproval',
        onClick: () => selectOverviewKpi('inApproval', () => setValue('lifecycleState', 'in_approval')),
      },
      {
        key: 'approved', label: t('kpis.approved.label'), value: stats?.approved_count ?? 0, dotClassName: 'bg-[#16a34a]',
        active: activeOverviewKey === 'approved',
        onClick: () => selectOverviewKpi('approved', () => setValue('lifecycleState', 'approved')),
      },
      {
        key: 'published', label: t('kpis.published.label'), value: stats?.published_count ?? 0, dotClassName: 'bg-[#16a34a]',
        active: activeOverviewKey === 'published',
        onClick: () => selectOverviewKpi('published', () => setValue('lifecycleState', 'published')),
      },
      {
        key: 'expiringSoon', label: t('kpis.expiringSoon.label'), value: stats?.expiring_soon_count ?? 0, dotClassName: 'bg-[#b45309]', valueClassName: 'text-[#b45309]',
        active: activeOverviewKey === 'expiringSoon',
        onClick: () => selectOverviewKpi('expiringSoon', () => setValue('expiringSoon', true)),
      },
      {
        key: 'unresolvedComments', label: t('kpis.unresolvedComments.label'), value: stats?.unresolved_comments_count ?? 0, dotClassName: 'bg-[#db2777]',
        active: activeOverviewKey === 'unresolvedComments',
        onClick: () => selectOverviewKpi('unresolvedComments', () => setValue('hasUnresolvedComments', true)),
      },
    ],
    [stats, t, activeOverviewKey, selectOverviewKpi, setValue, setSelectedLabel],
  );

  const canCreateAssetType = can('createAssetType');
  const canCreateUser = can('createUser');

  // Los 3 pasos se resuelven sin salir de Home: mismos sheets que ya usan
  // /asset-types y /users, montados como siblings más abajo (ver
  // ia context/inline-create-entity-in-sheet-guide.md). `CreateDocumentType`
  // y `CreateUserSheet` devuelven `null` si falta el permiso de creación —
  // en ese caso el fallback sigue siendo navegar a la página completa, en
  // vez de abrir un sheet que no va a renderizar nada.
  const handleOnboardingStepAction = useCallback(
    (stepId: OnboardingStepId) => {
      if (stepId === 'defaultLlm' || stepId === 'embeddingProvider') {
        // Configurar un LLM o un proveedor de embeddings implica credenciales
        // de un proveedor externo + test de conexión (`/models`, tabs
        // "models"/"embeddings") — a diferencia de los otros pasos, no es un
        // caso análogo a "nombre + guardar" como para resolverlo en un sheet
        // liviano sin salir de Home.
        navigate('/models');
      } else if (stepId === 'assetType') {
        if (canCreateAssetType) setAssetTypeDialogOpen(true);
        else navigate('/asset-types');
      } else if (stepId === 'firstAsset') {
        setCreateDialogOpen(true);
      } else if (stepId === 'inviteTeam') {
        if (canCreateUser) setInviteUserDialogOpen(true);
        else navigate('/users');
      }
    },
    [navigate, canCreateAssetType, canCreateUser],
  );

  // Nunca un 403 de página completa: /home es el destino de todo rebote, así
  // que se degrada panel por panel y siempre queda algo alcanzable.
  if (isLoadingPermissions) {
    return <PageSkeleton />;
  }

  const header = (
    <HomeHeader
      greetingPeriod={greetingPeriod}
      isFirstTime={isFirstTimeState}
      onboardingStepsCount={onboarding.steps.length}
      userName={user?.name ?? ''}
      formattedDate={formattedDate}
      pendingCount={myWorkSummary.count}
      dueSoonCount={myWorkSummary.dueSoonCount}
      isRefreshing={isFetching || statsFetching}
      onRefresh={handleRefresh}
      canUpload={canCreateAsset}
      onUpload={() => setImportDialogOpen(true)}
      canCreate={canCreateAsset}
      onCreate={() => setCreateDialogOpen(true)}
      canListNotifications={can('listNotifications')}
      unreadNotificationsCount={unreadNotificationsCount}
      onOpenNotifications={() => setNotificationsSheetOpen(true)}
    />
  );

  // Primera vez (checklist incompleto + "Mi trabajo" vacío, ver
  // `isFirstTimeState` más arriba): una sola columna, sin tabs ni rail — el
  // checklist va en el flujo principal, no en el rail (spec §5.1/§5.3, y
  // coincide con el mock de referencia). `HomeMyWorkTab` se sigue montando
  // igual (mismo componente, mismo `emptyVariant="firstTime"`) porque es la
  // única fuente de `onSummaryChange`: cortar ese mount rompería la señal
  // que decide `isFirstTimeState`. Su estado vacío interno ya pinta el
  // placeholder de §5.2 sin duplicar nada acá.
  const mainContent = isFirstTimeState ? (
    <div className="flex flex-col gap-3.5 p-4 md:p-6">
      <HomeGettingStartedCard
        steps={onboarding.steps}
        dismissed={onboarding.dismissed}
        onDismiss={onboarding.dismiss}
        onResume={onboarding.resume}
        onStepAction={handleOnboardingStepAction}
      />
      <HomeMyWorkTab
        organizationId={orgId}
        canListExecutions={canListExecutions}
        canTransitionAsset={can('transitionAsset')}
        emptyVariant="firstTime"
        onViewApprovedInAllAssets={() => setActiveTab('all')}
        onSummaryChange={setMyWorkSummary}
      />
    </div>
  ) : (
    <div className="flex h-full min-h-0 gap-5 p-4 md:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HomeTabKey)} className="flex min-h-0 flex-1 flex-col gap-3.5">
          <HomeTabsList myWorkCount={myWorkSummary.count} showAllAssetsTab={canListExecutions} />
          <TabsContent value="mine" className="min-h-0 flex-1 overflow-y-auto">
            <HomeMyWorkTab
              organizationId={orgId}
              canListExecutions={canListExecutions}
              canTransitionAsset={can('transitionAsset')}
              emptyVariant={onboarding.allDone ? 'noPending' : 'firstTime'}
              onViewApprovedInAllAssets={() => jumpToAllAssets({ ownerValue: '__me__', lifecycleState: 'approved' }, { ownerValue: t('filters.ownerMe') })}
              onSummaryChange={setMyWorkSummary}
            />
          </TabsContent>
          <TabsContent value="all" className="min-h-0 flex-1 overflow-hidden">
            <HomeAllAssetsTab
              organizationId={orgId}
              canListExecutions={canListExecutions}
              canOpenAsset={can('openAsset')}
              filterDefs={filterDefs}
              values={values}
              chips={chips}
              activeCount={activeCount}
              onFilterChange={handleFilterChange}
              onChipRemove={handleChipRemove}
              onClearAll={handleClearAll}
              onSelectedLabel={setSelectedLabel}
              filtersOpen={filtersOpen}
              onFiltersOpenChange={handleToggleFilters}
              data={data?.data ?? []}
              hasNext={data?.has_next}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              onRetry={() => {
                if (ApiError.isApiError(error) && error.code === 'INVALID_SORT') { setSort(null); setPage(1); } else { refetch(); }
              }}
              page={page}
              onPageChange={setPage}
              sort={sort}
              onSortChange={setSort}
            />
          </TabsContent>
          <TabsContent value="team" className="min-h-0 flex-1 overflow-hidden">
            <HomeTeamActivityTab organizationId={orgId} />
          </TabsContent>
        </Tabs>
      </div>
      <HomeRail
        isFirstTime={isFirstTimeState}
        showGettingStarted={!onboarding.allDone}
        onboarding={onboarding}
        onOnboardingStepAction={handleOnboardingStepAction}
        recentAssets={recentAssets}
        showOverview={canReadStatistics}
        overviewRows={overviewRows}
        overviewLoading={statsLoading}
      />
    </div>
  );

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
              <HuemulFilterPanel filters={filterDefs} values={values} onChange={handleFilterChange} onSelectedLabel={setSelectedLabel} onClose={() => setFiltersOpen(false)} />
            ),
            show: filtersOpen && canListExecutions,
            defaultSize: 22,
            minSize: 16,
            maxSize: 35,
            collapsible: true,
          },
          { content: mainContent },
        ]}
      />

      <ImportAssetFromFileSheet open={importDialogOpen} onOpenChange={setImportDialogOpen} onAssetCreated={handleAssetCreated} canCreate={canCreateAsset} />
      <CreateAssetSheet open={createDialogOpen} onOpenChange={setCreateDialogOpen} onAssetCreated={handleAssetCreated} canCreate={canCreateAsset} />
      {selectedOrganizationId && (
        <NotificationsSheet open={notificationsSheetOpen} onOpenChange={setNotificationsSheetOpen} organizationId={selectedOrganizationId} />
      )}

      {/* Pasos 1 y 3 del checklist de onboarding, inline — ver handleOnboardingStepAction. */}
      <CreateDocumentType
        open={assetTypeDialogOpen}
        onOpenChange={setAssetTypeDialogOpen}
        documentType={null}
        type="asset"
        canSave={canCreateAssetType}
        onDocumentTypeCreated={() => onboarding.refetch()}
      />
      <CreateUserSheet
        open={inviteUserDialogOpen}
        onOpenChange={setInviteUserDialogOpen}
        canCreate={canCreateUser}
        onSuccess={() => onboarding.refetch()}
      />
    </>
  );
}
