import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { UserCheck, Shield, RefreshCw } from "lucide-react"
import { useUserAllRoles, useRoleMutations, rbacQueryKeys } from "@/hooks/useRbac"
import { userQueryKeys } from "@/hooks/useUsers"
import { type User } from "@/types/users"

interface AssignRolesSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AssignRolesSheet({ user, open, onOpenChange, onSuccess }: AssignRolesSheetProps) {
  const { t } = useTranslation(['roles', 'common'])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [, setHasInitialized] = useState(false)
  const queryClient = useQueryClient()
  
  // Fetch all roles with user assignment status when sheet is open
  const { data: userAllRolesResponse, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useUserAllRoles(user?.id || '', open && !!user)
  const { assignRoles } = useRoleMutations()

  const roles = userAllRolesResponse?.data || []

  // Reset state when sheet closes or user changes
  useEffect(() => {
    if (!open || !user) {
      setSelectedRoles([])
      setHasInitialized(false)
    }
  }, [open, user?.id])

  // Initialize selected roles when data loads or changes
  useEffect(() => {
    if (open && user && !rolesLoading && !rolesError && roles.length >= 0) {
      const assignedRoleIds = roles.filter(role => role.has_role).map(role => role.id)
      setSelectedRoles(assignedRoleIds)
      setHasInitialized(true)
    }
  }, [open, user?.id, rolesLoading, rolesError, JSON.stringify(roles.map(r => ({ id: r.id, has_role: r.has_role })))])

  // Invalidate queries when sheet opens
  useEffect(() => {
    if (open && user) {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.userAllRoles(user.id) })
    }
  }, [open, user?.id, queryClient])

  const handleSubmit = async (): Promise<void> => {
    if (!user) return

    await new Promise<void>((resolve, reject) => {
      assignRoles.mutate({
        userId: user.id,
        roleIds: selectedRoles,
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
          onSuccess?.()
          resolve()
        },
        onError: (error) => reject(error),
      })
    })
  }

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleRetry = async () => {
    if (rolesError && user) {
      await refetchRoles()
    }
  }

  // const isLoading = assignRoles.isPending
  const hasErrors = !!rolesError
  const isDataLoading = rolesLoading

  if (!user) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('roles:assignRoles.title')}
      description={t('roles:assignRoles.description', { name: `${user.name} ${user.last_name}`, email: user.email })}
      icon={UserCheck}
      maxWidth="w-full sm:max-w-[90vw] lg:max-w-150"
      showCancelButton={false}
      extraActions={[{
        label: t('common:cancel'),
        variant: "outline",
        position: "header",
        onClick: () => onOpenChange(false),
      }]}
      saveAction={{
        label: t('roles:assignRoles.button'),
        onClick: handleSubmit,
        disabled: hasErrors || roles.length === 0,
        position: "header",
      }}
    >
      <div className="space-y-4 py-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('roles:assignRoles.availableRoles')}</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {t('roles:permissions.selected', { count: selectedRoles.length })}
            </Badge>
          </div>

            {isDataLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 border rounded-md">
                    <Skeleton className="h-3 w-3 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-32" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasErrors ? (
              <div className="flex flex-col items-center justify-center min-h-75 text-center rounded-lg border border-dashed bg-muted/50 p-8">
                <p className="text-red-600 mb-4 font-medium">
                  {rolesError?.message || t('roles:assignRoles.errorLoading')}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('roles:assignRoles.errorDescription')}
                </p>
                <HuemulButton
                  label={t('common:tryAgain')}
                  icon={RefreshCw}
                  onClick={handleRetry}
                  variant="outline"
                />
              </div>
            ) : roles.length === 0 ? (
              <Card className="p-6 text-center">
                <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold mb-2">{t('roles:assignRoles.noRoles')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('roles:assignRoles.noRolesCreated')}
                </p>
              </Card>
            ) : (
              <div className="border rounded-md p-3">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-3 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/30 transition-colors">
                      <Checkbox
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={role.id}
                              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 mb-1"
                            >
                              <Shield className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{role.name}</span>
                            </label>
                            {role.description && (
                              <p className="text-xs text-muted-foreground leading-tight mb-1 line-clamp-2">
                                {role.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {role.permission_num !== undefined && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                {role.permission_num}
                              </Badge>
                            )}
                            {role.users_count !== undefined && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {role.users_count} users
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </HuemulSheet>
  )
}