"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { type Role, exportRoles } from "@/services/rbac"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import CreateRoleSheet from "@/components/roles/roles-create-sheet"
import EditRoleSheet from "@/components/roles/roles-edit-sheet"
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
  const [assigningRoleToUsers, setAssigningRoleToUsers] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [cloningRole, setCloningRole] = useState<Role | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isExportingRoles, setIsExportingRoles] = useState(false)
  const [showImportSheet, setShowImportSheet] = useState(false)
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set())

  // Permisos: matriz declarativa (ver ia context/rbac-audit-guide.md, 14ª pasada)
  const { isLoading: isLoadingPermissions } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const { canAccessPage, can } = usePageAccess('roles')

  const canList = can('listRoles')
  const canCreate = can('createRole')
  const canUpdate = can('updateRole')
  const canDelete = can('deleteRole')
  const canClone = can('cloneRole')
  const canAssign = can('assignRoleToUsers')
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

  // Derived data
  const roles = rolesResponse?.data || []

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

  // Early returns for different states
  if (isLoadingPermissions) return <RolesLoadingState />
  if (!canAccessPage) return <RolesAccessDenied />
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
            canCreate={canCreate}
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
                onAssignToUsers={openDialog.assignToUsers}
                onEditRole={openDialog.edit}
                onDeleteRole={openDialog.delete}
                onCloneRole={openDialog.clone}
                canUpdate={canUpdate}
                canDelete={canDelete}
                canClone={canClone}
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
        canCreate={canCreate}
      />

      <EditRoleSheet
        role={editingRole}
        open={!!editingRole}
        onOpenChange={(open) => !open && closeDialog.edit()}
        canUpdate={canUpdate}
      />

      <AssignRoleToUsersDialog
        role={assigningRoleToUsers}
        open={!!assigningRoleToUsers}
        onOpenChange={(open) => !open && closeDialog.assignToUsers()}
        canAssign={canAssign}
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
    </>
  )
}