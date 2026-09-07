import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useOrgNavigate } from '@/hooks/useOrgRouter';
import { HuemulPageLayout } from '@/huemul/components/huemul-page-layout';
import { DEFAULT_PAGE_SIZE } from '@/huemul/constants';
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
import { useMyWork } from '@/hooks/useMyWork';
import { NotificationsSheet } from '@/components/notifications/notifications-sheet';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { usePageAccess } from '@/hooks/usePageAccess';
import { getUsers } from '@/services/users';
import { getDocumentTypes } from '@/services/document-types';
import type { FetchOptionsParams, FetchOptionsResult } from '@/huemul/components/huemul-field';
import type { HuemulFilterDef, HuemulFilterValue, HuemulDateRangeValue } from '@/types/huemul';
import type { ExecutionLifecycleState, ExecutionPendingMyAction, ExecutionSearchType } from '@/types/execution';
import type { HomeWorkGroupCount, OnboardingStepId } from '@/types/home';
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
  HomeSkeleton,
  type HomeOverviewRow,
} from '@/components/home';

type HomeTabKey = 'mine' | 'all' | 'team';

export default function Home() {
  const { t } = useTranslation('home');
  const { t: tAssets } = useTranslation('assets');
  const { selectedOrganizationId, organizationToken, isLoading: isLoadingOrganization } = useOrganization();
  const { user } = useAuth();
  const navigate = useOrgNavigate();
  const queryClient = useQueryClient();
  // /home no tiene guard de ruta (es el destino de todo rebote), así que cada
  // panel se gatea a sí mismo. Ver ia context/rbac-audit-guide.md.
  const { can, isLoading: isLoadingPermissions } = usePageAccess('home');
  const orgId = selectedOrganizationId ?? '';
  // `isLoadingOrganization` cubre la restauración async desde localStorage
  // (`organization-context.ts`) — sin esto, el primer render con `orgId=''`
  // deja las queries deshabilitadas y eso se lee como "vacío", forzando por
  // un instante el diseño de primera vez incluso en una org con datos.
  const orgReady = !isLoadingOrganization && !!orgId && !!organizationToken;

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

  // `scope=me` es superset de `scope=organization` (mismos 8 contadores +5
  // personales) — una sola request alimenta tanto el Panorama org-wide como
  // el bloque "Solo lo mío" y el subtítulo del header.
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useDocumentStatistics(orgId, !!orgId && !!organizationToken && canReadStatistics, 'me');

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

  // ── "Mi trabajo" (3 grupos reales) — misma fuente que consume
  // `HomeMyWorkTab`, así que padre e hijo nunca se desincronizan ni duplican
  // la request (comparten `queryKey`). Ver `useMyWork`.
  const myWork = useMyWork(orgId, orgReady && canListExecutions);
  const isFirstTimeState = !onboarding.allDone && myWork.isEmpty;
  // Único gate de carga: hasta que esto resuelva, se pinta `HomeSkeleton` —
  // evita que la primera pintura elija el diseño equivocado y luego salte.
  const isHomeReady = !isLoadingPermissions && orgReady && !onboarding.isLoading && !myWork.isResolving;

  // Conteo total de "cosas por hacer" del usuario, para el subtítulo del
  // header y el badge de la pestaña "Mi trabajo" — suma de los 3 grupos.
  // `useMemo` acá arriba (antes del `if (!isHomeReady)` más abajo) para no
  // romper el orden de hooks entre renders.
  const myWorkTotalCount: HomeWorkGroupCount | null = useMemo(() => {
    const groups = [myWork.review.count, myWork.approval.count, myWork.approved.count];
    if (groups.some((c) => c === null)) return null;
    return {
      exact: groups.every((c) => c!.exact),
      value: groups.reduce((sum, c) => sum + c!.value, 0),
    };
  }, [myWork.review.count, myWork.approval.count, myWork.approved.count]);

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
      {
        key: 'pendingMyAction', type: 'select', group: classification, label: t('filters.pendingMyAction'), allValue: '',
        options: [
          { value: '', label: t('filters.allPendingMyAction') },
          { value: 'review', label: t('filters.pendingMyActionReview') },
          { value: 'approve', label: t('filters.pendingMyActionApprove') },
          { value: 'any', label: t('filters.pendingMyActionAny') },
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

  // `pending_my_action` no es combinable con `query` en el backend (400
  // PENDING_MY_ACTION_WITH_SEARCH_NOT_SUPPORTED) — se resuelve en la UI antes
  // de llegar a esa respuesta: activar uno limpia el otro.
  const handleFilterChange = useCallback(
    (key: string, value: HuemulFilterValue) => {
      setValue(key, value);
      if (key === 'pendingMyAction' && value) {
        setValue('query', '');
      } else if (key === 'query' && typeof value === 'string' && value.trim() && values.pendingMyAction) {
        setValue('pendingMyAction', '');
      }
      setPage(1);
    },
    [setValue, values.pendingMyAction],
  );
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
    if (values.pendingMyAction === 'review') return 'pendingMyReview';
    if (values.pendingMyAction === 'approve') return 'pendingMyApproval';
    if (values.ownerValue === '__me__' && values.lifecycleState === 'approved') return 'approvedOwnedByMe';
    if (values.ownerValue === '__me__') return 'owned';
    if (values.lifecycleState === 'draft') return 'draft';
    if (values.lifecycleState === 'in_review') return 'inReview';
    if (values.lifecycleState === 'in_approval') return 'inApproval';
    if (values.lifecycleState === 'approved') return 'approved';
    if (values.lifecycleState === 'published') return 'published';
    if (values.expiringSoon) return 'expiringSoon';
    if (values.hasUnresolvedComments) return 'unresolvedComments';
    return null;
  }, [values.pendingMyAction, values.ownerValue, values.lifecycleState, values.expiringSoon, values.hasUnresolvedComments]);

  // Limpia los ejes que puede tocar el Panorama (los 8 KPIs org-wide más los
  // 3 personales), sin pisar otros filtros que el usuario haya puesto a mano
  // en el panel (fechas, tipo de activo, custom fields siguen intactos).
  const clearOverviewFilters = useCallback(() => {
    setValue('ownerValue', '');
    setSelectedLabel('ownerValue', undefined);
    setValue('lifecycleState', '__all__');
    setValue('expiringSoon', false);
    setValue('hasUnresolvedComments', false);
    setValue('pendingMyAction', '');
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
    pending_my_action: (values.pendingMyAction as ExecutionPendingMyAction) || undefined,
  });

  const handleRefresh = useCallback(() => {
    void refetch();
    void refetchStats();
    myWork.refetchAll();
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', orgId] });
  }, [refetch, refetchStats, myWork, queryClient, orgId]);

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

  // Bloque "Solo lo mío" del Panorama — los 3 contadores relativos al
  // usuario que sí trae `scope=me` (spec Punto 3, ya entregado).
  // `my_mentions_count` no se pinta: el backend lo devuelve como placeholder
  // fijo en `0` (sin infraestructura de menciones a usuarios todavía).
  const personalOverviewRows: HomeOverviewRow[] = useMemo(
    () => [
      {
        key: 'pendingMyReview', label: t('kpis.pendingMyReview.label'), value: stats?.pending_my_review_count ?? 0, dotClassName: 'bg-[#f59e0b]',
        active: activeOverviewKey === 'pendingMyReview',
        onClick: () => selectOverviewKpi('pendingMyReview', () => setValue('pendingMyAction', 'review')),
      },
      {
        key: 'pendingMyApproval', label: t('kpis.pendingMyApproval.label'), value: stats?.pending_my_approval_count ?? 0, dotClassName: 'bg-[#7c3aed]',
        active: activeOverviewKey === 'pendingMyApproval',
        onClick: () => selectOverviewKpi('pendingMyApproval', () => setValue('pendingMyAction', 'approve')),
      },
      {
        key: 'approvedOwnedByMe', label: t('kpis.approvedOwnedByMe.label'), value: stats?.approved_owned_by_me_count ?? 0, dotClassName: 'bg-[#16a34a]',
        active: activeOverviewKey === 'approvedOwnedByMe',
        onClick: () =>
          selectOverviewKpi('approvedOwnedByMe', () => {
            setValue('ownerValue', '__me__');
            setSelectedLabel('ownerValue', t('filters.ownerMe'));
            setValue('lifecycleState', 'approved');
          }),
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
  // que se degrada panel por panel y siempre queda algo alcanzable. El gate
  // de abajo es distinto: no es permisos, es "todavía no sé qué diseño
  // pintar" (ver `isHomeReady`).
  if (!isHomeReady) {
    return <HomeSkeleton />;
  }

  // "Cosas por hacer" del usuario: preferimos `stats` (`scope=me`, ya resuelto
  // por backend); si `readStatistics` no está habilitado, se cae a
  // `myWorkTotalCount` (mismos números, calculados sumando los 3 `total`
  // exactos de `useMyWork`).
  const pendingCount: HomeWorkGroupCount | null =
    canReadStatistics && stats
      ? {
          exact: true,
          value: (stats.pending_my_review_count ?? 0) + (stats.pending_my_approval_count ?? 0) + (stats.approved_owned_by_me_count ?? 0),
        }
      : myWorkTotalCount;
  // Solo `stats` (`scope=me`) sabe cruzar `expiration_date`/
  // `estimated_publication_date` contra "próximos 7 días" — sin acceso a
  // statistics, se omite la cláusula en vez de aproximarla mal.
  const dueSoonCount = canReadStatistics && stats ? (stats.due_this_week_count ?? null) : null;

  const header = (
    <HomeHeader
      greetingPeriod={greetingPeriod}
      isFirstTime={isFirstTimeState}
      onboardingStepsCount={onboarding.steps.length}
      userName={user?.name ?? ''}
      formattedDate={formattedDate}
      pendingCount={pendingCount}
      dueSoonCount={dueSoonCount}
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
  // coincide con el mock de referencia). Su estado vacío interno ya pinta el
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
        onViewGroupInAllAssets={() => setActiveTab('all')}
        onViewAllAssets={() => setActiveTab('all')}
      />
    </div>
  ) : (
    <div className="flex h-full min-h-0 gap-5 p-4 md:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as HomeTabKey)} className="flex min-h-0 flex-1 flex-col gap-3.5">
          <HomeTabsList myWorkCount={myWorkTotalCount} showAllAssetsTab={canListExecutions} />
          <TabsContent value="mine" className="min-h-0 flex-1 overflow-y-auto">
            <HomeMyWorkTab
              organizationId={orgId}
              canListExecutions={canListExecutions}
              canTransitionAsset={can('transitionAsset')}
              emptyVariant={onboarding.allDone ? 'noPending' : 'firstTime'}
              onViewGroupInAllAssets={(group) => {
                if (group === 'approved') {
                  jumpToAllAssets({ ownerValue: '__me__', lifecycleState: 'approved' }, { ownerValue: t('filters.ownerMe') });
                } else {
                  // `pendingMyAction` (filtro/param del backend) usa `approve`, no
                  // `approval` (clave del grupo en `HomeMyWorkTab`).
                  jumpToAllAssets({ pendingMyAction: group === 'approval' ? 'approve' : 'review' });
                }
              }}
              onViewAllAssets={() => setActiveTab('all')}
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
              total={data?.total}
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
        showGettingStarted={!onboarding.isLoading && !onboarding.allDone}
        onboarding={onboarding}
        onOnboardingStepAction={handleOnboardingStepAction}
        recentAssets={recentAssets}
        showOverview={canReadStatistics}
        overviewRows={overviewRows}
        overviewPersonalRows={personalOverviewRows}
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
