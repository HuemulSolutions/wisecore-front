"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import { useRoleUsersStaging } from "@/hooks/useRoleUsersStaging"
import { useRolePermissionsStaging } from "@/hooks/useRolePermissionsStaging"
import { useRoleDetailsForm } from "@/hooks/useRoleDetailsForm"
import { useRolesMap } from "@/contexts/role-refs-context"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { type Role, exportRoles } from "@/services/rbac"
import type { RoleDetailTab } from "@/types/roles"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import CreateRoleSheet from "@/components/roles/roles-create-sheet"
import CreateUserSheet from "@/components/users/users-create-sheet"
import { RoleDetailPanel, type RoleDetailPanelGuardApi } from "@/components/roles/roles-detail-panel"
import {
  RolesLoadingState,
  RolesContentEmptyState,
  RolesAccessDenied,
  RolesSearch,
  RolesTable,
  DeleteRoleDialog,
  CloneRoleDialog,
  RolesImportSheet
} from "@/components/roles"

/**
 * Roles management page
 * Provides interface for creating, editing, and managing user roles and permissions
 */
export default function Roles() {
  useAuth()
  const { t } = useTranslation('roles')

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [cloningRole, setCloningRole] = useState<Role | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isExportingRoles, setIsExportingRoles] = useState(false)
  const [showImportSheet, setShowImportSheet] = useState(false)
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set())
  const [createUserSheetOpen, setCreateUserSheetOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // El rol/tab seleccionados viven en la URL (?role=<id>&tab=users), espejo de
  // /users — ver src/pages/users.tsx.
  const selectedRoleId = searchParams.get('role')
  const detailTab: RoleDetailTab = (() => {
    const tab = searchParams.get('tab')
    return tab === 'details' || tab === 'users' || tab === 'hierarchy' ? tab : 'permissions'
  })()

  // Permisos: matriz declarativa (ver ia context/rbac-audit-guide.md, 14ª pasada)
  const { isLoading: isLoadingPermissions } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can } = usePageAccess('roles')

  const canList = can('listRoles')
  const canCreate = can('createRole')
  const canUpdate = can('updateRole')
  const canDelete = can('deleteRole')
  const canClone = can('cloneRole')
  const canAssignRoleToUsers = can('assignRoleToUsers')
  const canListUsers = can('listUsers')
  const canCreateUser = can('createUser')
  const canExportRoles = can('exportRoles')
  const canImportRoles = can('importRoles')

  // Data fetching - solo si tiene permisos de lectura y hay organización activa
  const { data: rolesResponse, isLoading, isFetching, error, refetch: refetchRoles } = useRoles(
    canList && !!selectedOrganizationId && !!organizationToken,
    page,
    pageSize,
    searchTerm
  )
  const { deleteRole, cloneRole } = useRoleMutations()
  const { byId: rolesById } = useRolesMap(canList)

  // Derived data
  const roles = rolesResponse?.data || []

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!rolesResponse,
  })

  // Deep-link: no existe GET /rbac/roles/{id} — se resuelve contra el catálogo
  // completo (useRolesMap), igual que el nombre del rol padre en jerarquía.
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? (selectedRoleId ? rolesById[selectedRoleId] : null) ?? null

  const staging = useRoleUsersStaging(selectedRole?.id ?? null, {
    enabled: canListUsers && !!selectedRole,
    canAssignUsers: canAssignRoleToUsers,
    expectedAssignedCount: selectedRole?.users_count,
  })
  const permsStaging = useRolePermissionsStaging(selectedRole?.id ?? null, {
    enabled: canUpdate && !!selectedRole,
    canUpdate,
  })
  const detailsForm = useRoleDetailsForm(selectedRole, canUpdate)

  const guardRef = useRef<RoleDetailPanelGuardApi | null>(null)
  const onRegisterGuard = useCallback((api: RoleDetailPanelGuardApi | null) => {
    guardRef.current = api
  }, [])

  // Event handlers

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchRoles()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportRoles = async () => {
    if (!canExportRoles) return
    if (selectedExportIds.size === 0) {
      toast.error(t('exportImport.exportSelectionRequired'))
      return
    }
    setIsExportingRoles(true)
    try {
      await exportRoles({ role_ids: [...selectedExportIds] })
      setSelectedExportIds(new Set())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('exportImport.exportError'))
    } finally {
      setIsExportingRoles(false)
    }
  }

  const openDialog = {
    create: () => setShowCreateDialog(true),
    delete: (role: Role) => {
      setTimeout(() => {
        setDeletingRole(role)
      }, 0)
    },
    clone: (role: Role) => {
      setTimeout(() => {
        setCloningRole(role)
      }, 0)
    }
  }

  const closeDialog = {
    create: () => setShowCreateDialog(false),
    delete: () => setDeletingRole(null),
    clone: () => setCloningRole(null)
  }

  const confirmDeleteRole = async () => {
    if (!deletingRole || !canDelete) return

    await new Promise<void>((resolve, reject) => {
      deleteRole.mutate(deletingRole.id, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  const confirmCloneRole = async (copyUsers: boolean) => {
    if (!cloningRole || !canClone) return

    await new Promise<void>((resolve, reject) => {
      cloneRole.mutate({ roleId: cloningRole.id, copyUsers }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  // Navegación del panel de detalle: siempre a través de la URL — espejo de
  // /users.
  const navigateToRole = (roleId: string | null, tab: RoleDetailTab = 'permissions') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (roleId) {
        next.set('role', roleId)
        next.set('tab', tab)
      } else {
        next.delete('role')
        next.delete('tab')
      }
      return next
    }, { replace: true })
  }

  const handleSelectRole = (role: Role, tab?: RoleDetailTab) => {
    const targetTab = tab ?? (role.id === selectedRoleId ? detailTab : 'permissions')
    const proceed = () => navigateToRole(role.id, targetTab)
    if (guardRef.current) guardRef.current.attemptNavigate(proceed)
    else proceed()
  }

  const handleClosePanel = () => navigateToRole(null)

  const handleTabChange = (tab: RoleDetailTab) => {
    if (!selectedRoleId) return
    navigateToRole(selectedRoleId, tab)
  }

  // Early returns for different states
  if (isLoadingPermissions) return <RolesLoadingState />
  if (!canAccessPage) return <RolesAccessDenied />
  if (showPageLoader) return <RolesLoadingState />

  return (
    <>
      <HuemulPageLayout
        header={
          <RolesSearch
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setPage(1)
            }}
            rolesCount={rolesResponse?.total ?? roles.length}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onCreateRole={openDialog.create}
            hasError={!!error}
            canCreate={canCreate}
            onExport={handleExportRoles}
            onImport={() => setShowImportSheet(true)}
            canExport={canExportRoles}
            canImport={canImportRoles}
            exportSelectedCount={selectedExportIds.size}
            isExporting={isExportingRoles}
          />
        }
        headerClassName="p-4 md:p-6 pb-0 md:pb-0"
        columns={[
          {
            content: error ? (
              <RolesContentEmptyState error={error} onRetry={handleRefresh} />
            ) : (
              <RolesTable
                roles={roles}
                isTableLoading={isTableLoading}
                isTableFetching={isTableFetching}
                onSelectRole={handleSelectRole}
                selectedRoleId={selectedRoleId}
                rolesById={rolesById}
                selectedIds={selectedExportIds}
                onSelectionChange={setSelectedExportIds}
                pagination={{
                  page: rolesResponse?.page || page,
                  pageSize: rolesResponse?.page_size || pageSize,
                  hasNext: rolesResponse?.has_next,
                  hasPrevious: (rolesResponse?.page || page) > 1,
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
          },
          {
            content: selectedRole ? (
              <RoleDetailPanel
                role={selectedRole}
                activeTab={detailTab}
                onTabChange={handleTabChange}
                onClose={handleClosePanel}
                onDeleteRole={() => openDialog.delete(selectedRole)}
                onCloneRole={() => openDialog.clone(selectedRole)}
                staging={staging}
                permsStaging={permsStaging}
                detailsForm={detailsForm}
                rolesById={rolesById}
                canUpdate={canUpdate}
                canDelete={canDelete}
                canClone={canClone}
                canAssignUsers={canAssignRoleToUsers}
                canListUsers={canListUsers}
                canCreateUser={canCreateUser}
                onOpenCreateUserSheet={() => setCreateUserSheetOpen(true)}
                onRegisterGuard={onRegisterGuard}
              />
            ) : null,
            show: !!selectedRoleId,
            defaultSize: 32,
            minSize: 24,
            maxSize: 45,
            className: "border-l border-border",
          },
        ]}
      />

      {/* Dialogs and Sheets */}
      <CreateRoleSheet
        open={showCreateDialog}
        onOpenChange={(open) => !open && closeDialog.create()}
        canCreate={canCreate}
      />

      <DeleteRoleDialog
        open={!!deletingRole}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog.delete()
          }
        }}
        role={deletingRole}
        onConfirm={confirmDeleteRole}
        canDelete={canDelete}
      />

      <CloneRoleDialog
        open={!!cloningRole}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog.clone()
          }
        }}
        role={cloningRole}
        onConfirm={confirmCloneRole}
        canClone={canClone}
      />

      <RolesImportSheet
        open={showImportSheet}
        onOpenChange={(open) => !open && setShowImportSheet(false)}
        onImportSuccess={handleRefresh}
        canImport={canImportRoles}
      />

      {/* Sibling del layout — nunca anidado en el panel ni en el popover, ver
          ia context/inline-create-entity-in-sheet-guide.md. Al crearse, el
          usuario entra al staging del rol seleccionado como "por agregar". */}
      <CreateUserSheet
        open={createUserSheetOpen}
        onOpenChange={setCreateUserSheetOpen}
        canCreate={canCreateUser}
        onSuccess={(user) => {
          staging.add(user, { created: true })
          setCreateUserSheetOpen(false)
        }}
      />
    </>
  )
}
