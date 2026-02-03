"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useUserMutations } from "@/hooks/useUsers"
import { getAllOrganizations, addOrganization, updateOrganization, deleteOrganization } from "@/services/organizations"
import { getGlobalUsers } from "@/services/users"
import { type User } from "@/types/users"
import { Check, Edit, Shield, ShieldCheck, Trash2, Users, X, Building } from "lucide-react"

import {
  OrganizationTable,
  OrganizationPageHeader,
  OrganizationPageSkeleton,
  OrganizationPageEmptyState,
  OrganizationContentEmptyState,
  CreateOrganizationDialog,
  EditOrganizationDialog,
  DeleteOrganizationDialog,
  type Organization
} from "@/components/organization"

import {
  UserPageHeader,
  UserPageSkeleton,
  UserPageEmptyState,
  UserPageDialogs,
  UserContentEmptyState,
  type UserPageState,
  formatDate,
  getStatusColor,
  translateStatus
} from "@/components/users"

interface GlobalUsersResponse {
  data: User[]
}

interface OrganizationPageState {
  searchTerm: string
  selectedOrganizations: Set<string>
  editingOrganization: Organization | null
  showCreateDialog: boolean
  deletingOrganization: Organization | null
}

function OrganizationsSection() {
  const [state, setState] = useState<OrganizationPageState>({
    searchTerm: "",
    selectedOrganizations: new Set(),
    editingOrganization: null,
    showCreateDialog: false,
    deletingOrganization: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const canListOrgs = isRootAdmin || hasAnyPermission(['organization:l', 'organization:r'])
  const canUpdateOrg = isRootAdmin || hasPermission('organization:u')
  const canDeleteOrg = isRootAdmin || hasPermission('organization:d')

  const { data: organizationsResponse, isLoading, error } = useQuery({
    queryKey: ["organizations", page, pageSize],
    queryFn: () => getAllOrganizations(page, pageSize),
    enabled: canListOrgs,
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => addOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("showCreateDialog")
      toast.success("Organization created successfully")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("editingOrganization")
      toast.success("Organization updated successfully")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("deletingOrganization")
      toast.success("Organization deleted successfully")
    },
  })

  if (isLoadingPermissions) {
    return <OrganizationPageSkeleton />
  }

  if (!canListOrgs) {
    return <OrganizationPageEmptyState type="access-denied" />
  }

  if (isLoading) {
    return <OrganizationPageSkeleton />
  }

  const organizations = (organizationsResponse?.data || []) as Organization[]

  const filteredOrganizations = organizations.filter((org: Organization) => {
    const matchesSearch = org.name
      .toLowerCase()
      .includes(state.searchTerm.toLowerCase()) ||
      org.description
        ?.toLowerCase()
        .includes(state.searchTerm.toLowerCase())

    return matchesSearch
  })

  const updateState = (updates: Partial<OrganizationPageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof OrganizationPageState) => {
    setState(prev => ({
      ...prev,
      [dialog]: dialog === "editingOrganization" || dialog === "deletingOrganization" ? null : false
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] })
      toast.success("Data refreshed")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOrganizationSelection = (organizationId: string) => {
    const newSelection = new Set(state.selectedOrganizations)
    if (newSelection.has(organizationId)) {
      newSelection.delete(organizationId)
    } else {
      newSelection.add(organizationId)
    }
    updateState({ selectedOrganizations: newSelection })
  }

  const handleEditOrganization = async (organization: Organization) => {
    updateState({ editingOrganization: organization })
  }

  const handleDeleteOrganization = async (organization: Organization) => {
    updateState({ deletingOrganization: organization })
  }

  const handleSelectAll = () => {
    if (state.selectedOrganizations.size === filteredOrganizations.length) {
      updateState({ selectedOrganizations: new Set() })
    } else {
      updateState({ selectedOrganizations: new Set(filteredOrganizations.map((org: Organization) => org.id)) })
    }
  }

  const handleClearFilters = () => {
    updateState({ searchTerm: "" })
  }

  return (
    <div className="space-y-4">
      <OrganizationPageHeader
        organizationCount={organizationsResponse?.total || filteredOrganizations.length}
        onCreateOrganization={() => updateState({ showCreateDialog: true })}
        onRefresh={handleRefresh}
        isLoading={isLoading || isRefreshing}
        searchTerm={state.searchTerm}
        onSearchChange={(value: string) => updateState({ searchTerm: value })}
        canManage={isRootAdmin}
      />

      {error ? (
        <OrganizationContentEmptyState 
          type="error" 
          message={(error as Error).message} 
          onRetry={handleRefresh}
        />
      ) : filteredOrganizations.length === 0 && organizations.length === 0 ? (
        <OrganizationContentEmptyState 
          type="empty"
          onCreateFirst={() => updateState({ showCreateDialog: true })}
        />
      ) : filteredOrganizations.length === 0 ? (
        <OrganizationContentEmptyState 
          type="no-results"
          onClearFilters={handleClearFilters}
        />
      ) : (
        <OrganizationTable
          organizations={filteredOrganizations}
          selectedOrganizations={state.selectedOrganizations}
          onOrganizationSelection={handleOrganizationSelection}
          onSelectAll={handleSelectAll}
          onEditOrganization={handleEditOrganization}
          onDeleteOrganization={handleDeleteOrganization}
          pagination={{
            page: organizationsResponse?.page || page,
            pageSize: organizationsResponse?.page_size || pageSize,
            hasNext: organizationsResponse?.has_next,
            hasPrevious: (organizationsResponse?.page || page) > 1,
            onPageChange: (newPage: number) => setPage(newPage),
            onPageSizeChange: (newPageSize: number) => {
              setPageSize(newPageSize)
              setPage(1)
            },
            pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000]
          }}
          showFooterStats={false}
          canUpdate={canUpdateOrg}
          canDelete={canDeleteOrg}
        />
      )}

      <CreateOrganizationDialog
        open={state.showCreateDialog}
        onOpenChange={(open) => updateState({ showCreateDialog: open })}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />

      {state.editingOrganization && (
        <EditOrganizationDialog
          open={!!state.editingOrganization}
          onOpenChange={(open: boolean) => !open && closeDialog("editingOrganization")}
          organization={state.editingOrganization}
          onSave={() => {
            if (state.editingOrganization) {
              updateMutation.mutate({
                id: state.editingOrganization.id,
                data: {
                  name: state.editingOrganization.name,
                  description: state.editingOrganization.description || undefined
                }
              })
            }
          }}
          isSaving={updateMutation.isPending}
          onOrgChange={(org: Organization) => updateState({ editingOrganization: org })}
        />
      )}

      {state.deletingOrganization && (
        <DeleteOrganizationDialog
          open={!!state.deletingOrganization}
          onOpenChange={(open: boolean) => !open && closeDialog("deletingOrganization")}
          organization={state.deletingOrganization}
          onConfirm={() => {
            if (state.deletingOrganization) {
              deleteMutation.mutate(state.deletingOrganization.id)
            }
          }}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

function UsersSection() {
  const [state, setState] = useState<UserPageState>({
    searchTerm: "",
    filterStatus: "all",
    selectedUsers: new Set(),
    editingUser: null,
    organizationUser: null,
    showCreateDialog: false,
    assigningRoleUser: null,
    deletingUser: null,
    rootAdminUser: null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { canAccessUsers, isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const canListUsers = isRootAdmin || hasAnyPermission(['user:l', 'user:r'])
  const canCreateUser = isRootAdmin || hasPermission('user:c')
  const canUpdateUser = isRootAdmin || hasPermission('user:u')
  const canDeleteUser = isRootAdmin || hasPermission('user:d')

  const globalUsersQueryKey = ["global-users"] as const

  const { data: usersResponse, isLoading, error, refetch } = useQuery({
    queryKey: globalUsersQueryKey,
    queryFn: getGlobalUsers,
    enabled: canListUsers
  }) as {
    data: GlobalUsersResponse | undefined
    isLoading: boolean
    error: any
    refetch: () => Promise<any>
  }
  const userMutations = useUserMutations([globalUsersQueryKey])

  if (isLoadingPermissions) {
    return <UserPageSkeleton />
  }

  if (!isRootAdmin && !canAccessUsers) {
    return <UserPageEmptyState type="access-denied" />
  }

  if (isLoading) {
    return <UserPageSkeleton />
  }

  const users = usersResponse?.data ?? []
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = `${user.name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(state.searchTerm.toLowerCase())
    const matchesFilter = state.filterStatus === "all" || user.status === state.filterStatus

    return matchesSearch && matchesFilter
  }) || []

  const updateState = (updates: Partial<UserPageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof UserPageState) => {
    setState(prev => ({ ...prev, [dialog]: null }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: globalUsersQueryKey })
      await refetch()
      toast.success('Data refreshed')
    } catch {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEditUser = async (user: User) => {
    updateState({ editingUser: user })
  }

  const handleAssignOrganization = async (user: User) => {
    updateState({ organizationUser: user })
  }

  const handleDeleteUser = async (user: User) => {
    updateState({ deletingUser: user })
  }

  const handleManageRootAdmin = async (user: User) => {
    updateState({ rootAdminUser: user })
  }

  const handleMakeOrganizationAdmin = (user: User) => {
    toast.info(`Organization admin action is pending for ${user.name} ${user.last_name}`)
    console.log("Organization admin intent", user)
  }

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      label: "Name",
      render: (user) => (
        <div className="flex flex-col gap-0">
          <span className="text-xs font-medium text-foreground leading-tight">
            {user.name} {user.last_name}
          </span>
          {user.activated_at && (
            <span className="text-[10px] text-muted-foreground leading-tight">
              Activated: {formatDate(user.activated_at)}
            </span>
          )}
        </div>
      )
    },
    {
      key: "email",
      label: "Email",
      render: (user) => (
        <span className="text-xs text-blue-600 font-medium">{user.email}</span>
      )
    },
    {
      key: "root-admin",
      label: "Root Admin",
      render: (user) => (
        user.is_root_admin ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            <Shield className="w-2 h-2 mr-0.5" />
            Yes
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        )
      )
    },
    {
      key: "status",
      label: "Status",
      render: (user) => (
        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
          {translateStatus(user.status)}
        </Badge>
      )
    },
    {
      key: "created",
      label: "Created",
      render: (user) => (
        <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
      )
    }
  ]

  const actions: TableAction<User>[] = [
    {
      key: "approve",
      label: "Approve User",
      icon: Check,
      onClick: (user) => userMutations.approveUser.mutate(user.id),
      show: (user) => user.status === 'pending' && canUpdateUser,
      className: "text-green-600"
    },
    {
      key: "reject",
      label: "Reject User",
      icon: X,
      onClick: (user) => userMutations.rejectUser.mutate(user.id),
      show: (user) => user.status === 'pending' && canUpdateUser,
      separator: true,
      destructive: true
    },
    {
      key: "assign-organization",
      label: "Assign to Organization",
      icon: Building,
      onClick: handleAssignOrganization,
      show: () => isRootAdmin
    },
    {
      key: "manage-root-admin",
      label: "Manage Root Admin",
      icon: ShieldCheck,
      onClick: handleManageRootAdmin,
      show: () => isRootAdmin
    },
    {
      key: "make-org-admin",
      label: "Make Organization Admin",
      icon: Shield,
      onClick: handleMakeOrganizationAdmin,
      show: () => isRootAdmin,
      separator: true
    },
    {
      key: "edit",
      label: "Edit User",
      icon: Edit,
      onClick: handleEditUser,
      show: () => canUpdateUser,
      separator: true
    },
    {
      key: "delete",
      label: "Delete User",
      icon: Trash2,
      onClick: handleDeleteUser,
      show: () => canDeleteUser,
      destructive: true
    }
  ]

  return (
    <div className="space-y-4">
      <UserPageHeader
        userCount={filteredUsers.length}
        onCreateUser={() => updateState({ showCreateDialog: true })}
        onRefresh={handleRefresh}
        isLoading={isLoading || isRefreshing}
        hasError={!!error}
        searchTerm={state.searchTerm}
        onSearchChange={(value) => updateState({ searchTerm: value })}
        filterStatus={state.filterStatus}
        onStatusFilterChange={(value) => updateState({ filterStatus: value })}
        canCreate={canCreateUser}
      />

      {error ? (
        <UserContentEmptyState 
          type="error" 
          message={error.message} 
          onRetry={handleRefresh}
        />
      ) : filteredUsers.length === 0 ? (
        <UserContentEmptyState 
          type="empty"
        />
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          actions={actions}
          getRowKey={(user) => user.id}
          emptyState={{
            icon: Users,
            title: "No users found",
            description: "No users have been created yet or match your search criteria."
          }}
          showFooterStats={false}
        />
      )}

      <UserPageDialogs
        state={state}
        onCloseDialog={closeDialog}
        onUpdateState={updateState}
        userMutations={userMutations}
        onUsersUpdated={() => {
          void refetch()
        }}
        createUserAddToOrganization={false}
      />
    </div>
  )
}

export default function GlobalAdminPage() {
  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Global Admin Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage organizations and users across all organizations.
          </p>
        </div>
        <Tabs defaultValue="organizations" className="w-full">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Organization Users</TabsTrigger>
          </TabsList>
          <TabsContent value="organizations" className="mt-4">
            <OrganizationsSection />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <UsersSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
