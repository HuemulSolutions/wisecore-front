import { useState, useEffect } from "react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, User, Crown, UserPlus } from "lucide-react"
import { useOrganizationUsers, useSetOrganizationAdmin } from "@/hooks/useOrganizations"
import { useTranslation } from "react-i18next"
import type { Organization } from "./organization-table"

interface SetOrganizationAdminDialogProps {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SetOrganizationAdminDialog({
  organization,
  open,
  onOpenChange,
  onSuccess,
}: SetOrganizationAdminDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const { t } = useTranslation('organizations')

  const { data: usersResponse, isLoading, error } = useOrganizationUsers(
    open ? organization?.id : undefined
  )

  const setAdminMutation = useSetOrganizationAdmin()

  // Reset selection when dialog opens/closes or organization changes
  useEffect(() => {
    if (open) {
      setSelectedUserId("")
    }
  }, [open, organization?.id])

  const handleSave = () => {
    if (!organization?.id || !selectedUserId) return

    setAdminMutation.mutate(
      { organizationId: organization.id, userId: selectedUserId },
      {
        onSuccess: () => {
          onSuccess?.()
          onOpenChange(false)
        },
      }
    )
  }

  if (!organization) return null

  const users = usersResponse?.data || []
  
  // Separate users into admins and non-admins
  const currentAdmins = users.filter(user => user.is_org_admin)
  const availableUsers = users.filter(user => !user.is_org_admin)

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('setAdmin.title')}
      description={t('setAdmin.description', { name: organization.name })}
      icon={Shield}
      maxWidth="sm:max-w-lg"
      saveAction={{
        label: t('setAdmin.button'),
        disabled: !selectedUserId || setAdminMutation.isPending,
        loading: setAdminMutation.isPending,
        closeOnSuccess: false,
        onClick: handleSave,
      }}
    >
      <div className="space-y-5 py-2">
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive p-3 border border-destructive/20 rounded-lg bg-destructive/5">
            {t('setAdmin.failedToLoadUsers', { error: error.message })}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-6 border rounded-lg bg-muted/20">
            <User className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">
              {t('setAdmin.noUsersFound')}
            </div>
          </div>
        ) : (
          <>
            {/* Current Admins Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Crown className="w-4 h-4 text-amber-500" />
                {t('setAdmin.currentAdmins', { count: currentAdmins.length })}
              </div>

              {currentAdmins.length === 0 ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('setAdmin.noAdmins')}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {currentAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium shrink-0">
                        {admin.name.charAt(0)}{admin.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {admin.name} {admin.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {admin.email}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {t('setAdmin.adminBadge')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Admin Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <UserPlus className="w-4 h-4 text-[#4464f7]" />
                {t('setAdmin.addNewAdmin')}
              </div>

              {availableUsers.length === 0 ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('setAdmin.allUsersAdmins')}
                  </p>
                </div>
              ) : (
                <HuemulField
                  type="select"
                  label=""
                  placeholder={t('setAdmin.selectUserPlaceholder')}
                  value={selectedUserId}
                  onChange={(v) => setSelectedUserId(String(v))}
                  options={availableUsers.map((user) => ({
                    label: `${user.name} ${user.last_name} (${user.email})`,
                    value: user.id,
                  }))}
                />
              )}
            </div>

            {/* Info message */}
            {selectedUserId && (
              <div className="text-xs text-muted-foreground p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                {t('setAdmin.adminInfoMessage')}
              </div>
            )}
          </>
        )}
      </div>
    </HuemulDialog>
  )
}
