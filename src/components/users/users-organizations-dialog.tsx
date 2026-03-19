// Dialog component for viewing user organizations
import { useState } from "react"
import { useTranslation } from 'react-i18next'
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Plus, Trash2 } from "lucide-react"
import { useUserOrganizations } from "@/hooks/useUsers"
import { type User, type UserOrganization } from "@/types/users"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { assignUserToOrganization, removeUserFromOrganization } from "@/services/users"
import { getAllOrganizations } from "@/services/organizations"
import { type Organization } from "@/components/organization"
import { toast } from "sonner"

interface UserOrganizationsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UserOrganizationsDialog({ user, open, onOpenChange }: UserOrganizationsDialogProps) {
  const { t } = useTranslation(['users'])
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [orgToRemove, setOrgToRemove] = useState<{ id: string; name: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: organizationsResponse, isLoading: isLoadingUserOrgs, error } = useUserOrganizations(user?.id)
  
  // Fetch all organizations to show available ones for assignment
  const { data: allOrgsResponse, isLoading: isLoadingAllOrgs } = useQuery({
    queryKey: ['organizations', 'all-for-assignment'],
    queryFn: () => getAllOrganizations(1, 1000),
    enabled: !!user,
  })

  const isLoading = isLoadingUserOrgs || isLoadingAllOrgs

  const assignMutation = useMutation({
    mutationFn: (organizationId: string) => 
      assignUserToOrganization(organizationId, { user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'organizations', user?.id] })
      toast.success(t('users:organizations.assignedSuccess'))
      setSelectedOrganizationId("")
    },
  })

  const removeMutation = useMutation({
    mutationFn: (organizationId: string) => 
      removeUserFromOrganization(organizationId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'organizations', user?.id] })
      toast.success(t('users:organizations.removedSuccess'))
    },
  })

  if (!user) return null

  const userOrganizations = organizationsResponse?.data || []
  const allOrganizations = (allOrgsResponse?.data || []) as Organization[]
  
  // Organizations where the user is a member
  const memberOrganizations = userOrganizations.filter((org: UserOrganization) => org.member)
  
  // IDs of organizations where user is already a member
  const memberOrgIds = new Set(memberOrganizations.map((org: UserOrganization) => org.id))
  
  // Organizations available for assignment (those where user is NOT a member)
  const availableOrganizations = allOrganizations.filter(
    (org: Organization) => !memberOrgIds.has(org.id)
  )

  return (
    <>
      <HuemulDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('users:organizations.dialogTitle', { name: `${user.name} ${user.last_name}` })}
        description={t('users:organizations.dialogDescription')}
        icon={Building}
        maxWidth="sm:max-w-md"
        maxHeight="max-h-[90vh]"
        showFooter={false}
      >
        <div className="space-y-4">
          {/* Assign organization section */}
          {availableOrganizations.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="text-sm font-medium mb-3">{t('users:organizations.assignTitle')}</div>
              <div className="flex gap-2">
                <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                  <SelectTrigger className="flex-1 w-full">
                    <SelectValue placeholder={t('users:organizations.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrganizations.map((org: Organization) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <HuemulButton
                  label={t('users:organizations.assignButton')}
                  icon={Plus}
                  onClick={() => assignMutation.mutate(selectedOrganizationId)}
                  disabled={!selectedOrganizationId}
                  loading={assignMutation.isPending}
                  size="sm"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                {t('users:organizations.failedToLoad', { error: error.message })}
              </div>
            </div>
          ) : memberOrganizations.length > 0 ? (
            <div className="space-y-3">
              {memberOrganizations.map((org: UserOrganization) => (
                <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{org.name}</div>
                    {org.description && (
                      <div className="text-xs text-muted-foreground">{org.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {t('users:organizations.memberBadge')}
                    </Badge>
                    <HuemulButton
                      icon={Trash2}
                      size="sm"
                      variant="destructive"
                      className="h-6 px-2"
                      loading={removeMutation.isPending}
                      onClick={() => setOrgToRemove({ id: org.id, name: org.name })}
                      tooltip={t('users:organizations.removeTooltip')}
                      tooltipSide="left"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <div className="text-sm font-medium text-foreground mb-1">{t('users:organizations.noOrganizations')}</div>
              <div className="text-sm text-muted-foreground">
                {t('users:organizations.noOrganizationsDescription')}
              </div>
            </div>
          )}
        </div>
      </HuemulDialog>

      <HuemulAlertDialog
        open={!!orgToRemove}
        onOpenChange={(open) => !open && setOrgToRemove(null)}
        title={t('users:organizations.removeTitle')}
        description={t('users:organizations.removeDescription', { userName: `${user.name} ${user.last_name}`, orgName: orgToRemove?.name })}
        actionLabel={t('users:organizations.removeButton')}
        onAction={async () => {
          if (!orgToRemove) return
          await new Promise<void>((resolve, reject) => {
            removeMutation.mutate(orgToRemove.id, {
              onSuccess: () => resolve(),
              onError: (e) => reject(e)
            })
          })
        }}
      />
    </>
  )
}
