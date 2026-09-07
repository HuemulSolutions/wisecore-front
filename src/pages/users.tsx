  "use client"

import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from 'react-i18next'
import { useSearchParams } from "react-router-dom"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { usePageAccess } from "@/hooks/usePageAccess"
import { type User, type UsersResponse, type UserListState, type UserDialogsState, type UserDetailTab } from "@/types/users"
import { useUsers, useUserById, useUserMutations, userQueryKeys } from "@/hooks/useUsers"
import { useUserRolesStaging } from "@/hooks/useUserRolesStaging"
import { useUserProfileForm } from "@/hooks/useUserProfileForm"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import CreateRoleSheet from "@/components/roles/roles-create-sheet"

// Components
import {
  UserTable,
  UserPageHeader,
  UserPageSkeleton,
  UserPageEmptyState,
  UserPageDialogs,
  UserContentEmptyState,
  UserDetailPanel,
  UsersBulkActionsBar,
  type UserDetailPanelGuardApi,
} from "@/components/users"

export default function UsersPage() {
  const [state, setState] = useState<UserListState>({
    searchTerm: "",
    selectedUsers: new Set(),
    editingUser: null,
    organizationUser: null,
    showCreateDialog: false,
    deletingUser: null,
    rootAdminUser: null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchParams, setSearchParams] = useSearchParams()
  const [createRoleSheetOpen, setCreateRoleSheetOpen] = useState(false)
  const [createRoleInitialName, setCreateRoleInitialName] = useState("")

  // El usuario/tab seleccionados viven en la URL (?user=<id>&tab=roles), no en
  // un useState espejo: así el panel es linkeable y sobrevive al refresh. Ver
  // precedente src/pages/assets-types.tsx:86-93.
  const selectedUserId = searchParams.get('user')
  const detailTab: UserDetailTab = searchParams.get('tab') === 'roles' ? 'roles' : 'profile'

  // Get permissions and organization context
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('users')
  // `isRootAdmin` es el eje del flag de sistema `is_root_admin`
  // (PATCH /users/{id}/root-admin), no un bypass de los permisos org-scoped.
  const { isRootAdmin } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const queryClient = useQueryClient()
  const { t } = useTranslation(['users', 'common'])

  // Permisos específicos (el bypass de isOrgAdmin ya vive dentro de `can`)
  const canListUsers = can('listUsers')
  const canCreateUser = can('createUser')
  const canUpdateUser = can('updateUser')
  const canDeleteUser = can('deleteUser')
  const canAssignRoles = can('assignRoles')
  const canListRoles = can('listRoles')
  const canCreateRole = can('createRole')

  // Fetch users and mutations - solo si tiene permisos de listar
  const { data: usersResponse, isLoading, isFetching, isError, refetch } = useUsers(
    !!selectedOrganizationId && !!organizationToken && canListUsers,
    selectedOrganizationId || undefined,
    page,
    pageSize,
    state.searchTerm || undefined
  ) as {
    data: UsersResponse | undefined,
    isLoading: boolean,
    isFetching: boolean,
    isError: boolean,
    refetch: () => Promise<unknown>
  }
  const userMutations = useUserMutations()

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!usersResponse,
  })

  const filteredUsers = usersResponse?.data || []

  // Deep-link: el usuario de la URL puede no estar en la página actual de la
  // tabla (otra página, otro filtro de búsqueda) — fallback a useUserById.
  const selectedUserFromPage = filteredUsers.find((u) => u.id === selectedUserId) ?? null
  const needsFallbackFetch = !!selectedUserId && !selectedUserFromPage
  const { data: fallbackUser } = useUserById(
    needsFallbackFetch ? selectedUserId : null,
    needsFallbackFetch && canListUsers,
  )
  const selectedUser = selectedUserFromPage ?? fallbackUser ?? null

  // Staging de roles del usuario seleccionado: vive acá (no dentro del panel)
  // para que `CreateRoleSheet` (sibling, vía "Con permisos" del popover)
  // pueda agregar el rol recién creado sin pasar por el panel — ver
  // ia context/inline-create-entity-in-sheet-guide.md.
  const staging = useUserRolesStaging(selectedUser?.id ?? null, {
    enabled: canListRoles && !!selectedUser,
    canAssignRoles,
    expectedAssignedCount: selectedUser?.roles?.length,
  })

  // Form del tab Perfil: vive en la página (no en el panel), espejo de
  // `detailsForm` en roles.tsx — así el estado sucio sobrevive al cambio de tab.
  const profileForm = useUserProfileForm(selectedUser, canUpdateUser, userMutations)

  // Guard de descarte: registrado por el panel (ver
  // ia context/sheet-footer-batch-save-guide.md), consultado acá antes de
  // cambiar de fila.
  const guardRef = useRef<UserDetailPanelGuardApi | null>(null)
  const onRegisterGuard = useCallback((api: UserDetailPanelGuardApi | null) => {
    guardRef.current = api
  }, [])

  // Loading state for permissions
  if (isLoadingPermissions) {
    return <UserPageSkeleton />
  }

  // Access check
  if (!canAccessPage) {
    return <UserPageEmptyState type="access-denied" />
  }

  // Organization check
  if (!selectedOrganizationId || !organizationToken) {
    return <UserPageEmptyState type="no-organization" />
  }

  // Loading state
  if (showPageLoader) {
    return <UserPageSkeleton />
  }

  // State update helpers
  const updateState = (updates: Partial<UserListState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof UserDialogsState) => {
    setState(prev => ({ ...prev, [dialog]: null }))
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Invalidate the query to force a fresh fetch from the server
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      // Refetch to trigger the query execution
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  // User selection handlers
  const handleUserSelection = (userId: string) => {
    const newSelection = new Set(state.selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    updateState({ selectedUsers: newSelection })
  }

  const handleSelectAll = () => {
    if (state.selectedUsers.size === filteredUsers.length) {
      updateState({ selectedUsers: new Set() })
    } else {
      updateState({ selectedUsers: new Set(filteredUsers.map((user: User) => user.id)) })
    }
  }

  // Navegación del panel de detalle: siempre a través de la URL.
  const navigateToUser = (userId: string | null, tab: UserDetailTab = 'profile') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (userId) {
        next.set('user', userId)
        next.set('tab', tab)
      } else {
        next.delete('user')
        next.delete('tab')
      }
      return next
    }, { replace: true })
  }

  const handleSelectUser = (user: User, tab?: UserDetailTab) => {
    const targetTab = tab ?? (user.id === selectedUserId ? detailTab : 'profile')
    const proceed = () => navigateToUser(user.id, targetTab)
    if (guardRef.current) guardRef.current.attemptNavigate(proceed)
    else proceed()
  }

  const handleClosePanel = () => navigateToUser(null)

  const handleTabChange = (tab: UserDetailTab) => {
    if (!selectedUserId) return
    navigateToUser(selectedUserId, tab)
  }

  const handleOpenCreateRoleSheet = (initialName: string) => {
    setCreateRoleInitialName(initialName)
    setCreateRoleSheetOpen(true)
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <UserPageHeader
            userCount={filteredUsers.length}
            onCreateUser={() => updateState({ showCreateDialog: true })}
            onRefresh={handleRefresh}
            isLoading={isRefreshing || isFetching}
            hasError={isError}
            searchTerm={state.searchTerm}
            onSearchChange={(value) => {
              updateState({ searchTerm: value })
              setPage(1)
            }}
            canCreate={canCreateUser}
          />
        }
        headerClassName="p-4 md:p-6 pb-0 md:pb-0"
        columns={[
          {
            content: isError ? (
              <UserContentEmptyState
                type="error"
                message={t('users:emptyState.errorLoading')}
                onRetry={handleRefresh}
              />
            ) : !isTableLoading && !isTableFetching && filteredUsers.length === 0 ? (
              <UserContentEmptyState
                type="empty"
              />
            ) : (
              <UserTable
                users={filteredUsers}
                selectedUsers={state.selectedUsers}
                onUserSelection={handleUserSelection}
                onSelectAll={handleSelectAll}
                onSelectUser={handleSelectUser}
                selectedUserId={selectedUserId}
                canListRoles={canListRoles}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                pagination={{
                  page: usersResponse?.page || page,
                  pageSize: usersResponse?.page_size || pageSize,
                  hasNext: usersResponse?.has_next,
                  hasPrevious: (usersResponse?.page || page) > 1,
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newPageSize) => {
                    setPageSize(newPageSize)
                    setPage(1)
                  },
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS
                }}
              />
            ),
            className: "flex flex-col",
            minSize: 45,
            footer: {
              content: (
                <UsersBulkActionsBar
                  selectedUsers={filteredUsers.filter((u) => state.selectedUsers.has(u.id))}
                  onClear={() => updateState({ selectedUsers: new Set() })}
                  canAssignRoles={canAssignRoles}
                  canListRoles={canListRoles}
                  disabled={staging.isDirty}
                />
              ),
              show: state.selectedUsers.size > 0,
              className: "px-4 pb-4 md:px-6 md:pb-6",
            },
          },
        ]}
      />

      {/* El detalle del usuario seleccionado se muestra en un HuemulSheet
          (no como columna del layout) — se mantiene montado con `open`
          controlado por la URL para que la animación de cierre corra. */}
      <UserDetailPanel
        open={!!selectedUserId}
        user={selectedUser}
        activeTab={detailTab}
        onTabChange={handleTabChange}
        onClose={handleClosePanel}
        onDeleteUser={() => updateState({ deletingUser: selectedUser })}
        onOpenCreateRoleSheet={handleOpenCreateRoleSheet}
        userMutations={userMutations}
        profileForm={profileForm}
        canUpdate={canUpdateUser}
        canDelete={canDeleteUser}
        canManageRootAdmin={isRootAdmin}
        canAssignRoles={canAssignRoles}
        canListRoles={canListRoles}
        canCreateRole={canCreateRole}
        onRegisterGuard={onRegisterGuard}
        staging={staging}
      />

      {/* Dialogs and Sheets */}
      <UserPageDialogs
        state={state}
        onCloseDialog={closeDialog}
        onUpdateState={updateState}
        userMutations={userMutations}
        canCreate={canCreateUser}
        canUpdate={canUpdateUser}
        canDelete={canDeleteUser}
        canManageRootAdmin={isRootAdmin}
        // Asignar/quitar organizaciones es cross-org y solo se ofrece desde
        // /global-admin (root-admin-only): esta pantalla no tiene el trigger.
        canManageOrganizations={false}
      />

      {/* Sibling del layout — nunca anidado en el panel ni en el popover, ver
          ia context/inline-create-entity-in-sheet-guide.md. Al crearse, el rol
          entra al staging del usuario seleccionado como "por crear". */}
      <CreateRoleSheet
        open={createRoleSheetOpen}
        onOpenChange={setCreateRoleSheetOpen}
        canCreate={canCreateRole}
        initialName={createRoleInitialName}
        onCreated={(role) => {
          staging.add(role, { created: true })
          setCreateRoleSheetOpen(false)
        }}
      />
    </>
  )
}
