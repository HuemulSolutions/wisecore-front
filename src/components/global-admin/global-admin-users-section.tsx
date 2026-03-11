"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { handleApiError } from "@/lib/error-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useUserMutations } from "@/hooks/useUsers"
import { getGlobalUsers } from "@/services/users"
import { type User } from "@/types/users"
import { Check, Edit, Shield, ShieldCheck, Trash2, Users, X, Building, Plus } from "lucide-react"
import ProtectedComponent from "@/components/protected-component"

import {
  UserPageSkeleton,
  UserPageEmptyState,
  UserPageDialogs,
  UserContentEmptyState,
  type UserPageState,
  formatDate,
  getStatusColor,
} from "@/components/users"

interface GlobalUsersResponse {
  data: User[]
  page: number
  page_size: number
  has_next: boolean
  total?: number
}

export function GlobalAdminUsersSection() {
  const { t } = useTranslation(['users', 'global-admin'])
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { canAccessUsers, isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const canListUsers = isRootAdmin || hasAnyPermission(['user:l', 'user:r'])
  const canCreateUser = isRootAdmin || hasPermission('user:c')
  const canUpdateUser = isRootAdmin || hasPermission('user:u')
  const canDeleteUser = isRootAdmin || hasPermission('user:d')

  const globalUsersQueryKey = ["global-users", page, pageSize] as const

  const { data: usersResponse, isLoading, error, refetch } = useQuery({
    queryKey: globalUsersQueryKey,
    queryFn: () => getGlobalUsers(page, pageSize),
    enabled: canListUsers
  }) as {
    data: GlobalUsersResponse | undefined
    isLoading: boolean
    error: any
    refetch: () => Promise<any>
  }
  const userMutations = useUserMutations([["global-users"]])

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
      await queryClient.invalidateQueries({ queryKey: ["global-users"] })
      await refetch()
      toast.success(t('common:dataRefreshed'))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t('common:refreshFailed') })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleMakeOrganizationAdmin = (user: User) => {
    toast.info(t('global-admin:toast.orgAdminPending', { name: `${user.name} ${user.last_name}` }))
    console.log("Organization admin intent", user)
  }

  const translateStatusI18n = (status: string) => {
    const statusMap: Record<string, string> = {
      active: t('common:active'),
      inactive: t('common:inactive'),
      pending: t('common:pending'),
    }
    return statusMap[status] || status
  }

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      label: t('common:name'),
      render: (user) => (
        <div className="flex flex-col gap-0">
          <span className="text-xs font-medium text-foreground leading-tight">
            {user.name} {user.last_name}
          </span>
          {user.activated_at && (
            <span className="text-[10px] text-muted-foreground leading-tight">
              {t('activated', { date: formatDate(user.activated_at) })}
            </span>
          )}
        </div>
      )
    },
    {
      key: "email",
      label: t('common:email'),
      render: (user) => (
        <span className="text-xs text-blue-600 font-medium">{user.email}</span>
      )
    },
    {
      key: "root-admin",
      label: t('columns.rootAdmin'),
      render: (user) => (
        user.is_root_admin ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            <Shield className="w-2 h-2 mr-0.5" />
            {t('common:yes')}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{t('common:no')}</span>
        )
      )
    },
    {
      key: "status",
      label: t('common:status'),
      render: (user) => (
        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
          {translateStatusI18n(user.status)}
        </Badge>
      )
    },
    {
      key: "created",
      label: t('columns.created'),
      render: (user) => (
        <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
      )
    }
  ]

  const actions: TableAction<User>[] = [
    {
      key: "approve",
      label: t('actions.approveUser'),
      icon: Check,
      onClick: (user) => userMutations.approveUser.mutate(user.id),
      show: (user) => user.status === 'pending' && canUpdateUser,
      className: "text-green-600"
    },
    {
      key: "reject",
      label: t('actions.rejectUser'),
      icon: X,
      onClick: (user) => userMutations.rejectUser.mutate(user.id),
      show: (user) => user.status === 'pending' && canUpdateUser,
      separator: true,
      destructive: true
    },
    {
      key: "assign-organization",
      label: t('actions.assignToOrganization'),
      icon: Building,
      onClick: (user) => updateState({ organizationUser: user }),
      show: () => isRootAdmin
    },
    {
      key: "manage-root-admin",
      label: t('actions.manageRootAdmin'),
      icon: ShieldCheck,
      onClick: (user) => updateState({ rootAdminUser: user }),
      show: () => isRootAdmin
    },
    {
      key: "make-org-admin",
      label: t('actions.makeOrgAdmin'),
      icon: Shield,
      onClick: handleMakeOrganizationAdmin,
      show: () => isRootAdmin,
      separator: true
    },
    {
      key: "edit",
      label: t('actions.editUser'),
      icon: Edit,
      onClick: (user) => updateState({ editingUser: user }),
      show: () => canUpdateUser,
      separator: true
    },
    {
      key: "delete",
      label: t('actions.deleteUser'),
      icon: Trash2,
      onClick: (user) => updateState({ deletingUser: user }),
      show: () => canDeleteUser,
      destructive: true
    }
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0">
        <PageHeader
          icon={Users}
          title={t('header.title')}
          badges={[
            { label: "", value: t('header.usersCount', { count: filteredUsers.length }) }
          ]}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
          hasError={!!error}
          primaryAction={canCreateUser ? {
            label: t('header.addUser'),
            icon: Plus,
            onClick: () => updateState({ showCreateDialog: true }),
            protectedContent: (
              <ProtectedComponent permission="user:c">
                <Button
                  size="sm"
                  onClick={() => updateState({ showCreateDialog: true })}
                  disabled={!!error}
                  className="hover:cursor-pointer h-8 text-xs px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('header.addUser')}
                </Button>
              </ProtectedComponent>
            )
          } : undefined}
          searchConfig={{
            placeholder: t('header.searchPlaceholder'),
            value: state.searchTerm,
            onChange: (value) => updateState({ searchTerm: value })
          }}
        >
          <Select value={state.filterStatus} onValueChange={(value) => updateState({ filterStatus: value })}>
            <SelectTrigger className="w-full md:w-36 h-8 hover:cursor-pointer text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('header.filterAllStatus')}</SelectItem>
              <SelectItem value="active">{t('header.filterActive')}</SelectItem>
              <SelectItem value="inactive">{t('header.filterInactive')}</SelectItem>
              <SelectItem value="pending">{t('header.filterPending')}</SelectItem>
            </SelectContent>
          </Select>
        </PageHeader>
      </div>

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
            title: t('emptyState.title'),
            description: t('emptyState.description')
          }}
          showFooterStats={false}
          maxHeight="flex-1 min-h-0"
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
            pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000]
          }}
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
