"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Plus, Users } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useUrlTab } from "@/hooks/useUrlTab"
import { useGlobalUsers, useUserById, useUserMutations, globalUserQueryKeys } from "@/hooks/useUsers"
import { useUserProfileForm } from "@/hooks/useUserProfileForm"
import { GlobalAdminUsersTable } from "./global-admin-users-table"

import {
  UserPageEmptyState,
  UserPageDialogs,
  UserContentEmptyState,
  UserDetailPanel,
  type UserDetailPanelGuardApi,
} from "@/components/users"
import type { User, UserDetailTab, UserDialogsState } from "@/types/users"

interface GlobalAdminUsersSectionProps {
  /**
   * Único eje de permisos de la sección: `/global-admin` es una ruta técnica
   * root-admin-only y NO org-scoped, así que los permisos org-scoped
   * (`user:c/u/d`) no aplican acá. Un trío canCreate/canUpdate/canDelete
   * alimentado por el mismo booleano sería granularidad falsa.
   * Ver ia context/rbac-audit-guide.md.
   */
  canManage: boolean
}

const USER_DETAIL_TABS: readonly UserDetailTab[] = ['profile', 'organizations']

/**
 * Sección Usuarios de `/global-admin` — maestro-detalle, mismo panel que
 * `/users` (`UserDetailPanel`) pero sin tab Roles (org-scoped, no aplica a
 * un usuario global) y con tab Organizaciones siempre disponible (acá
 * `canManage` YA implica root admin, a diferencia de `/users` donde ese tab
 * depende de `isRootAdmin`). Reemplaza el kebab de 7 acciones: aprobar/
 * rechazar/root-admin/editar ya son inline en el panel; asignar organización
 * pasa al tab Organizaciones (resuelve el stub "Hacer admin de organización"
 * que antes solo mostraba un toast).
 */
