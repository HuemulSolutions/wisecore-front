import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, RefreshCw, UserCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { useRoleWithAllUsers, useRoleMutations, rbacQueryKeys } from "@/hooks/useRbac"
import { type Role } from "@/services/rbac"

interface AssignRoleToUsersDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AssignRoleToUsersDialog({
  role,
  open,
  onOpenChange,
  onSuccess
}: AssignRoleToUsersDialogProps) {
  const { t } = useTranslation(['roles', 'common'])
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [, setHasInitialized] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  // Fetch role with all users when sheet is open
  const { data: roleUsersResponse, isLoading, error, refetch } = useRoleWithAllUsers(role?.id || '', open && !!role, page, pageSize, searchQuery || undefined)
  const { assignUsersToRole } = useRoleMutations()

  const users = roleUsersResponse?.data?.users || []

  // Reset state when sheet closes or role changes
  useEffect(() => {
    if (!open || !role) {
      setSelectedUsers([])
      setSearchInput("")
      setSearchQuery("")
      setHasInitialized(false)
      setPage(1)
    }
  }, [open, role?.id])

  // Initialize selected users when data loads
  useEffect(() => {
    if (open && role && !isLoading && !error && users.length >= 0) {
      const assignedUserIds = users.filter(user => user.has_role).map(user => user.id)
      setSelectedUsers(assignedUserIds)
      setHasInitialized(true)
    }
  }, [open, role?.id, isLoading, error, JSON.stringify(users.map(u => ({ id: u.id, has_role: u.has_role })))])

  // Invalidate queries when sheet opens
  useEffect(() => {
    if (open && role) {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roleWithAllUsers(role.id, page, pageSize, searchQuery || undefined) })
    }
  }, [open, role?.id, queryClient])

  const hasNext = roleUsersResponse?.has_next ?? false
  const hasPrevious = page > 1

  const handleSubmit = async (): Promise<void> => {
    if (!role) return

    await new Promise<void>((resolve, reject) => {
      assignUsersToRole.mutate({
        roleId: role.id,
        userIds: selectedUsers,
      }, {
        onSuccess: () => {
          onSuccess?.()
          resolve()
        },
        onError: (error) => reject(error),
      })
    })
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const handleRefresh = async () => {
    if (role) {
      await refetch()
    }
  }

  const handleRetry = async () => {
    if (error && role) {
      await refetch()
    }
  }

  // const isPending = assignUsersToRole.isPending
  const hasErrors = !!error
  const isDataLoading = isLoading

  if (!role) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('roles:assignToUsers.title')}
      description={t('roles:assignToUsers.description', { name: role.name })}
      icon={UserCheck}
      maxWidth="w-full sm:max-w-[90vw] lg:max-w-[600px]"
      showCancelButton={false}
      extraActions={[{
        label: t('common:cancel'),
        variant: "outline",
        position: "header",
        onClick: () => onOpenChange(false),
      }]}
      saveAction={{
        label: t('roles:assignToUsers.button'),
        onClick: handleSubmit,
        disabled: hasErrors || users.length === 0,
        position: "header",
      }}
    >
      <div className="space-y-4 py-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('roles:assignToUsers.availableUsers')}</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {t('roles:permissions.selected', { count: selectedUsers.length })}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1" onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchQuery(searchInput)
                setPage(1)
              }
            }}>
              <HuemulField
                label=""
                placeholder={t('roles:assignToUsers.searchPlaceholder')}
                value={searchInput}
                onChange={(value) => setSearchInput(String(value))}
                inputClassName="h-8 text-xs"
              />
            </div>
            <HuemulButton
              variant="outline"
              size="sm"
              icon={Search}
              onClick={() => {
                setSearchQuery(searchInput)
                setPage(1)
              }}
              className="h-8 w-8 p-0 hover:cursor-pointer"
              aria-label={t('common:search')}
            />
            <HuemulButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefresh}
              disabled={isDataLoading}
              className="h-8 w-8 p-0 hover:cursor-pointer"
              aria-label={t('common:refresh')}
            />
          </div>

                {isDataLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2 border rounded-md">
                        <Skeleton className="h-3 w-3 rounded" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-2 w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasErrors ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                    <p className="text-red-600 mb-4 font-medium">
                      {error?.message || t('roles:assignToUsers.errorLoading')}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {t('roles:assignToUsers.errorDescription')}
                    </p>
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      className="hover:cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('common:tryAgain')}
                    </Button>
                  </div>
                ) : users.length === 0 && searchQuery ? (
                  <Card className="p-6 text-center">
                    <Search className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold mb-2">{t('roles:assignToUsers.noUsersFound')}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('roles:assignToUsers.adjustSearch')}
                    </p>
                  </Card>
                ) : users.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold mb-2">{t('roles:assignToUsers.noUsers')}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('roles:assignToUsers.noUsersCreated')}
                    </p>
                  </Card>
                ) : (
                  <div className="border rounded-md flex flex-col">
                    {/* Select All */}
                    <div className="flex items-center space-x-3 p-3 rounded-md border-b">
                      <Checkbox
                        id="select-all"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        {t('roles:assignToUsers.selectAll', { count: users.length })}
                      </label>
                    </div>

                    <div className="overflow-y-auto max-h-[75vh] p-3 space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/30 transition-colors">
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={user.id}
                              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 mb-0.5"
                            >
                              <span className="truncate">{user.name} {user.last_name}</span>
                              {user.is_root_admin && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                  Admin
                                </Badge>
                              )}
                            </label>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination footer */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-muted/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {t('common:pagination.itemsPerPage')}
                        </span>
                        <Select
                          value={pageSize.toString()}
                          onValueChange={(v) => {
                            setPageSize(Number(v))
                            setPage(1)
                          }}
                        >
                          <SelectTrigger className="h-7 w-[64px] text-xs hover:cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 25, 50].map((s) => (
                              <SelectItem key={s} value={s.toString()} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {t('common:pagination.page')} {page}
                      </span>

                      <div className="flex items-center gap-1">
                        <HuemulButton
                          variant="outline"
                          size="sm"
                          icon={ChevronLeft}
                          aria-label="Previous page"
                          onClick={() => setPage((p) => p - 1)}
                          disabled={!hasPrevious}
                          className="h-7 w-7 p-0"
                        />
                        <HuemulButton
                          variant="outline"
                          size="sm"
                          icon={ChevronRight}
                          aria-label="Next page"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={!hasNext}
                          className="h-7 w-7 p-0"
                        />
                      </div>
                    </div>
                  </div>
                )}
        </div>
      </div>
    </HuemulSheet>
  )
}