"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import { useUsers } from "@/hooks/useUsers"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { type Role, exportRoles } from "@/services/rbac"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import CreateRoleSheet from "@/components/roles/roles-create-sheet"
import EditRoleSheet from "@/components/roles/roles-edit-sheet"
import AssignRolesSheet from "@/components/roles/roles-assign-sheet"
import AssignRoleToUsersDialog from "@/components/roles/roles-assign-to-users-sheet"
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
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [assigningRoleToUsers, setAssigningRoleToUsers] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [cloningRole, setCloningRole] = useState<Role | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingUsers] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isExportingRoles, setIsExportingRoles] = useState(false)
  const [showImportSheet, setShowImportSheet] = useState(false)
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set())

  // Permissions check
  const { canAccessRoles, hasPermission, hasAnyPermission, isRootAdmin, isLoading: isLoadingPermissions } = useUserPermissions()

  // Permisos específicos
  const canReadRbac = isRootAdmin || hasPermission('rbac:r')
  const canManageRbac = isRootAdmin || hasAnyPermission(['rbac:c', 'rbac:u', 'rbac:d'])
  const canExportRoles = isRootAdmin || hasPermission('rbac:r')
  const canImportRoles = isRootAdmin || (hasPermission('rbac:c') && hasPermission('rbac:u'))

  // Data fetching - solo si tiene permisos de lectura
  const { data: rolesResponse, isLoading, isFetching, error, refetch: refetchRoles } = useRoles(canReadRbac, page, pageSize, searchTerm)
  const { deleteRole, cloneRole } = useRoleMutations()
  // Users data - we'll use refetch to load on demand, so disable automatic fetching
  const { data: usersResponse } = useUsers(false)

  // Derived data
  const roles = rolesResponse?.data || []
  const users = usersResponse?.data || []

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!rolesResponse,
  })

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
    assignToUsers: (role: Role) => {
      setTimeout(() => {
        setAssigningRoleToUsers(role)
      }, 0)
    },
    edit: (role: Role) => {
      setTimeout(() => {
        setEditingRole(role)
      }, 0)
    },
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
    assignToUsers: () => setAssigningRoleToUsers(null),
    edit: () => setEditingRole(null),
    delete: () => setDeletingRole(null),
    assignUser: () => setAssigningUserId(null),
    clone: () => setCloningRole(null)
  }

  const confirmDeleteRole = async () => {
    if (!deletingRole) return

    await new Promise<void>((resolve, reject) => {
      deleteRole.mutate(deletingRole.id, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  const confirmCloneRole = async (copyUsers: boolean) => {
    if (!cloningRole) return

    await new Promise<void>((resolve, reject) => {
      cloneRole.mutate({ roleId: cloningRole.id, copyUsers }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  // Early returns for different states
  if (isLoadingPermissions) return <RolesLoadingState />
  if (!canAccessRoles) return <RolesAccessDenied />
  if (showPageLoader) return <RolesLoadingState />

  // const totalPermissions = error ? 0 : roles.reduce(
  //   (acc, role) => acc + (role.permission_num || role.permissions?.length || 0), 
  //   0
  // )

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
            canManage={canManageRbac}
            onExport={handleExportRoles}
            onImport={() => setShowImportSheet(true)}
            canExport={canExportRoles}
            canImport={canImportRoles}
            exportSelectedCount={selectedExportIds.size}
            isExporting={isExportingRoles}
          />
        }
        headerClassName="p-2 sm:p-4 md:p-4 lg:p-6 pb-0 sm:pb-0 md:pb-0 lg:pb-0"
        columns={[
          {
            content: error ? (
              <RolesContentEmptyState error={error} onRetry={handleRefresh} />
            ) : (
              <RolesTable
                roles={roles}
                isTableLoading={isTableLoading}
                isTableFetching={isTableFetching}
                isLoadingUsers={isLoadingUsers}
                onAssignToUsers={openDialog.assignToUsers}
                onEditRole={openDialog.edit}
                onDeleteRole={openDialog.delete}
                onCloneRole={openDialog.clone}
                canManage={canManageRbac}
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
            className: "p-2 sm:p-4 md:p-4 lg:p-6 pt-0 sm:pt-0 md:pt-0 lg:pt-0",
          },
        ]}
      />

      {/* Dialogs and Sheets */}
      <CreateRoleSheet
        open={showCreateDialog}
        onOpenChange={(open) => !open && closeDialog.create()}
      />

      <EditRoleSheet
        role={editingRole}
        open={!!editingRole}
        onOpenChange={(open) => !open && closeDialog.edit()}
      />

      <AssignRolesSheet
        user={users.find(u => u.id === assigningUserId) || null}
        open={!!assigningUserId}
        onOpenChange={(open) => !open && closeDialog.assignUser()}
      />

      <AssignRoleToUsersDialog
        role={assigningRoleToUsers}
        open={!!assigningRoleToUsers}
        onOpenChange={(open) => !open && closeDialog.assignToUsers()}
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
      />

      <RolesImportSheet
        open={showImportSheet}
        onOpenChange={(open) => !open && setShowImportSheet(false)}
        onImportSuccess={handleRefresh}
      />
    </>
  )
}