export function GlobalAdminUsersSection({ canManage }: GlobalAdminUsersSectionProps) {
  const { t } = useTranslation(['users', 'global-admin', 'common'])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchParams, setSearchParams] = useSearchParams()

  // Espejo de /users: el usuario/tab del panel viven en la URL.
  const panelUserId = searchParams.get('user')
  const { tab: detailTab, setTab: setDetailTab, applyTab } = useUrlTab({
    tabs: USER_DETAIL_TABS,
    fallback: 'profile',
  })

  const { data: usersResponse, isLoading, isFetching, error, refetch } = useGlobalUsers({
    page,
    pageSize,
    search: searchTerm,
    enabled: canManage,
  })
  const userMutations = useUserMutations([globalUserQueryKeys.all])

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!usersResponse,
  })

  const users = usersResponse?.data ?? []
  const filteredUsers = filterStatus === "all" ? users : users.filter((u) => u.status === filterStatus)

  // Deep-link: espejo de /users (useUserById, GET /users/{id} — sin filtro
  // de organización, sirve igual acá).
  const foundInPage = filteredUsers.find((u) => u.id === panelUserId) ?? null
  const needsFallbackFetch = !!panelUserId && !foundInPage
  const { data: fallbackUser } = useUserById(needsFallbackFetch ? panelUserId : null, needsFallbackFetch && canManage)
  const selectedUser = foundInPage ?? fallbackUser ?? null

  const profileForm = useUserProfileForm(selectedUser, canManage, userMutations)

  const guardRef = useRef<UserDetailPanelGuardApi | null>(null)
  const onRegisterGuard = useCallback((api: UserDetailPanelGuardApi | null) => {
    guardRef.current = api
  }, [])

  const navigateToUser = useCallback((userId: string | null, tab: UserDetailTab = 'profile') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (userId) {
        next.set('user', userId)
        applyTab(next, tab)
      } else {
        next.delete('user')
        next.delete('tab')
      }
      return next
    }, { replace: true })
  }, [setSearchParams, applyTab])

  if (!canManage) {
    return <UserPageEmptyState type="access-denied" />
  }

  if (showPageLoader) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  const closeDialog = (dialog: keyof UserDialogsState) => {
    if (dialog === 'deletingUser') setDeletingUser(null)
    if (dialog === 'showCreateDialog') setShowCreateDialog(false)
  }

  const handleSelectUser = (user: User, tab?: UserDetailTab) => {
    const targetTab = tab ?? (user.id === panelUserId ? detailTab : 'profile')
    const proceed = () => navigateToUser(user.id, targetTab)
    if (guardRef.current) guardRef.current.attemptNavigate(proceed)
    else proceed()
  }

  const handleClosePanel = () => navigateToUser(null)

  const handleTabChange = (tab: UserDetailTab) => {
    if (!panelUserId) return
    setDetailTab(tab)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0">
        <PageHeader
          icon={Users}
          title={t('header.title')}
          subtitle={t('global-admin:sections.usersSubtitle')}
          badges={[
            { label: "", value: t('header.usersCount', { count: usersResponse?.total ?? filteredUsers.length }) }
          ]}
          onRefresh={handleRefresh}
          isLoading={isRefreshing || isFetching}
          hasError={!!error}
          primaryAction={{
            label: t('header.addUser'),
            icon: Plus,
            onClick: () => setShowCreateDialog(true),
            disabled: !!error,
          }}
          searchConfig={{
            placeholder: t('header.searchPlaceholder'),
            value: searchTerm,
            onChange: (value) => {
              setSearchTerm(value)
              setPage(1)
            },
            triggerOnEnter: true,
          }}
        >
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-36 h-8 hover:cursor-pointer text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('header.filterAllStatus')}</SelectItem>
              <SelectItem value="active">{t('common:active')}</SelectItem>
              <SelectItem value="inactive">{t('common:inactive')}</SelectItem>
              <SelectItem value="pending">{t('common:pending')}</SelectItem>
            </SelectContent>
          </Select>
        </PageHeader>
      </div>

      {error ? (
        <UserContentEmptyState
          type="error"
          message={(error as Error).message}
          onRetry={handleRefresh}
        />
      ) : !isTableLoading && !isTableFetching && filteredUsers.length === 0 ? (
        <UserContentEmptyState type="empty" />
      ) : (
        <GlobalAdminUsersTable
          users={filteredUsers}
          onSelectUser={handleSelectUser}
          selectedUserId={panelUserId}
          isTableLoading={isTableLoading}
          isTableFetching={isTableFetching}
          pagination={{
            page: usersResponse?.page || page,
            pageSize: usersResponse?.page_size || pageSize,
            hasNext: usersResponse?.has_next,
            hasPrevious: (usersResponse?.page || page) > 1,
            onPageChange: (newPage: number) => setPage(newPage),
            onPageSizeChange: (newPageSize: number) => {
              setPageSize(newPageSize)
              setPage(1)
            },
            pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS
          }}
        />
      )}

      <UserDetailPanel
        open={!!panelUserId}
        user={selectedUser}
        activeTab={detailTab}
        onTabChange={handleTabChange}
        onClose={handleClosePanel}
        onDeleteUser={() => selectedUser && setDeletingUser(selectedUser)}
        availableTabs={USER_DETAIL_TABS}
        userMutations={userMutations}
        profileForm={profileForm}
        canUpdate={canManage}
        canDelete={canManage}
        canManageRootAdmin={canManage}
        onRegisterGuard={onRegisterGuard}
        organizationsTab={{ canManageMembers: canManage }}
      />

      <UserPageDialogs
        state={{ showCreateDialog, deletingUser }}
        onCloseDialog={closeDialog}
        onUpdateState={(updates) => {
          if ('showCreateDialog' in updates) setShowCreateDialog(!!updates.showCreateDialog)
          if ('deletingUser' in updates) setDeletingUser(updates.deletingUser ?? null)
        }}
        userMutations={userMutations}
        onUsersUpdated={() => void refetch()}
        createUserAddToOrganization={false}
        canCreate={canManage}
        canDelete={canManage}
      />
    </div>
  )
}
